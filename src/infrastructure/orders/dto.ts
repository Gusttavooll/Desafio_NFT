import type { OrderStatus } from '@/domain/orders'
import type { Network } from '@/domain/wallets'
import type { QuoteDto } from '@/infrastructure/cart'

// Contratos REST de Pedidos (docs/architecture.md).

export interface CollectorDataDto {
  displayName: string
  username: string
  email: string
  ensName?: string
  note?: string
}

// POST /orders (header `Idempotency-Key`)
export interface CreateOrderBody {
  items: Array<{ editionId: string; quantity: number }>
  walletId: string
  network: Network
  couponCode?: string
  collector: CollectorDataDto
  // Cotação revisada e aceita pelo Colecionador; a API compara com a vigente.
  acceptedQuote: QuoteDto
}

export interface TransactionDto {
  hash: string
  explorerUrl: string
  confirmedAt: string
}

export interface ReceiptItemDto {
  nftId: string
  editionId: string
  title: string
  tokenId: string
  editionLabel: string
  quantity: number
  unitPrice: string
  subtotal: string
}

export interface ReceiptDto {
  transaction: TransactionDto
  items: ReceiptItemDto[]
  subtotal: string
  discount: string
  networkFee: string
  total: string
  walletAddress: string
  issuedAt: string
}

// POST /orders e GET /orders/:id
export interface OrderDto {
  id: string
  status: OrderStatus
  version: number
  createdAt: string
  updatedAt: string
  receipt: ReceiptDto | null
}
