import { describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/infrastructure/http/http-client'
import { getCatalog, mapNft } from './catalog-api'
import type { NftDto } from './dto'

const dto: NftDto = {
  id: 'art-1', tokenId: '#001', title: 'Obra', collectionId: 'collection', collectionName: 'Coleção',
  network: 'ethereum', price: '0.420000000000000001', featured: true, trending: false,
  createdAt: '2026-10-21T00:00:00Z', imageUrl: '/art.svg', thumbnailUrls: [], description: 'Arte',
  rating: 0, reviewCount: 0, attributes: [], editions: [{ id: 'edition', label: '1/1', price: '0.42', available: 1 }], version: 4,
}

describe('API de Catálogo', () => {
  it('mapeia preços exatos, edições e versão sem inventar padrão de NFT', () => {
    expect(mapNft(dto)).toMatchObject({ price: '0.420000000000000001', network: 'ethereum', version: 4, editions: dto.editions })
    expect(mapNft(dto)).not.toHaveProperty('standard')
    expect(() => mapNft({ ...dto, price: 'NaN' })).toThrow()
  })

  it('envia parâmetros REST canônicos e adapta a paginação para a tela', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: { items: [dto], page: 2, pageSize: 3, total: 7, collections: [{ id: 'collection', name: 'Coleção', count: 7 }] } })
    try {
      const result = await getCatalog({ q: 'Obra', collection: 'collection', sort: 'recent', page: 2 })
      expect(get).toHaveBeenCalledWith('/nfts', { params: { search: 'Obra', collectionId: 'collection', sort: 'recent', page: 2, pageSize: 3 }, signal: undefined })
      expect(result).toMatchObject({ total: 7, page: 2, pages: 3, nfts: [{ id: 'art-1' }] })
    } finally { get.mockRestore() }
  })
})
