// API pública: Catálogo (NFT, Edição, Favorito, Disponibilidade). Outros contextos importam só daqui.
import type { EthAmount } from '@/domain/shared'

export interface Nft {
  id: string
  title: string
  image: string
  description: string
  collection: 'generative' | 'geometry'
  price: EthAmount
  standard: 'ERC-721' | 'ERC-1155'
}
export interface CatalogSearch { q: string; collection: string; sort: string; page: number }
export interface CatalogPage { nfts: Nft[]; featured: Nft; total: number; page: number; pages: number }
