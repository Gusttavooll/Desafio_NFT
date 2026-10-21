import { describe, expect, it } from 'vitest'
import type { ApiError } from '@/domain/shared'
import { createSimulation } from './simulation'
import { forcedResponseFor, latencyFor, requireSession, respondWithError } from './helpers'

const sim = () => createSimulation({ storage: null, search: '' })

function withSession(expiresAt: string) {
  const s = sim()
  s.update((state) => {
    state.sessions.push({ token: 'tok-ana', collectorId: 'collector-ana', expiresAt })
  })
  return s
}

const req = (token?: string) =>
  new Request('http://localhost/api/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

describe('respondWithError', () => {
  it('responde com o envelope { code, message, details? } e o status HTTP', async () => {
    const res = respondWithError(422, 'validation_error', 'Campo obrigatório', { email: 'obrigatório' })
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({
      code: 'validation_error',
      message: 'Campo obrigatório',
      details: { email: 'obrigatório' },
    } satisfies ApiError)
  })

  it('omite details quando não informado', async () => {
    expect(await respondWithError(404, 'not_found', 'Não encontrado').json()).toEqual({
      code: 'not_found',
      message: 'Não encontrado',
    })
  })
})

describe('requireSession', () => {
  it('resolve o Colecionador pelo token da Sessão', () => {
    const result = requireSession(withSession('2099-01-01T00:00:00.000Z'), req('tok-ana'))
    expect(result.ok && result.collector.id).toBe('collector-ana')
  })

  it('responde session_expired sem token', async () => {
    const result = requireSession(sim(), req())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
      expect(((await result.response.json()) as ApiError).code).toBe('session_expired')
    }
  })

  it('responde session_expired para token desconhecido', () => {
    expect(requireSession(sim(), req('inexistente')).ok).toBe(false)
  })

  it('trata expiresAt inválido como Sessão vencida', () => {
    expect(requireSession(withSession('data-invalida'), req('tok-ana')).ok).toBe(false)
  })

  it('responde session_expired quando a Sessão venceu', () => {
    expect(requireSession(withSession('2020-01-01T00:00:00.000Z'), req('tok-ana')).ok).toBe(false)
  })
})

describe('Cenário: latência e respostas forçadas', () => {
  it('usa a latência base do Cenário e soma a variação de forma determinística', () => {
    const s = sim()
    expect(latencyFor(s.scenarioConfig(), 'GET /nfts')).toBe(120)
    s.setScenario('slow')
    const a = latencyFor(s.scenarioConfig(), 'GET /nfts')
    expect(a).toBe(latencyFor(s.scenarioConfig(), 'GET /nfts'))
    expect(a).toBeGreaterThanOrEqual(1200)
    expect(a).toBeLessThanOrEqual(3000)
  })

  it('a resposta global não afeta login e cadastro', () => {
    const s = sim()
    s.setScenario('session-expired')
    expect(forcedResponseFor(s.scenarioConfig(), 'POST /auth/login')).toBeUndefined()
    expect(forcedResponseFor(s.scenarioConfig(), 'GET /cart')?.code).toBe('session_expired')
  })

  it('devolve a resposta forçada da rota ou a global (`*`)', () => {
    const s = sim()
    expect(forcedResponseFor(s.scenarioConfig(), 'POST /orders')).toBeUndefined()
    s.setScenario('price-changed')
    expect(forcedResponseFor(s.scenarioConfig(), 'POST /orders')?.code).toBe('price_changed')
    expect(forcedResponseFor(s.scenarioConfig(), 'GET /nfts')).toBeUndefined()
    s.setScenario('server-error')
    expect(forcedResponseFor(s.scenarioConfig(), 'GET /nfts')?.status).toBe(503)
  })
})
