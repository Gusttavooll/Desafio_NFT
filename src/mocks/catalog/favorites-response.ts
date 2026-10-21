import { HttpResponse } from 'msw'
import { forcedResponseFor, requireSession, respondForced, respondWithError, type Simulation } from '@/mocks/core'

export function favoritesResponse(sim: Simulation, request: Request, nftId?: string): Response {
  const session = requireSession(sim, request)
  if (!session.ok) return session.response
  if (sim.scenarioConfig().networkError) return HttpResponse.error()
  const forced = forcedResponseFor(sim.scenarioConfig(), `${request.method} /favorites${nftId ? '/:nftId' : ''}`)
  if (forced) return respondForced(forced)
  const owner = session.collector.id
  if (nftId) {
    if (!sim.state().nfts.some(nft => nft.id === nftId)) return respondWithError(404, 'not_found', 'Obra não encontrada.')
    sim.update(state => {
      const next = new Set(state.favorites[owner] ?? [])
      if (request.method === 'PUT') next.add(nftId)
      else next.delete(nftId)
      state.favorites[owner] = [...next]
    })
  }
  return HttpResponse.json({ nftIds: sim.state().favorites[owner] ?? [] })
}
