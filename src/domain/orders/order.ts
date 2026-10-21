import type { EthAmount } from '@/domain/shared'

// Pedido nasce `pending` e termina em `confirmed` ou `rejected` (estados terminais).
export type OrderStatus = 'pending' | 'confirmed' | 'rejected'

// Identifica a tentativa de Pedido: a mesma chave recupera o mesmo Pedido.
export type IdempotencyKey = string & { readonly __brand: 'IdempotencyKey' }

// Referência simulada da compra, exibida no Recibo com link de explorador simulado.
export interface Transaction {
  hash: string
  explorerUrl: string
  confirmedAt: string
}

// Item do Recibo: snapshot imutável, nunca recalculado com dados do Catálogo.
export interface ReceiptItem {
  nftId: string
  editionId: string
  title: string
  tokenId: string
  editionLabel: string
  quantity: number
  unitPrice: EthAmount
  subtotal: EthAmount
}

export interface Receipt {
  transaction: Transaction
  items: ReceiptItem[]
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  walletAddress: string
  issuedAt: string
}

export interface Order {
  id: string
  status: OrderStatus
  version: number
  createdAt: string
  updatedAt: string
  // Presente só quando `confirmed`.
  receipt: Receipt | null
}
