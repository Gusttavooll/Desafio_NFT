import { accountHandlers } from './account/handlers'
import { cartHandlers } from './cart/handlers'
import { catalogHandlers } from './catalog/handlers'
import { ordersHandlers } from './orders/handlers'
import { realtimeHandlers } from './realtime/handlers'
import { walletsHandlers } from './wallets/handlers'

// Agregador fixo: cada contexto edita apenas o próprio mocks/<contexto>/handlers.ts.
export const handlers = [
  ...accountHandlers,
  ...cartHandlers,
  ...catalogHandlers,
  ...ordersHandlers,
  ...realtimeHandlers,
  ...walletsHandlers,
]
