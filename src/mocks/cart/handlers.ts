import type { RequestHandler, WebSocketHandler } from 'msw'

// Handlers do contexto Carrinho e Cotação.
export const cartHandlers: Array<RequestHandler | WebSocketHandler> = []
