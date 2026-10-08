// Low-level postMessage client for the FluidNC WASM demo's bridge (see
// FluidNC/wasm/README.md and demo/index.html's 'fluidnc-shim-*' and
// 'fluidnc-fs-*' listeners). This build of WebUI-mm normally talks to real
// hardware over HTTP/WebSocket; when loaded inside that demo's iframe, it
// instead exchanges data with the WASM instance's ShimChannel through
// window.postMessage, since a page can't accept unsolicited WebSocket
// connections and the WASM instance can't make outbound HTTP calls of its
// own.
//
// Three message kinds share this one postMessage channel, mirroring the
// two transports real hardware uses:
//  - 'fluidnc-shim-line' (in) / 'fluidnc-shim-send' (out): the streamed
//    Grbl-line protocol, the WebSocket's counterpart. demo/index.html does
//    the line buffering and [JSON:...] reassembly (see FluidNC's
//    JSONencoder) before posting a line here, so listeners only ever see
//    whole lines; isJson marks a reassembled JSON response.
//  - 'fluidnc-shim-command' (out) / 'fluidnc-shim-command-response' (in):
//    one command and its ok/error-terminated response, the /command HTTP
//    request's counterpart. The demo collects the response lines itself
//    (keeping a JSON response apart from any status/message lines that
//    arrive meanwhile) while still broadcasting every line on the stream,
//    just as real hardware sends a command's output over the WebSocket.
//  - 'fluidnc-fs-request' (out) / 'fluidnc-fs-response' (in): file
//    operations, answered directly against the WASM instance's filesystem
//    (list/delete/deletedir/mkdir/read/write) -- see demo/index.html's
//    handleFsRequest().

type LineListener = (line: string, isJson: boolean) => void

export interface ShimCommandResult {
    ok: boolean
    response: string
    ackLine: string
}

interface Pending<T> {
    resolve: (result: T) => void
    reject: (error: Error) => void
    timer?: ReturnType<typeof setTimeout>
}

// File operations are answered synchronously by the demo, so a missing
// answer means the demo doesn't support the request (e.g. an older demo),
// not that it is still working on it.
const FS_REQUEST_TIMEOUT_MS = 15000

const listeners: LineListener[] = []
const pendingFsRequests = new Map<number, Pending<any>>()
const pendingCommands = new Map<number, Pending<ShimCommandResult>>()
let nextRequestId = 1

// Set by a marker <script> the demo injects ahead of the actual page
// content before Blob-constructing the iframe's document -- see
// demo/index.html's webuiSelect handler.
function isWasmBridgeActive(): boolean {
    return typeof window !== "undefined" && (window as any).__FLUIDNC_WASM_BRIDGE__ === true
}

function settle<T>(pending: Map<number, Pending<T>>, id: number, ok: boolean, value: T, error: string): void {
    const entry = pending.get(id)
    if (!entry) {
        return
    }
    pending.delete(id)
    if (entry.timer) {
        clearTimeout(entry.timer)
    }
    if (ok) {
        entry.resolve(value)
    } else {
        entry.reject(new Error(error))
    }
}

if (typeof window !== "undefined") {
    window.addEventListener("message", (event: MessageEvent) => {
        // The demo page is the only legitimate sender -- postMessage's
        // targetOrigin is '*' on both ends (this document is loaded from a
        // blob: URL with no fixed origin to pin to), so checking the
        // source window is the only authenticity check available.
        if (event.source !== window.parent) {
            return
        }
        const msg = event.data
        if (!msg) {
            return
        }
        if (msg.type === "fluidnc-shim-line" && typeof msg.line === "string") {
            listeners.forEach((listener) => {
                try {
                    listener(msg.line, !!msg.isJson)
                } catch (error) {
                    console.error("Error in wasm bridge line listener:", error)
                }
            })
        } else if (msg.type === "fluidnc-shim-command-response" && typeof msg.id === "number") {
            const result: ShimCommandResult = {
                ok: !!msg.ok,
                response: typeof msg.response === "string" ? msg.response : "",
                ackLine: typeof msg.ackLine === "string" ? msg.ackLine : "",
            }
            // A firmware "error:N" still resolves: it's a completed command,
            // and the caller decides what a failure means.
            settle(pendingCommands, msg.id, true, result, "")
        } else if (msg.type === "fluidnc-fs-response" && typeof msg.id === "number") {
            const error = typeof msg.result === "string" ? msg.result : "File operation failed"
            settle(pendingFsRequests, msg.id, !!msg.ok, msg.result, error)
        }
    })
}

function sendToShim(text: string): void {
    window.parent.postMessage({ type: "fluidnc-shim-send", text }, "*")
}

// Sends one command line and resolves with its collected response once the
// ok/error terminator arrives. No timeout: a command such as $H can
// legitimately take minutes, and the demo runs commands strictly in order.
function shimCommand(cmd: string): Promise<ShimCommandResult> {
    return new Promise((resolve, reject) => {
        const id = nextRequestId++
        pendingCommands.set(id, { resolve, reject })
        window.parent.postMessage({ type: "fluidnc-shim-command", id, cmd }, "*")
    })
}

function addShimLineListener(listener: LineListener): () => void {
    listeners.push(listener)
    return () => {
        const i = listeners.indexOf(listener)
        if (i >= 0) listeners.splice(i, 1)
    }
}

// root is "native_sd" or "native_localfs"; path is POSIX-absolute-style
// ("/", "/sub/file.nc"), matching what WebUI's file commands already use.
function fsRequest(op: string, params: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
        const id = nextRequestId++
        const timer = setTimeout(
            () => settle(pendingFsRequests, id, false, undefined, `File operation '${op}' timed out`),
            FS_REQUEST_TIMEOUT_MS
        )
        pendingFsRequests.set(id, { resolve, reject, timer })
        window.parent.postMessage({ type: "fluidnc-fs-request", id, op, ...params }, "*")
    })
}

export { isWasmBridgeActive, sendToShim, shimCommand, addShimLineListener, fsRequest }
