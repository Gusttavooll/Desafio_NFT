import type { RequestHandler, WebSocketHandler } from 'msw'

// Handlers do contexto Pedidos.
export const ordersHandlers: Array<RequestHandler | WebSocketHandler> = []
