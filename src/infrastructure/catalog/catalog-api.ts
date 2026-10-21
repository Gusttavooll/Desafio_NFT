import { httpClient } from '@/infrastructure/http/http-client'
import { parseEthAmount } from '@/domain/shared'
import type { CatalogPage, CatalogSearch, Nft } from '@/domain/catalog'
import type { ListNftsQuery, ListNftsResponse, NftDto } from './dto'

export function mapNft(dto: NftDto): Nft {
  return {
    id: dto.id, title: dto.title, image: dto.imageUrl, description: dto.description,
    collection: dto.collectionId, collectionName: dto.collectionName, network: dto.network,
    price: parseEthAmount(dto.price), featured: dto.featured, version: dto.version,
    editions: dto.editions.map(edition => ({ ...edition, price: parseEthAmount(edition.price) })),
  }
}

export async function getCatalog(search: CatalogSearch, signal?: AbortSignal): Promise<CatalogPage> {
  const params: ListNftsQuery = {
    search: search.q, collectionId: search.collection === 'all' ? undefined : search.collection,
    sort: search.sort, page: search.page, pageSize: 3,
  }
  const { data } = await httpClient.get<ListNftsResponse>('/nfts', { params, signal })
  const nfts = data.items.map(mapNft)
  return { nfts, featured: nfts.find(nft => nft.featured) ?? nfts[0], total: data.total, page: data.page,
    pages: Math.max(1, Math.ceil(data.total / data.pageSize)), collections: data.collections }
}

export async function getNft(id: string, signal?: AbortSignal): Promise<Nft> {
  const { data } = await httpClient.get<NftDto>(`/nfts/${encodeURIComponent(id)}`, { signal })
  return mapNft(data)
}
