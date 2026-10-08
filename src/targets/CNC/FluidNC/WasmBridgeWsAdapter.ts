import type { DataListener, BinaryDataListener, ErrorListener, IWebSocketAdapter } from "../../../Services/WebSocketAdapter"
import { sendToShim, addShimLineListener } from "./wasmBridgeTransport"

// A WebSocketAdapter-shaped object (same public surface as
// Services/WebSocketAdapter.ts, checked structurally by WebSocketService's
// constructor) backed by the WASM demo's postMessage bridge instead of a
// real WebSocket.
//
// ShimChannel (the FluidNC-side C++ channel this talks to) has no notion
// of "frame types" -- it's a plain ordered text stream, the same shape as
// a real serial/UART connection, not a WebSocket. A real WebSocketAdapter
// splits incoming data into two kinds: string frames for out-of-band
// control messages (CURRENTID/PING/ACTIVEID/NOTIFICATION/ERROR, handled
// via addReader) and ArrayBuffer frames for the Grbl-line/status stream
// (handled via addBinaryReader). This bridge has no separate control-frame
// channel to synthesize those from, so it routes 100% of shim output
// through the binary/stream path -- exactly how a real serial connection
// would look, since there's no multi-connection PAGEID/session concept to
// support here (the bridge is a 1:1 singleton: one iframe, one WASM
// instance).
//
// One consequence: WebSocketService's own keep-alive ping ("PING:<id>",
// sent directly via wsAdapter.write(), not through the command queue) is
// never answered, since nothing here ever synthesizes a CURRENTID for it
// to key off. Forwarding it into the shim would be actively harmful, not
// just useless: FluidNC would see "PING:none" as an unrecognized command
// and respond "error:...", which onData() would misattribute to whatever
// real command happens to be in flight at that moment (its
// commands[0].appendLine() doesn't know a stray error line came from a
// ping rather than the command it's actually waiting on). write() drops
// ping writes rather than forwarding them for exactly this reason.
export class WasmBridgeWsAdapter implements IWebSocketAdapter {
    private binaryDataListeners: BinaryDataListener[] = []
    private isOpenFlag = false
    private unsubscribe: (() => void) | null = null
    private fakeSocketTarget = new EventTarget()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_url: string) {
        // url is unused -- the bridge has exactly one destination (the
        // parent frame that loaded this document), not a configurable host.
        //
        // Opens immediately rather than waiting for a later open() call:
        // real WebSocketAdapter's constructor does `new WebSocket(url)`,
        // which starts connecting on its own (no explicit open() needed for
        // the underlying connection -- open() there just polls an
        // already-in-progress connection). WebSocketService itself never
        // calls connect()/open() on initial app boot, only when recovering
        // from a lost connection -- so an adapter that waits for open() to
        // be called explicitly never opens on a normal first load. This
        // bridge has no real handshake delay to wait out (the postMessage
        // channel and shim are available as soon as this module runs), so
        // matching "open immediately" is both correct and simpler than
        // reproducing a fake connection delay.
        this.isOpenFlag = true
        this.unsubscribe = addShimLineListener(this.onShimLine)
    }

    isOpen(): boolean {
        return this.isOpenFlag
    }

    async open(): Promise<void> {
        if (!this.isOpenFlag) {
            this.isOpenFlag = true
            this.unsubscribe = addShimLineListener(this.onShimLine)
        }
    }

    async close(): Promise<void> {
        this.isOpenFlag = false
        if (this.unsubscribe) {
            this.unsubscribe()
            this.unsubscribe = null
        }
    }

    async write(data: Buffer | string): Promise<void> {
        if (!this.isOpenFlag) {
            throw new Error("WasmBridgeWsAdapter is not open")
        }
        const text = typeof data === "string" ? data : data.toString()
        if (text.startsWith("PING:")) {
            return
        }
        sendToShim(text)
    }

    addReader(_listener: DataListener): () => void {
        // See the class comment: the bridge never routes anything through
        // the string/control-frame path, so this listener is registered
        // but never called. Still implemented (rather than a no-op) so
        // WebSocketService's unregister call on cleanup works normally.
        return () => {}
    }

    removeReader(_listener: DataListener): void {}

    addBinaryReader(listener: BinaryDataListener): () => void {
        this.binaryDataListeners.push(listener)
        return () => {
            this.binaryDataListeners = this.binaryDataListeners.filter((l) => l !== listener)
        }
    }

    removeBinaryReader(listener: BinaryDataListener): void {
        this.binaryDataListeners = this.binaryDataListeners.filter((l) => l !== listener)
    }

    // demo/index.html already buffers raw shim text into complete lines and
    // reassembles [JSON:...] chunks (see FluidNC's JSONencoder) before ever
    // posting a 'fluidnc-shim-line' message, so lines arrive here already
    // plain and whole -- just re-wrap each as an ArrayBuffer message for
    // binaryDataListeners, the same shape a real WSChannel connection would
    // produce. A JSON line is a command's response, which wasmBridgeCommands
    // receives as the command's result (on real hardware it arrives as the
    // HTTP response, never on the WebSocket), so it is not passed on.
    private onShimLine = (line: string, isJson: boolean): void => {
        if (!isJson) {
            this.notifyBinaryListeners(line)
        }
    }

    private notifyBinaryListeners(line: string): void {
        const data = new TextEncoder().encode(`${line}\n`).buffer
        this.binaryDataListeners.forEach((listener) => {
            try {
                listener(data)
            } catch (error) {
                console.error("Error in binary data listener:", error)
            }
        })
    }

    addErrorListener(_listener: ErrorListener): () => void {
        // The bridge has no error events of its own to report (postMessage
        // doesn't fail the way a real socket connection can).
        return () => {}
    }

    // WebSocketService's only use of this is
    // getNativeWebSocket().addEventListener("close", ...) for auto-reconnect
    // wiring, which the bridge doesn't need: the shim doesn't disconnect,
    // so that listener is registered but simply never fires.
    getNativeWebSocket(): WebSocket {
        return this.fakeSocketTarget as unknown as WebSocket
    }

    async waitForConnection(_timeoutMs: number = 5000): Promise<void> {
        if (!this.isOpenFlag) {
            await this.open()
        }
    }
}
