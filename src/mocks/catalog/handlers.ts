import type { RequestHandler, WebSocketHandler } from 'msw'

// Handlers do contexto Catálogo (NFT, Edição, Favorito, Disponibilidade).
export const catalogHandlers: Array<RequestHandler | WebSocketHandler> = []
