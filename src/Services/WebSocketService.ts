import { WebSocketAdapter } from "./WebSocketAdapter"
import { sleep } from "../../src/utils"
import { Command, CommandState } from "./Commands/Command"
import type { Toast } from "../../src/contexts/ToastsContext"

import {
    NotificationHandler,
    parseNotification,
    parseError,
    createConnectionErrorToast,
    createReconnectionToast,
    createMaxReconnectionToast,
} from "./NotificationHandlers"

export enum ControllerStatus {
    CONNECTION_LOST,
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    UNKNOWN_DEVICE,
}

export type ControllerStatusListener = (status: ControllerStatus) => void

/**
 * Service context for dependency injection
 * Provides access to app-level contexts from within the service
 */
export interface ServiceContext {
    dialogs: {
        setShowKeepConnected: (show: boolean) => void
    }
    activity?: {
        stopPolling: (id?: string) => void
    }
    modalsCleared?: () => void
    extensionsNotify?: (type: string, data: any, targetId?: string) => void
    uiSettings?: {
        getValue: (id: string) => any
    }
}

export class WebSocketService {
    private wsAdapter: WebSocketAdapter
    private buffer: string = ""
    private commands: Command[] = []
    private _status: ControllerStatus = ControllerStatus.DISCONNECTED
    private currentVersion: string | undefined
    private statusListeners: ControllerStatusListener[] = []

    // Auto-reconnection settings
    private reconnectAttempts: number = 0
    private maxReconnectAttempts: number = 4
    private baseRetryDelayMs: number = 2000
    private reconnectTimeoutId: NodeJS.Timeout | undefined
    private isManualDisconnect: boolean = false

    // Notification handler (optional)
    private notificationHandler: NotificationHandler | undefined

    // Ping/keep-alive settings
    private pingIntervalId: NodeJS.Timeout | undefined
    private pingDelayMs: number = 5000 // 5 seconds
    private isPingPaused: boolean = false
    private sessionId: string | undefined
    private pingListeners: Array<(timeRemaining: number, maxTime: number) => void> = []
    private sessionTimeoutListener: (() => void) | undefined

    // Error handler (called when ERROR message received from controller)
    private errorHandler: ((errorCode: string, errorMessage: string) => void) | undefined

    // Data routing (for core message processing)
    private dataListeners: Array<(type: string, data: string) => void> = []
    private binaryDataListeners: Array<(data: string) => void> = []

    // Connection state listener (for UI updates)
    // Matches UiContext ConnectionState: { connected: boolean; page: string; extraMsg?: string; updating?: boolean }
    private connectionStateListener:
        | ((state: { connected: boolean; page: string; extraMsg?: string; updating?: boolean }) => void)
        | undefined

    // Service context for dependency injection (app-level contexts)
    private serviceContext: ServiceContext | undefined

    constructor(wsAdapter: WebSocketAdapter, notificationHandler?: NotificationHandler) {
        this.wsAdapter = wsAdapter
        this.notificationHandler = notificationHandler

        // Register main data listener
        this.wsAdapter.addReader(this.onData)
        this.wsAdapter.addReader(this._handleSystemMessage)

        // Register binary data listener for terminal/stream data
        this.wsAdapter.addBinaryReader(this._handleBinaryData)

        // Register error listener
        this.wsAdapter.addErrorListener(this._handleWebSocketError)
    }

    /**
     * Sets the service context for dependency injection
     * Provides access to app-level contexts (connectionSettings, dialogs, etc.)
     */
    setServiceContext(context: ServiceContext): void {
        this.serviceContext = context
    }

    /**
     * Establishes connection and initializes the controller
     * Automatically attempts to reconnect on connection loss
     */
    async connect(): Promise<ControllerStatus> {
        try {
            this.status = ControllerStatus.CONNECTING
            this.isManualDisconnect = false
            this._updateConnectionState({ connected: false, page: "connecting" })
            if (!this.wsAdapter.isOpen()) {
                await this.wsAdapter.open()
            }

            this.status = ControllerStatus.CONNECTED
            this.reconnectAttempts = 0

            // Start ping mechanism
            this._startPing()

            // Update connection state
            this._updateConnectionState({ connected: true, page: "/" })

            // Notify extensions that we're connected
            if (this.serviceContext?.extensionsNotify) {
                this.serviceContext.extensionsNotify("notification", { isConnected: true }, "all")
            }

            // Set up disconnect listener for auto-reconnection
            this.wsAdapter.getNativeWebSocket().addEventListener("close", () => {
                if (this.status === ControllerStatus.CONNECTED) {
                    this._handleConnectionLost()
                }
            })

            return this.status
        } catch (error) {
            console.error("Failed to connect to controller:", error)
            this.status = ControllerStatus.DISCONNECTED
            this._scheduleReconnection()
            throw error
        }
    }

    /**
     * Disconnects from the controller
     * @param stopReconnect - If true, marks as manually disconnected (no auto-reconnect)
     * @param reason - Reason for disconnection (for UI feedback)
     */
    async disconnect(reason: string = "disconnected", stopReconnect: boolean = true): Promise<void> {
        console.log("Disconnect:", reason);

        this._updateConnectionState({ connected: false, page: reason })
        this._stopPing()
        if (stopReconnect) {
            this.isManualDisconnect = true
            this.status = ControllerStatus.DISCONNECTED
            this._cancelReconnection()
        }

        this._performDisconnectCleanup()
        return this.wsAdapter.close()
    }

    /**
     * Handles connection loss and initiates auto-reconnection
     */
    private _handleConnectionLost(): void {
        console.log("Connection lost, attempting auto-reconnect")
        this.status = ControllerStatus.CONNECTION_LOST
        this._updateConnectionState({ connected: false, page: "connectionlost" })
        this._showToast(createConnectionErrorToast("connectionlost"))
        this._scheduleReconnection()
    }

    /**
     * Schedules a reconnection attempt
     */
    private _scheduleReconnection(): void {
        // Check if reconnection is allowed
        if (this.isManualDisconnect) {
            return
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`)
            this.status = ControllerStatus.DISCONNECTED
            this._showToast(createMaxReconnectionToast())
            this._updateConnectionState({ connected: false, page: "connectionlost" })
            this._performDisconnectCleanup()
            return
        }

        this.reconnectAttempts++
        this._showToast(createReconnectionToast(this.reconnectAttempts, this.maxReconnectAttempts))

        this._cancelReconnection()
        this.reconnectTimeoutId = setTimeout(
            () => this.connect().catch(() => this._scheduleReconnection()),
            this.baseRetryDelayMs
        )
    }

    /**
     * Performs disconnect cleanup (called when max reconnections reached)
     * Stops polling, clears modals, and notifies extensions
     */
    private _performDisconnectCleanup(): void {
        // Stop any polling activity
        if (this.serviceContext?.activity) {
            this.serviceContext.activity.stopPolling()
        }

        // Clear all modals
        if (this.serviceContext?.modalsCleared) {
            this.serviceContext.modalsCleared()
        }

        // Notify extensions that we're disconnected
        if (this.serviceContext?.extensionsNotify) {
            this.serviceContext.extensionsNotify("notification", { isConnected: false }, "all")
        }
    }

    /**
     * Cancels any pending reconnection attempt
     */
    private _cancelReconnection(): void {
        if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId)
            this.reconnectTimeoutId = undefined
        }
    }

    /**
     * Sets or updates the notification handler
     */
    setNotificationHandler(handler: NotificationHandler | undefined): void {
        this.notificationHandler = handler
    }

    /**
     * Displays a toast notification if handler is available
     */
    private _showToast(toast: Omit<Toast, "id">): void {
        if (this.notificationHandler) {
            this.notificationHandler.addToast(toast)
        } else {
            console.log(`[${toast.type.toUpperCase()}] ${toast.content}`)
        }
    }

    /**
     * Handles incoming system messages (NOTIFICATION, ERROR, PING, CURRENTID, etc.)
     * Using arrow function to preserve 'this' context when passed as a callback
     */
    private _handleSystemMessage = (message: string): void => {
        const parts = message.split(":")
        if (parts.length < 2) {
            return
        }

        const messageType = parts[0].toUpperCase()

        switch (messageType) {
            case "CURRENTID": {
                // Receive and store session ID both internally and in service context
                if (parts[1]) {
                    const sessionId = parts[1]
                    console.log(`Received session ID: ${  sessionId}`)
                    this.setSessionId(sessionId)
                }
                break
            }
            case "ACTIVEID": {
                // Another session connected - check if it's a different session
                if (parts[1]) {
                    const incomingSessionId = parts[1]

                    // Disconnect if this is a different session ID than ours
                    if (incomingSessionId !== this.getSessionId()) {
                        if ((this.serviceContext?.uiSettings?.getValue("disconnectonotherlogin") ?? true)) {                        
                            console.warn(`Another session connected with different ID ${incomingSessionId}, disconnecting`)
                            // this._showToast(createConnectionErrorToast("already connected"))
                            this.disconnect("already connected")
                        }
                        else
                            console.log(`Another session connected with different ID ${incomingSessionId}, but disconnectonotherlogin = false`)
                    }
                }
                break
            }
            case "PING": {
                // Handle ping response
                this._handlePingResponse(parts)
                break
            }
            case "NOTIFICATION": {
                console.log(`Notification: ${  message}`)

                const notification = parseNotification(message)
                if (notification) {
                    this._showToast(notification)
                }
                break
            }
            case "ERROR": {
                console.log(message)

                // Parse error and call error handler if set
                const parts = message.split(":")
                if (parts.length >= 3) {
                    const errorCode = parts[1]
                    const errorMessage = parts.slice(2).join(":")

                    // Call error handler if registered (for aborting HTTP requests, etc.)
                    if (this.errorHandler) {
                        this.errorHandler(errorCode, errorMessage)
                    }
                }

                const error = parseError(message)
                if (error) {
                    this._showToast(error)
                }
                break
            }
        }
    }

    private onData = (data: string): void => {
        this.buffer += data.replace(/\r/g, "")

        let endLineIndex = this.buffer.indexOf("\n")
        while (endLineIndex >= 0) {
            const line = this.buffer.substring(0, endLineIndex)
            this.buffer = this.buffer.substring(endLineIndex + 1)

            // Check if this is a system message
            if (this.commands.length) {
                if (this.commands[0].debugReceive) {
                    console.log(`<<< ${  line}`)
                }
                this.commands[0].appendLine(line)
                if (this.commands[0].state === CommandState.DONE) {
                    this.commands = this.commands.slice(1)
                }
            } else {
                // Route unhandled core messages to data listeners
                console.log(`<<< ${  line}`)
                this._notifyDataListeners("core", line)
            }
            endLineIndex = this.buffer.indexOf("\n")
        }
    }

    /**
     * Writes raw data to the controller
     */
    async write(data: string | Buffer): Promise<void> {
        // Wait for other commands to finish
        while (this.commands.length > 0) {
            await sleep(100)
        }

        const stringData = typeof data === "string" ? data : data.toString()
        await this.wsAdapter.write(stringData)
        await sleep(100)
    }

    /**
     * Sends a command and waits for response
     */
    async send<T extends Command>(command: T, timeoutMs: number = 0): Promise<T> {
        if (!this.wsAdapter.isOpen()) {
            return command
        }

        if (command.debugSend) {
            console.log(`sending ${  command.getCommand()}`)
        }

        // Wait for other commands to finish
        while (this.commands.length > 0) {
            await sleep(100)
        }

        this.commands.push(command)
        const result = new Promise<T>((resolve, reject) => {
            let timer: NodeJS.Timeout | undefined
            if (timeoutMs > 0) {
                timer = setTimeout(() => {
                    this._removeCommand(command)
                    reject("Command timed out")
                }, timeoutMs)
            }
            (command as Command).onDone = async () => {
                if (timer) {
                    clearTimeout(timer)
                }
                resolve(command)
            }
        })

        this.buffer = ""
        await this.wsAdapter.write(`${command.getCommand()  }\n`)
        return result
    }

    private _removeCommand(command: Command): void {
        this.commands = this.commands.filter((c) => c !== command)
    }

    /**
     * Reconnects to the controller
     */
    async hardReset(): Promise<void> {
        this.status = ControllerStatus.CONNECTING
        try {
            this.reconnectAttempts = 0
            await this.disconnect("disconnected", false)
            await sleep(500)
            await this.connect()
        } catch (error) {
            console.error("Hard reset failed:", error)
            this.status = ControllerStatus.DISCONNECTED
            throw error
        }
    }

    /**
     * Configures auto-reconnection settings
     */
    setReconnectConfig(options: { maxAttempts?: number; baseDelayMs?: number }): void {
        if (options.maxAttempts !== undefined) {
            this.maxReconnectAttempts = options.maxAttempts
        }
        if (options.baseDelayMs !== undefined) {
            this.baseRetryDelayMs = options.baseDelayMs
        }
    }

    /**
     * Gets current reconnection attempt count
     */
    getReconnectAttempts(): number {
        return this.reconnectAttempts
    }

    /**
     * Checks if a reconnection is pending
     */
    isReconnectPending(): boolean {
        return this.reconnectTimeoutId !== undefined
    }

    /**
     * Sets the session ID (typically from CURRENTID message)
     */
    setSessionId(sessionId: string): void {
        this.sessionId = sessionId
    }

    /**
     * Gets the current session ID
     */
    getSessionId(): string | undefined {
        return this.sessionId
    }

    /**
     * Pauses ping messages (useful during HTTP requests)
     */
    setPingPaused(paused: boolean): void {
        this.isPingPaused = paused
    }

    /**
     * Checks if ping is paused
     */
    isPingPausedStatus(): boolean {
        return this.isPingPaused
    }

    /**
     * Configures ping settings
     */
    setPingConfig(options: { delayMs?: number }): void {
        if (options.delayMs !== undefined) {
            this.pingDelayMs = options.delayMs
        }
    }

    /**
     * Starts the ping mechanism (automatic after connect)
     */
    private _startPing(): void {
        if (this.pingIntervalId) {
            return // Already running
        }

        const sendPing = () => {
            if (this.isManualDisconnect) {
                return
            }

            if (!this.isPingPaused && this.wsAdapter.isOpen()) {
                const pingmsg = `PING:${this.sessionId || "none"}`
                try {
                    this.wsAdapter.write(pingmsg)
                } catch (error) {
                    console.error("Failed to send ping:", error)
                }
            }

            // Schedule next ping
            this.pingIntervalId = setTimeout(sendPing, this.pingDelayMs)
        }

        // Send first ping immediately, then schedule the rest
        sendPing()
    }

    /**
     * Stops the ping mechanism
     */
    private _stopPing(): void {
        if (this.pingIntervalId) {
            clearTimeout(this.pingIntervalId)
            this.pingIntervalId = undefined
        }
    }

    /**
     * Handles PING response messages
     * Format: PING:timeRemaining:maxTime
     */
    private _handlePingResponse(parts: string[]): void {
        if (parts.length < 3) {
            return
        }

        const timeRemaining = parseInt(parts[1], 10)
        const maxTime = parseInt(parts[2], 10)

        // Notify listeners
        this.pingListeners.forEach((listener) => {
            try {
                listener(timeRemaining, maxTime)
            } catch (error) {
                console.error("Error in ping listener:", error)
            }
        })

        // Check for session timeout
        if (timeRemaining <= 0) {
            console.warn("Session timeout detected (timeRemaining <= 0)")
            if (this.sessionTimeoutListener) {
                this.sessionTimeoutListener()
            }
            this.disconnect("sessiontimeout", true)
        }
    }

    /**
     * Adds a listener for ping responses
     * Called when PING response is received from controller
     */
    addPingListener(listener: (timeRemaining: number, maxTime: number) => void): () => void {
        this.pingListeners.push(listener)

        // Return unregister function
        return () => {
            this.pingListeners = this.pingListeners.filter((l) => l !== listener)
        }
    }

    /**
     * Sets a callback for session timeout
     */
    setSessionTimeoutListener(callback: (() => void) | undefined): void {
        this.sessionTimeoutListener = callback
    }

    /**
     * Sets a callback for when ERROR messages are received from the controller
     * Allows app to handle errors (e.g., abort HTTP requests)
     */
    setErrorHandler(callback: ((errorCode: string, errorMessage: string) => void) | undefined): void {
        this.errorHandler = callback
    }

    /**
     * Adds a status listener
     */
    addListener(listener: ControllerStatusListener): void {
        this.statusListeners.push(listener)
    }

    /**
     * Removes a status listener
     */
    removeListener(listener: ControllerStatusListener): void {
        this.statusListeners = this.statusListeners.filter((l) => l !== listener)
    }

    /**
     * Sets the status and notifies all listeners
     */
    set status(status: ControllerStatus) {
        this._status = status
        this.statusListeners.forEach((l) => l(status))
    }

    /**
     * Gets the current status
     */
    get status(): ControllerStatus {
        return this._status
    }

    /**
     * Handles binary data (terminal/stream data from ArrayBuffer)
     */
    private _handleBinaryData = (data: ArrayBuffer): void => {
        try {
            const decodedString = new TextDecoder("utf-8").decode(data)
            // Route binary data to listeners as stream type
            this._notifyDataListeners("stream", decodedString)
            this.onData(decodedString)
        } catch (error) {
            console.error("Error decoding binary data:", error)
        }
    }

    /**
     * Handles WebSocket errors (equivalent to onErrorCB in WsContext)
     * Shows error toast and increments reconnection counter
     */
    private _handleWebSocketError = (error: Event): void => {
        console.log("WebSocket error occurred")
        this.reconnectAttempts++

        this._updateConnectionState({ connected: false, page: "error" })
        // Show error toast to user
        this._showToast({
            content: "WebSocket connection error. Attempting to reconnect...",
            type: "error",
        })

        this._scheduleReconnection()
    }

    /**
     * Adds a listener for core data routing
     * Called for non-command messages that should be processed by the UI
     */
    addDataListener(listener: (type: string, data: string) => void): () => void {
        this.dataListeners.push(listener)
        // Return unregister function
        return () => {
            this.dataListeners = this.dataListeners.filter((l) => l !== listener)
        }
    }

    /**
     * Notifies all data listeners
     */
    private _notifyDataListeners(type: string, data: string): void {
        this.dataListeners.forEach((listener) => {
            try {
                listener(type, data)
            } catch (error) {
                console.error("Error in data listener:", error)
            }
        })
    }

    /**
     * Sets the connection state listener for UI updates
     */
    setConnectionStateListener(
        listener:
            | ((state: { connected: boolean; page: string; extraMsg?: string; updating?: boolean }) => void)
            | undefined
    ): void {
        this.connectionStateListener = listener
    }

    /**
     * Updates connection state and notifies UI
     */
    private _updateConnectionState(state: {
        connected: boolean
        page: string
        extraMsg?: string
        updating?: boolean
    }): void {
        if (this.connectionStateListener) {
            try {
                this.connectionStateListener(state)
            } catch (error) {
                console.error("Error in connection state listener:", error)
            }
        }
    }

    /**
     * Gets the native WebSocket for advanced usage or fallback scenarios
     */
    getNativeWebSocket(): WebSocket {
        return this.wsAdapter.getNativeWebSocket()
    }
}
