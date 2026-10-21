import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { Nft, CatalogPage } from '@/domain/catalog'
import { parseEthAmount } from '@/domain/shared'
import type { NftUpdatedEvent } from '@/infrastructure/realtime'
import { applyCatalogNftUpdate, reconcileCatalog } from './realtime'

const nft: Nft = { id: 'one', title: 'Obra', image: '/art.svg', description: 'Descrição', collection: 'c', collectionName: 'Coleção', network: 'ethereum', featured: true, price: parseEthAmount('0.1'), version: 2, editions: [{ id: 'e', label: 'Aberta', price: parseEthAmount('0.1'), available: 5, purchaseLimit: 3 }] }
const event: NftUpdatedEvent = { id: 'event', resource: 'nft', resourceId: 'one', version: 3, occurredAt: '2026-10-21T00:00:00Z', payload: { price: '0.100000000000000001', editions: [{ id: 'e', available: 2 }] } }

describe('catalog event cache', () => {
  it('ignores malformed payloads and accepts exact edition prices in full payloads', () => {
    const client = new QueryClient()
    client.setQueryData(['catalog', 'one'], nft)
    for (const payload of [null, [], 'wrong']) applyCatalogNftUpdate({ ...event, payload }, client)
    expect(client.getQueryData(['catalog', 'one'])).toEqual(nft)
    applyCatalogNftUpdate({ ...event, payload: { price: 'NaN', editions: [{ id: 'e', available: -1, price: '0.100000000000000009' }] } }, client)
    expect(client.getQueryData<Nft>(['catalog', 'one'])?.editions[0]).toEqual({ ...nft.editions[0], price: '0.100000000000000009' })
    expect(client.getQueryData<Nft>(['catalog', 'one'])?.price).toBe('0.1')
    client.clear()
  })
  it('updates detail, search and carousel caches without losing partial edition fields or exact prices', () => {
    const client = new QueryClient()
    const page: CatalogPage = { nfts: [nft], featured: nft, total: 1, page: 1, pages: 1, collections: [] }
    client.setQueryData(['catalog', 'one'], nft)
    client.setQueryData(['catalog', { page: 1 }], page)
    client.setQueryData(['catalog', 'featured'], [nft])
    client.setQueryData(['favorites'], ['one'])
    applyCatalogNftUpdate(event, client)
    const updated = client.getQueryData<Nft>(['catalog', 'one'])!
    expect(updated).toEqual({ ...nft, version: 3, price: '0.100000000000000001', editions: [{ ...nft.editions[0], available: 2 }] })
    expect(client.getQueryData<CatalogPage>(['catalog', { page: 1 }])?.featured).toEqual(updated)
    expect(client.getQueryData(['catalog', 'featured'])).toEqual([updated])
    applyCatalogNftUpdate({ ...event, payload: { price: '99', editions: [] } }, client)
    applyCatalogNftUpdate({ ...event, version: 1 }, client)
    expect(client.getQueryData(['catalog', 'one'])).toEqual(updated)
    expect(client.getQueryData(['favorites'])).toEqual(['one'])
    client.clear()
  })

  it('reconciles only active catalog queries', async () => {
    const client = new QueryClient()
    client.setQueryData(['catalog', 'inactive'], nft)
    client.setQueryData(['cart'], [])
    let loads = 0
    const observer = new QueryObserver(client, { queryKey: ['catalog', 'active'], queryFn: async () => { loads++; return nft }, initialData: nft, staleTime: Infinity })
    const unsubscribe = observer.subscribe(() => {})
    await reconcileCatalog(client)
    expect(loads).toBe(1)
    expect(client.getQueryState(['catalog', 'inactive'])?.isInvalidated).toBe(false)
    expect(client.getQueryState(['cart'])?.isInvalidated).toBe(false)
    unsubscribe()
    client.clear()
  })
})
