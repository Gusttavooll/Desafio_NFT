import { httpClient } from '@/infrastructure/http/http-client'
import type { ListNftsQuery, ListNftsResponse } from './dto'
import { mapNft } from './catalog-api'

// Independent editorial query: catalog search/filter changes never replace the hero.
export async function getFeatured(signal?: AbortSignal) {
  const params: ListNftsQuery & { featured: boolean } = { featured: true, page: 1, pageSize: 12, sort: 'recent' }
  const { data } = await httpClient.get<ListNftsResponse>('/nfts', { params, signal })
  return data.items.map(mapNft)
}
export async function getRelated(collection: string, signal?: AbortSignal) {
  const params: ListNftsQuery = { collectionId: collection, page: 1, pageSize: 12, sort: 'recent' }
  const { data } = await httpClient.get<ListNftsResponse>('/nfts', { params, signal })
  return data.items.map(mapNft)
}
