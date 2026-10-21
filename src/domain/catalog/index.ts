// API pública: Catálogo (NFT, Edição, Favorito, Disponibilidade). Outros contextos importam só daqui.
import type { EthAmount } from '@/domain/shared'
import type { Network } from '@/domain/wallets'

export interface Edition { id: string; label: string; price: EthAmount; available: number }
export type CatalogSort = 'recent' | 'price-asc' | 'price-desc' | 'trending'

export interface Nft {
  id: string
  title: string
  image: string
  description: string
  collection: string
  collectionName: string
  network: Network
  price: EthAmount
  featured: boolean
  editions: Edition[]
  version: number
}
export interface CatalogSearch { q: string; collection: string; sort: CatalogSort; page: number }
export interface CatalogPage { nfts: Nft[]; featured?: Nft; total: number; page: number; pages: number; collections: Array<{ id: string; name: string; count: number }> }
