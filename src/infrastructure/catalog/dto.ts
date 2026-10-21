import type { Network } from '@/domain/wallets'

// Contratos REST do Catálogo (docs/architecture.md). Valores em ETH são sempre string decimal.

export interface EditionDto {
  id: string
  // "1/1", "1/10", "1/50" ou "Aberta".
  label: string
  price: string
  // Unidades ainda compráveis; 0 = esgotada.
  available: number
}

export interface NftAttributeDto {
  trait: string
  value: string
}

export interface NftDto {
  id: string
  // Exibido como "#042".
  tokenId: string
  title: string
  collectionId: string
  collectionName: string
  network: Network
  price: string
  oldPrice?: string
  featured: boolean
  // Marca a aba "Em alta"; `createdAt` define "Novos lançamentos" e a ordenação por recentes.
  trending: boolean
  createdAt: string
  imageUrl: string
  thumbnailUrls: string[]
  description: string
  rating: number
  reviewCount: number
  attributes: NftAttributeDto[]
  editions: EditionDto[]
  // Versão do recurso, a mesma dos eventos `nft.updated`.
  version: number
}

export type NftSort = 'recent' | 'price-asc' | 'price-desc' | 'trending'

// GET /nfts
export interface ListNftsQuery {
  search?: string
  collectionId?: string
  network?: Network
  minPrice?: string
  maxPrice?: string
  tab?: 'all' | 'new' | 'trending'
  sort?: NftSort
  page?: number
  pageSize?: number
}

export interface ListNftsResponse {
  items: NftDto[]
  page: number
  pageSize: number
  total: number
  // Contagem por coleção para a sidebar de filtros.
  collections: Array<{ id: string; name: string; count: number }>
}

// GET /favorites, PUT/DELETE /favorites/:nftId
export interface FavoritesResponse {
  nftIds: string[]
}
