// API pública: Carrinho e Cotação. Outros contextos importam só daqui.
export { useCart, useQuote, useCartPreferences, cartQueryKeys, applyCartNftUpdate, useCartNfts } from './use-cart'
export type { QuoteDto, QuoteRequest, CartItemDto } from '@/infrastructure/cart'
