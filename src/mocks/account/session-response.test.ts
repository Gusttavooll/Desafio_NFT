import { describe, expect, it } from 'vitest'
import { createSimulation } from '@/mocks/core'
import { sessionResponse } from './session-response'

function setup() {
  const sim = createSimulation({ storage: null, search: '' })
  const collectorId = sim.state().collectors[0]?.id
  if (!collectorId) throw new Error('Fixture de Colecionador ausente')
  const session = { token: 'test-session', collectorId, expiresAt: new Date(Date.now() + 60_000).toISOString() }
  sim.update((state) => state.sessions.push(session))
  const request = new Request('http://localhost/api/auth/session', { headers: { Authorization: 'Bearer test-session' } })
  return { sim, session, request }
}

describe('GET /auth/session integrado ao estado simulado', () => {
  it('recupera a sessão persistida sem expor hash ou salt', async () => {
    const { sim, session, request } = setup()
    const response = sessionResponse(sim, request)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body).toMatchObject({ token: session.token, expiresAt: session.expiresAt, collector: { id: session.collectorId } })
    expect(body.collector).not.toHaveProperty('passwordHash')
    expect(body.collector).not.toHaveProperty('salt')
  })

  it('invalida a sessão quando o estado é resetado', () => {
    const { sim, request } = setup()
    sim.reset()
    expect(sessionResponse(sim, request).status).toBe(401)
  })

  it('rejeita sessão vencida e tokens do stub antigo', () => {
    const { sim, request } = setup()
    sim.update((state) => {
      for (const session of state.sessions) session.expiresAt = '2000-01-01T00:00:00.000Z'
    })
    expect(sessionResponse(sim, request).status).toBe(401)
    expect(sessionResponse(sim, new Request(request.url, { headers: { Authorization: 'Bearer stub-token-collector-1' } })).status).toBe(401)
  })

  it('respeita o cenário de sessão expirada mesmo com token válido', () => {
    const { sim, request } = setup()
    sim.setScenario('session-expired')
    expect(sessionResponse(sim, request).status).toBe(401)
  })
})
