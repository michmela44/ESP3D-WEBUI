/**
 * WebSocket adapter that provides a SerialPort-like interface
 * for use with WebSocketService
 */

export type DataListener = (data: string) => void;
export type BinaryDataListener = (data: ArrayBuffer) => void;
export type ErrorListener = (error: Event) => void;

export class WebSocketAdapter {
    private ws: WebSocket;
    private dataListeners: DataListener[] = [];
    private binaryDataListeners: BinaryDataListener[] = [];
    private errorListeners: ErrorListener[] = [];
    private isOpenFlag: boolean = false;

    constructor(url: string) {
        this.ws = new WebSocket(url, "webui-v3");
        this.ws.binaryType = "arraybuffer";
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.ws.onopen = () => {
            this.isOpenFlag = true;
            console.log("WebSocket connected");
        };

        this.ws.onmessage = (event) => {
            // Handle binary data
            if (event.data instanceof ArrayBuffer) {
                this.notifyBinaryListeners(event.data);
            } else {
                // Handle text data
                const data = event.data as string;
                this.notifyListeners(data);
            }
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.notifyErrorListeners(error);
        };

        this.ws.onclose = () => {
            this.isOpenFlag = false;
            console.log("WebSocket disconnected");
        };
    }

    isOpen(): boolean {
        return this.isOpenFlag && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Opens the WebSocket connection
     * For WebSocket, this is essentially immediate after construction
     */
    async open(): Promise<void> {
        return new Promise((resolve, reject) => {
            const checkOpen = () => {
                if (this.isOpen()) {
                    resolve();
                } else if (this.ws.readyState === WebSocket.CLOSED) {
                    reject(new Error("WebSocket failed to connect"));
                } else {
                    setTimeout(checkOpen, 100);
                }
            };
            checkOpen();
        });
    }

    /**
     * Closes the WebSocket connection
     */
    async close(): Promise<void> {
        return new Promise((resolve) => {
            if (this.isOpen()) {
                const onClose = () => {
                    this.ws.removeEventListener("close", onClose);
                    resolve();
                };
                this.ws.addEventListener("close", onClose);
                this.ws.close();
            } else {
                resolve();
            }
        });
    }

    /**
     * Writes data to the WebSocket
     */
    async write(data: Buffer | string): Promise<void> {
        if (!this.isOpen()) {
            throw new Error("WebSocket is not connected");
        }

        const stringData = typeof data === "string" ? data : data.toString();
        this.ws.send(stringData);
        return Promise.resolve();
    }

    /**
     * Adds a data listener
     */
    addReader(listener: DataListener): () => void {
        this.dataListeners.push(listener);

        // Return unregister function
        return () => {
            this.dataListeners = this.dataListeners.filter(l => l !== listener);
        };
    }

    /**
     * Removes a specific reader
     */
    removeReader(listener: DataListener): void {
        this.dataListeners = this.dataListeners.filter(l => l !== listener);
    }

    /**
     * Adds a binary data listener (for terminal/stream data)
     */
    addBinaryReader(listener: BinaryDataListener): () => void {
        this.binaryDataListeners.push(listener);

        // Return unregister function
        return () => {
            this.binaryDataListeners = this.binaryDataListeners.filter(l => l !== listener);
        };
    }

    /**
     * Removes a specific binary reader
     */
    removeBinaryReader(listener: BinaryDataListener): void {
        this.binaryDataListeners = this.binaryDataListeners.filter(l => l !== listener);
    }

    /**
     * Notifies all listeners of incoming data
     */
    private notifyListeners(data: string): void {
        this.dataListeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error("Error in data listener:", error);
            }
        });
    }

    /**
     * Notifies all binary data listeners
     */
    private notifyBinaryListeners(data: ArrayBuffer): void {
        this.binaryDataListeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error("Error in binary data listener:", error);
            }
        });
    }

    /**
     * Adds an error listener
     */
    addErrorListener(listener: ErrorListener): () => void {
        this.errorListeners.push(listener);

        // Return unregister function
        return () => {
            this.errorListeners = this.errorListeners.filter(l => l !== listener);
        };
    }

    /**
     * Notifies all error listeners
     */
    private notifyErrorListeners(error: Event): void {
        this.errorListeners.forEach(listener => {
            try {
                listener(error);
            } catch (err) {
                console.error("Error in error listener:", err);
            }
        });
    }

    /**
     * Gets the native WebSocket (for advanced usage)
     */
    getNativeWebSocket(): WebSocket {
        return this.ws;
    }

    /**
     * Waits for the WebSocket to be open
     */
    async waitForConnection(timeoutMs: number = 5000): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("WebSocket connection timeout"));
            }, timeoutMs);

            const checkConnection = () => {
                if (this.isOpen()) {
                    clearTimeout(timeout);
                    resolve();
                } else if (this.ws.readyState === WebSocket.CLOSED) {
                    clearTimeout(timeout);
                    reject(new Error("WebSocket connection failed"));
                } else {
                    setTimeout(checkConnection, 50);
                }
            };

            checkConnection();
        });
    }
}