import { describe, expect, it } from 'vitest'
import { createSimulation, type Simulation } from '@/mocks/core'
import { accountResponse } from './account-response'

const request = (path: string, method = 'GET', body?: unknown, token?: string) => new Request(`http://localhost/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
async function signIn(sim: Simulation, email = 'ana@kronos.test', password = 'Colecionador#1') { return (await accountResponse(sim, request('/auth/login', 'POST', { email, password }))).json() }

describe('API simulada de Conta', () => {
  it('cadastros concorrentes não criam duas contas com a mesma identidade', async () => {
    const sim = createSimulation({ storage: null, search: '' })
    const body = { displayName: 'Pessoa Concorrente', username: 'pessoa.unica', email: 'unica@kronos.test', password: 'NovaSenha#1' }
    const responses = await Promise.all([accountResponse(sim, request('/auth/register', 'POST', body)), accountResponse(sim, request('/auth/register', 'POST', body))])
    expect(responses.map(response => response.status).sort()).toEqual([201, 409])
    expect(sim.state().collectors.filter(collector => collector.email === body.email)).toHaveLength(1)
  })
  it('cadastra sem persistir ou responder senha e trata conflito de e-mail por campo', async () => {
    const sim = createSimulation({ storage: null, search: '' })
    const body = { displayName: 'Nova Pessoa', username: 'nova.pessoa', email: 'nova@kronos.test', password: 'NovaSenha#1' }
    const response = await accountResponse(sim, request('/auth/register', 'POST', body))
    expect(response.status).toBe(201)
    const session = await response.json()
    expect(session.collector.email).toBe(body.email)
    expect(JSON.stringify(sim.state())).not.toContain(body.password)
    expect(JSON.stringify(session)).not.toMatch(/password|salt/)
    const duplicate = await accountResponse(sim, request('/auth/register', 'POST', { ...body, username: 'outra.pessoa' }))
    expect(duplicate.status).toBe(409)
    expect(await duplicate.json()).toMatchObject({ details: { email: expect.any(String) } })
  })
  it('credenciais inválidas não revelam existência do usuário; logout revoga acesso privado', async () => {
    const sim = createSimulation({ storage: null, search: '' })
    const existing = await accountResponse(sim, request('/auth/login', 'POST', { email: 'ana@kronos.test', password: 'Errada#123' }))
    const absent = await accountResponse(sim, request('/auth/login', 'POST', { email: 'ausente@kronos.test', password: 'Errada#123' }))
    expect(await existing.json()).toEqual(await absent.json())
    const { token } = await signIn(sim)
    expect((await accountResponse(sim, request('/me', 'GET', undefined, token))).status).toBe(200)
    expect((await accountResponse(sim, request('/auth/logout', 'POST', undefined, token))).status).toBe(204)
    expect((await accountResponse(sim, request('/me', 'GET', undefined, token))).status).toBe(401)
  })
  it('isola perfil, valida conflitos e troca senha verificando a atual', async () => {
    const sim = createSimulation({ storage: null, search: '' })
    const { token } = await signIn(sim)
    const conflict = await accountResponse(sim, request('/me', 'PATCH', { username: 'bruno.leal' }, token))
    expect(conflict.status).toBe(409)
    const saved = await accountResponse(sim, request('/me', 'PATCH', { displayName: 'Ana Editada' }, token))
    expect(await saved.json()).toMatchObject({ displayName: 'Ana Editada' })
    expect(sim.state().collectors.find(user => user.id === 'collector-bruno')?.displayName).toBe('Bruno Leal')
    const wrong = await accountResponse(sim, request('/me/password', 'POST', { currentPassword: 'errada', newPassword: 'NovaSenha#2' }, token))
    expect(await wrong.json()).toMatchObject({ details: { currentPassword: expect.any(String) } })
    expect((await accountResponse(sim, request('/me/password', 'POST', { currentPassword: 'Colecionador#1', newPassword: 'NovaSenha#2' }, token))).status).toBe(204)
    expect((await signIn(sim, 'ana@kronos.test', 'NovaSenha#2')).collector.id).toBe('collector-ana')
  })
  it('rejeita avatar não-imagem e permite remover; autenticação retoma cenário expirado', async () => {
    const sim = createSimulation({ storage: null, search: '' })
    const { token } = await signIn(sim)
    expect((await accountResponse(sim, request('/me/avatar', 'PUT', { avatarUrl: 'data:text/html;base64,PHNjcmlwdD4=' }, token))).status).toBe(422)
    expect((await accountResponse(sim, request('/me/avatar', 'PUT', { avatarUrl: null }, token))).status).toBe(200)
    sim.setScenario('session-expired')
    expect((await accountResponse(sim, request('/me', 'GET', undefined, token))).status).toBe(401)
    const resumed = await signIn(sim)
    expect(sim.scenario()).toBe('success')
    expect((await accountResponse(sim, request('/me', 'GET', undefined, resumed.token))).status).toBe(200)
  })
})
