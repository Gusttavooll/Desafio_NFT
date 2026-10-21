import type { RequestHandler, WebSocketHandler } from 'msw'

// Handlers do contexto Conta e Sessão.
export const accountHandlers: Array<RequestHandler | WebSocketHandler> = []
