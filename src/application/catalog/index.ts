// API pública: Catálogo (NFT, Edição, Favorito, Disponibilidade). Outros contextos importam só daqui.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { SearchSchemaInput } from '@tanstack/react-router'
import { getCatalog, getNft } from '@/infrastructure/catalog'
import type { CatalogSearch, CatalogSort } from '@/domain/catalog'
import { isEthAmount } from '@/domain/shared'
export { editionLimit, clampEditionQuantity, priceRangeError } from '@/domain/catalog'
export { useFavorites } from './favorites'
export { useFeatured, useRelated } from './use-featured'
export { applyCatalogNftUpdate, reconcileCatalog } from './realtime'

export function catalogSearch(raw: Record<string, unknown> & SearchSchemaInput): CatalogSearch {
  return { q: typeof raw.q === 'string' ? raw.q.slice(0, 120) : '', collection: typeof raw.collection === 'string' && /^[a-z0-9,-]{1,240}$/.test(raw.collection) ? raw.collection : 'all', sort: ['recent', 'price-asc', 'price-desc', 'trending'].includes(String(raw.sort)) ? raw.sort as CatalogSort : 'recent', page: Number.isSafeInteger(Number(raw.page)) && Number(raw.page) > 0 ? Math.min(Number(raw.page), 1000) : 1,
    ...(typeof raw.network === 'string' && ['ethereum', 'polygon', 'solana'].includes(raw.network) ? { network: raw.network as CatalogSearch['network'] } : {}),
    ...(typeof raw.minPrice === 'string' && isEthAmount(raw.minPrice) ? { minPrice: raw.minPrice } : {}),
    ...(typeof raw.maxPrice === 'string' && isEthAmount(raw.maxPrice) ? { maxPrice: raw.maxPrice } : {}),
    ...(raw.tab === 'new' || raw.tab === 'trending' ? { tab: raw.tab } : {}),
  }
}
export function useCatalog(search: CatalogSearch) {
  const [queryText, setQueryText] = useState(search.q)
  useEffect(() => { const timeout = setTimeout(() => setQueryText(search.q), 250); return () => clearTimeout(timeout) }, [search.q])
  const effective = { ...search, q: queryText }
  return useQuery({ queryKey: ['catalog', effective], queryFn: ({ signal }) => getCatalog(effective, signal), staleTime: 15000, retry: 1, placeholderData: keepPreviousData })
}
export function useNft(id: string) {
  return useQuery({ queryKey: ['catalog', id], queryFn: ({ signal }) => getNft(id, signal), retry: false })
}
