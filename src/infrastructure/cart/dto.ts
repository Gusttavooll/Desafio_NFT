import type { Network } from '@/domain/wallets'

// Contratos REST de Carrinho e Cotação (docs/architecture.md).

export interface CartItemDto {
  id: string
  nftId: string
  editionId: string
  quantity: number
}

// GET /cart
export interface CartDto {
  items: CartItemDto[]
  version: number
  // Server reconciled quantities against current availability/limit.
  adjusted?: boolean
}

// POST /cart/items
export interface AddCartItemBody {
  nftId: string
  editionId: string
  quantity: number
}

// PATCH /cart/items/:id
export interface UpdateCartItemBody {
  quantity: number
}

// POST /quotes (também usado na Revalidação do Checkout)
export interface QuoteRequest {
  items: Array<{ editionId: string; quantity: number }>
  network: Network
  couponCode?: string
}

export interface QuoteItemDto {
  nftId: string
  editionId: string
  title: string
  image?: string
  tokenId: string
  editionLabel: string
  quantity: number
  unitPrice: string
  subtotal: string
  // Disponibilidade atual da Edição.
  available: number
}

export type CouponStatus = 'valid' | 'invalid' | 'expired'

export interface QuoteDto {
  items: QuoteItemDto[]
  subtotal: string
  discount: string
  networkFee: string
  total: string
  coupon: { code: string; status: CouponStatus } | null
  quotedAt: string
}
