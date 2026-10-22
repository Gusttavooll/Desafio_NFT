import type { RequestHandler, WebSocketHandler } from 'msw'
import { delay, http } from 'msw'
import { getSimulation, withScenarioLatency } from '@/mocks/core'
import { catalogResponse, nftResponse } from './catalog-response'
import { favoritesResponse } from './favorites-response'

let requestSequence = 0
export const catalogHandlers: Array<RequestHandler | WebSocketHandler> = [
  http.get('/api/favorites', async ({ request }) => {
    const sim = getSimulation()
    await withScenarioLatency(sim, 'GET /favorites')
    return favoritesResponse(sim, request)
  }),
  ...(['put', 'delete'] as const).map(method => http[method]('/api/favorites/:nftId', async ({ request, params }) => {
    const sim = getSimulation()
    await withScenarioLatency(sim, `${request.method} /favorites/:nftId`)
    return favoritesResponse(sim, request, String(params.nftId))
  })),
  http.get('/api/nfts', async ({ request }) => {
    const sim = getSimulation()
    const sequence = ++requestSequence
    await withScenarioLatency(sim, 'GET /nfts')
    if (sim.scenarioConfig().outOfOrder && sequence % 2 === 1) await delay(700)
    return catalogResponse(sim, request)
  }),
  http.get('/api/nfts/:id', async ({ params }) => {
    const sim = getSimulation()
    await withScenarioLatency(sim, 'GET /nfts/:id')
    return nftResponse(sim, String(params.id))
  }),
]
