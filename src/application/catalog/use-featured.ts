import { useQuery } from '@tanstack/react-query'
import { getFeatured, getRelated } from '@/infrastructure/catalog'

export function useFeatured() {
  return useQuery({ queryKey: ['catalog', 'featured'], queryFn: ({ signal }) => getFeatured(signal), staleTime: 15000, retry: 1 })
}
export function useRelated(collection: string, excludeId?: string) {
  const query = useQuery({ queryKey: ['catalog', 'related', collection], queryFn: ({ signal }) => getRelated(collection, signal), enabled: Boolean(collection), staleTime: 15000, retry: 1 })
  return { ...query, data: query.data?.filter(nft => nft.id !== excludeId) }
}
