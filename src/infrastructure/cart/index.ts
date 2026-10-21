// API pública: Carrinho e Cotação. Outros contextos importam só daqui.
export type {
  AddCartItemBody,
  CartDto,
  CartItemDto,
  CouponStatus,
  QuoteDto,
  QuoteItemDto,
  QuoteRequest,
  UpdateCartItemBody,
} from './dto'
export { getCart, mergeCart, postCartItem, patchCartItem, deleteCartItem, requestQuote, revalidateQuote, cartPreferences } from './cart-api'
export { mergeCartPreferences } from './cart-api'
