import type { RequestHandler, WebSocketHandler } from 'msw'

// Handlers do contexto Carteiras.
export const walletsHandlers: Array<RequestHandler | WebSocketHandler> = []
