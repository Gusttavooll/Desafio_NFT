import type { QueryClient } from '@tanstack/react-query'
import { queryClient } from '@/application/query-client'
import type { CatalogPage, Nft } from '@/domain/catalog'
import { isEthAmount, parseEthAmount, type DomainEvent } from '@/domain/shared'

function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }

function patchNft(nft: Nft, event: DomainEvent<unknown>, payload: Record<string, unknown>): Nft {
  if (nft.id !== event.resourceId || nft.version >= event.version) return nft
  return { ...nft, version: event.version,
    ...(typeof payload.price === 'string' && isEthAmount(payload.price) ? { price: parseEthAmount(payload.price) } : {}),
    ...(typeof payload.oldPrice === 'string' && isEthAmount(payload.oldPrice) ? { oldPrice: parseEthAmount(payload.oldPrice) } : {}),
    editions: nft.editions.map(edition => {
      const update = Array.isArray(payload.editions) ? payload.editions.find((item: unknown) => object(item) && item.id === edition.id) as unknown : undefined
      if (!object(update)) return edition
      return { ...edition,
        ...(typeof update.available === 'number' && Number.isSafeInteger(update.available) && update.available >= 0 ? { available: update.available } : {}),
        ...(typeof update.price === 'string' && isEthAmount(update.price) ? { price: parseEthAmount(update.price) } : {}),
      }
    }),
  }
}

/** Apply only newer resource versions; preserve details absent from partial events. */
export function applyCatalogNftUpdate(event: DomainEvent<unknown>, client: QueryClient = queryClient): void {
  if (event.resource !== 'nft' || !object(event.payload) || !Number.isSafeInteger(event.version) || event.version < 0) return
  const payload = event.payload
  client.setQueriesData<Nft | Nft[] | CatalogPage>({ queryKey: ['catalog'] }, data => {
    if (!data) return data
    if (Array.isArray(data)) return data.map(nft => patchNft(nft, event, payload))
    if ('nfts' in data) return { ...data, nfts: data.nfts.map(nft => patchNft(nft, event, payload)), ...(data.featured ? { featured: patchNft(data.featured, event, payload) } : {}) }
    return patchNft(data, event, payload)
  })
}

/** Re-fetch visible catalog queries after reconnect, including ordering/filter membership. */
export function reconcileCatalog(client: QueryClient = queryClient): Promise<void> {
  return client.invalidateQueries({ queryKey: ['catalog'], type: 'active', refetchType: 'active' })
}
