// API pública: Catálogo (NFT, Edição, Favorito, Disponibilidade). Outros contextos importam só daqui.
import { httpClient } from '@/infrastructure/http/http-client'
import type { CatalogPage, CatalogSearch, Nft } from '@/domain/catalog'

export async function getCatalog(search: CatalogSearch, signal?: AbortSignal) {
  return (await httpClient.get<CatalogPage>('/nfts', { params: search, signal })).data
}
export async function getNft(id: string, signal?: AbortSignal) {
  return (await httpClient.get<{ nft: Nft }>(`/nfts/${encodeURIComponent(id)}`, { signal })).data.nft
}
