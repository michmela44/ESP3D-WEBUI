import { shimCommand } from "./wasmBridgeTransport"

// wasmBridgeHttpAdapter.ts's /command endpoint. In the WASM demo, a command
// goes to FluidNC as a 'fluidnc-shim-command' request, the counterpart of
// real hardware's /command HTTP request, and is answered the way FluidNC's web server answers that request
// (WebUIServer.cpp's _handle_web_command):
//  - [ESP...] and $/... commands are synchronous: the reply carries the
//    command's output (a JSON response, or its response lines).
//  - Anything else is sent and acknowledged at once with an empty reply;
//    its output, including any "error:N", is seen only on the line stream
//    WasmBridgeWsAdapter reads, the counterpart of the WebSocket.
// Neither ever fails because the firmware reported an error -- the HTTP
// request still succeeds on real hardware -- so a firmware error is shown
// once, by whatever watches the stream, not again by the caller.
// Commands the WASM build doesn't implement (e.g. [ESP400], whose handler
// lives in WebUI/, which that build leaves out) come back as a plain
// "error:..." line, as real hardware shows for an unsupported command.
const runBridgeCommand = (cmd: string): Promise<string> => {
    const upper = cmd.toUpperCase()
    const reply = shimCommand(cmd)
    if (!upper.startsWith("[ESP") && !upper.startsWith("$/")) {
        return Promise.resolve("")
    }
    return reply.then((result) => result.response || (result.ok ? "" : result.ackLine))
}

export { runBridgeCommand }
