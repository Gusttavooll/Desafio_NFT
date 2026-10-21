import { HttpResponse } from 'msw'
import { isEthAmount } from '@/domain/shared'
import type { ListNftsResponse } from '@/infrastructure/catalog'
import { forcedResponseFor, respondForced, respondWithError, type Simulation } from '@/mocks/core'

// Comparação exata de preços no servidor simulado; a UI não recalcula valores.
const wei = (price: string) => { const [whole = '0', fraction = ''] = price.split('.'); return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0')) }
const compare = (left: bigint, right: bigint) => left < right ? -1 : left > right ? 1 : 0
const positive = (value: string | null, fallback: number, max: number) => {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? Math.min(number, max) : fallback
}

function failure(sim: Simulation, route: string) {
  if (sim.scenarioConfig().networkError) return HttpResponse.error()
  const forced = forcedResponseFor(sim.scenarioConfig(), route)
  return forced ? respondForced(forced) : null
}

export function catalogResponse(sim: Simulation, request: Request): Response {
  const failed = failure(sim, 'GET /nfts')
  if (failed) return failed
  const params = new URL(request.url).searchParams
  const search = (params.get('search') ?? '').slice(0, 120).toLocaleLowerCase('pt-BR')
  const collection = params.get('collectionId')
  const network = params.get('network')
  const min = params.get('minPrice')
  const max = params.get('maxPrice')
  if ((min !== null && !isEthAmount(min)) || (max !== null && !isEthAmount(max))) return respondWithError(422, 'validation_error', 'Preço inválido.')
  const all = sim.scenarioConfig().emptyCatalog ? [] : sim.state().nfts
  const collections = Array.from(new Set(all.map(nft => nft.collectionId)), id => ({
    id, name: all.find(nft => nft.collectionId === id)!.collectionName, count: all.filter(nft => nft.collectionId === id).length,
  }))
  const filtered = all.filter(nft => (!collection || nft.collectionId === collection)
    && (!network || nft.network === network)
    && `${nft.title} ${nft.tokenId} ${nft.id}`.toLocaleLowerCase('pt-BR').includes(search)
    && (params.get('tab') !== 'trending' || nft.trending)
    && (min === null || wei(nft.price) >= wei(min)) && (max === null || wei(nft.price) <= wei(max)))
  const sort = params.get('sort')
  filtered.sort((a, b) => {
    if (sort === 'price-asc') return compare(wei(a.price), wei(b.price)) || a.id.localeCompare(b.id)
    if (sort === 'price-desc') return compare(wei(b.price), wei(a.price)) || a.id.localeCompare(b.id)
    if (sort === 'trending' && a.trending !== b.trending) return Number(b.trending) - Number(a.trending)
    return b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)
  })
  const pageSize = positive(params.get('pageSize'), 12, 100)
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = positive(params.get('page'), 1, pages)
  return HttpResponse.json({ items: filtered.slice((page - 1) * pageSize, page * pageSize), page, pageSize,
    total: filtered.length, collections } satisfies ListNftsResponse)
}

export function nftResponse(sim: Simulation, id: string): Response {
  const failed = failure(sim, 'GET /nfts/:id')
  if (failed) return failed
  const nft = sim.state().nfts.find(item => item.id === id)
  return nft ? HttpResponse.json(nft) : respondWithError(404, 'not_found', 'Obra não encontrada.')
}
