import { createWsAdapter as defaultCreateWsAdapter } from "../../../hooks/defaultWsAdapter"
import { isWasmBridgeActive } from "./wasmBridgeTransport"
import { WasmBridgeWsAdapter } from "./WasmBridgeWsAdapter"

// FluidNC's WebSocketService transport. Real hardware gets the same
// real-WebSocket behavior every target gets by default; when this build
// is loaded inside the FluidNC WASM demo's iframe (detected at runtime --
// see wasmBridgeTransport.ts), it switches to the postMessage-based
// bridge instead, since there's no real WebSocket server to connect to.
const createWsAdapter = (url: string) => (isWasmBridgeActive() ? new WasmBridgeWsAdapter(url) : defaultCreateWsAdapter(url))

export { createWsAdapter }
