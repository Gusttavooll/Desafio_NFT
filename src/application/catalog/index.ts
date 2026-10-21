// API pública: Catálogo (NFT, Edição, Favorito, Disponibilidade). Outros contextos importam só daqui.
import { useQuery } from '@tanstack/react-query'
import type { SearchSchemaInput } from '@tanstack/react-router'
import { getCatalog, getNft } from '@/infrastructure/catalog'
import type { CatalogSearch, CatalogSort } from '@/domain/catalog'

export function catalogSearch(raw: Record<string, unknown> & SearchSchemaInput): CatalogSearch {
  return { q: typeof raw.q === 'string' ? raw.q.slice(0, 120) : '', collection: typeof raw.collection === 'string' && /^[a-z0-9-]{1,80}$/.test(raw.collection) ? raw.collection : 'all', sort: ['recent', 'price-asc', 'price-desc', 'trending'].includes(String(raw.sort)) ? raw.sort as CatalogSort : 'recent', page: Number.isSafeInteger(Number(raw.page)) && Number(raw.page) > 0 ? Math.min(Number(raw.page), 1000) : 1 }
}
export function useCatalog(search: CatalogSearch) {
  return useQuery({ queryKey: ['catalog', search], queryFn: ({ signal }) => getCatalog(search, signal), staleTime: 15000, retry: 1 })
}
export function useNft(id: string) {
  return useQuery({ queryKey: ['catalog', id], queryFn: ({ signal }) => getNft(id, signal), retry: false })
}
