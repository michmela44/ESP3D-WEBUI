import { WebSocketAdapter } from "../Services/WebSocketAdapter"

// The original (pre-transport-abstraction) way the streaming/status channel
// was created: a real browser WebSocket. Kept here, outside any specific
// target, so useWebSocketService can fall back to it for targets that
// don't define their own createWsAdapter.
const createWsAdapter = (url: string): WebSocketAdapter => new WebSocketAdapter(url)

export { createWsAdapter }
