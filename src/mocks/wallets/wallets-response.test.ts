import { describe, expect, it } from 'vitest'
import { createSimulation } from '@/mocks/core'
import { validateWallet } from '@/domain/wallets'
import type { WalletsResponse } from '@/infrastructure/wallets'
import { walletsResponse } from './wallets-response'

function fixture() {
  const sim = createSimulation({ storage: null, search: '' })
  sim.update(state => state.sessions.push({ token: 'token', collectorId: 'collector-ana', expiresAt: '2099-01-01' }))
  const request = (method: string, path = '', body?: unknown) => new Request(`http://local/api/wallets${path}`, { method, headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
  return { sim, request }
}
describe('API de Carteiras', () => {
  it('retorna somente carteiras da sessão e exige autenticação', async () => {
    const { sim, request } = fixture()
    expect((await (await walletsResponse(sim, request('GET'))).json()).primary.id).toBe('wallet-ana-primary')
    expect((await walletsResponse(sim, new Request('http://local/api/wallets'))).status).toBe(401)
  })
  it('oferece principal e secundária válidas para Ana e estado vazio para Bruno', async () => {
    const { sim, request } = fixture()
    const wallets = await (await walletsResponse(sim, request('GET'))).json() as WalletsResponse
    expect(wallets.primary?.kind).toBe('primary')
    expect(wallets.secondary?.kind).toBe('secondary')
    expect(wallets.secondary?.id).not.toBe(wallets.primary?.id)
    expect(validateWallet(wallets.primary!)).toEqual({})
    expect(validateWallet(wallets.secondary!)).toEqual({})
    sim.update(state => { state.sessions[0]!.collectorId = 'collector-bruno' })
    expect(await (await walletsResponse(sim, request('GET'))).json()).toEqual({ primary: null, secondary: null })
  })
  it('garante uma carteira por tipo e valida campos no servidor', async () => {
    const { sim, request } = fixture()
    const primary = sim.state().wallets['collector-ana']![0]!
    expect((await walletsResponse(sim, request('POST', '', primary))).status).toBe(422)
    const bad = await walletsResponse(sim, request('PATCH', `/${primary.id}`, { address: 'invalid' }), primary.id)
    expect(bad.status).toBe(422)
    expect(await bad.json()).toHaveProperty('details.address')
    expect((await walletsResponse(sim, request('PATCH', '/other', { nickname: 'x' }), 'other')).status).toBe(404)
  })
  it('secundária vinculada reflete edições da principal após consulta', async () => {
    const { sim, request } = fixture()
    const primary = sim.state().wallets['collector-ana']![0]!
    const secondary = sim.state().wallets['collector-ana']!.find(wallet => wallet.kind === 'secondary')!
    expect((await walletsResponse(sim, request('PATCH', `/${secondary.id}`, { sameAsPrimary: true }), secondary.id)).status).toBe(200)
    await walletsResponse(sim, request('PATCH', `/${primary.id}`, { nickname: 'Viagens' }), primary.id)
    expect((await (await walletsResponse(sim, request('GET'))).json()).secondary.nickname).toBe('Viagens')
  })
})
