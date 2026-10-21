import type { RequestHandler, WebSocketHandler } from 'msw'

// Handlers do contexto Tempo real.
export const realtimeHandlers: Array<RequestHandler | WebSocketHandler> = []
