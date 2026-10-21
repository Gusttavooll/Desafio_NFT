// API pública: Pedidos. Outros contextos importam só daqui.
export type {
  CollectorDataDto,
  CreateOrderBody,
  OrderDto,
  ReceiptDto,
  ReceiptItemDto,
  TransactionDto,
} from './dto'
export { postOrder, getOrder, mapOrder, orderAttempt, checkoutDraft, clearCheckoutStorage, clearAllCheckoutStorage, type OrderAttempt } from './orders-api'
