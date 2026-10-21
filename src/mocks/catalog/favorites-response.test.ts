import { describe, expect, it } from 'vitest'
import { createSimulation } from '@/mocks/core'
import { favoritesResponse } from './favorites-response'

function setup() {
  const sim = createSimulation({ storage: null, search: '' })
  sim.update(s => s.sessions.push({ token: 'ana', collectorId: 'collector-ana', expiresAt: '2099-01-01' }, { token: 'bruno', collectorId: 'collector-bruno', expiresAt: '2099-01-01' }))
  const request = (method: string, token = 'ana') => new Request('http://localhost/api/favorites', { method, headers: { Authorization: `Bearer ${token}` } })
  return { sim, request }
}
describe('favoritos persistidos por colecionador', () => {
  it('inclui sem duplicar, isola o outro usuário e permite remover', async () => {
    const { sim, request } = setup()
    const id = sim.state().nfts[0]!.id
    favoritesResponse(sim, request('PUT'), id)
    favoritesResponse(sim, request('PUT'), id)
    expect(await favoritesResponse(sim, request('GET')).json()).toEqual({ nftIds: [id] })
    expect(await favoritesResponse(sim, request('GET', 'bruno')).json()).toEqual({ nftIds: [] })
    favoritesResponse(sim, request('DELETE'), id)
    expect(await favoritesResponse(sim, request('GET')).json()).toEqual({ nftIds: [] })
  })
  it('recusa sessão ausente, obra inexistente e não grava sob falha', () => {
    const { sim, request } = setup()
    expect(favoritesResponse(sim, request('PUT', ''), 'missing').status).toBe(401)
    expect(favoritesResponse(sim, request('PUT'), 'missing').status).toBe(404)
    sim.setScenario('server-error')
    expect(favoritesResponse(sim, request('PUT'), sim.state().nfts[0]!.id).status).toBe(503)
    expect(sim.state().favorites['collector-ana']).toBeUndefined()
  })
})
