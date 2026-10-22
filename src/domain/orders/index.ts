// API pública: Pedidos. Outros contextos importam só daqui.
export type { IdempotencyKey, Order, OrderStatus, Receipt, ReceiptItem, Transaction } from './order'
export { compareQuotes, transitionOrder, reconcileOrder, purchasedRemainder, validateCollector, type CollectorData, type CollectorErrors } from './checkout'
