import { httpAdapter as defaultHttpAdapter } from "../../../adapters/httpAdapter"
import type { HttpAdapterParams } from "../../../adapters/httpAdapter"
import { isWasmBridgeActive } from "./wasmBridgeTransport"
import { wasmBridgeHttpAdapter } from "./wasmBridgeHttpAdapter"

// FluidNC's HTTP transport. Real hardware gets the same XMLHttpRequest
// behavior every target gets by default; when this build is loaded inside
// the FluidNC WASM demo's iframe, every request is answered by the bridge
// instead, since the demo has no FluidNC web server to talk to.
const httpAdapter = (url: string, params?: HttpAdapterParams, setUploadProgress?: (percent: number) => void) =>
    (isWasmBridgeActive() ? wasmBridgeHttpAdapter : defaultHttpAdapter)(url, params, setUploadProgress)

export { httpAdapter }
