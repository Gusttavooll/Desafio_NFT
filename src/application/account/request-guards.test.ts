import { describe, expect, it, vi } from 'vitest'
import { createAuthenticationFlow, executeOwnedRequest, sameAccountSession } from './request-guards'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

describe('operações assíncronas de Conta', () => {
  it('uma leitura de avatar iniciada na sessão A não pode escrever em B ou na sessão A renovada', () => {
    const original = { owner: 'ana', token: 'token-a' }
    expect(sameAccountSession(original, { owner: 'bruno', token: 'token-b' })).toBe(false)
    expect(sameAccountSession(original, { owner: 'ana', token: 'token-renovado' })).toBe(false)
    expect(sameAccountSession(original, { owner: null, token: null })).toBe(false)
    expect(sameAccountSession(original, { ...original })).toBe(true)
  })
  it('aborta a requisição privada e rejeita resposta antiga após trocar token mesmo do mesmo usuário', async () => {
    let current = { owner: 'ana', token: 'token-a' }
    const pending = deferred<string>()
    let changed: () => void = () => {}
    let sentSignal: AbortSignal | undefined
    const result = executeOwnedRequest({ ...current }, () => current, listener => { changed = listener; return () => {} }, signal => { sentSignal = signal; return pending.promise })
    const rejected = expect(result).rejects.toThrow('A sessão mudou')
    current = { owner: 'ana', token: 'token-a-novo' }
    changed()
    expect(sentSignal?.aborted).toBe(true)
    pending.resolve('perfil antigo')
    await rejected
  })
  it('não despacha a mutação se a preparação terminou depois do logout', async () => {
    const operation = vi.fn()
    await expect(executeOwnedRequest({ owner: 'ana', token: 'token-a' }, () => ({ owner: null, token: null }), () => () => {}, operation)).rejects.toThrow('A sessão mudou')
    expect(operation).not.toHaveBeenCalled()
  })
  it('fechar o login antes de resposta impede restaurar a sessão', async () => {
    const flow = createAuthenticationFlow()
    const pending = deferred<string>()
    const controller = new AbortController()
    const accept = vi.fn()
    const result = flow.run(() => pending.promise, accept, controller.signal)
    const rejected = expect(result).rejects.toThrow('Autenticação cancelada')
    controller.abort()
    pending.resolve('sessão antiga')
    await rejected
    expect(accept).not.toHaveBeenCalled()
  })
  it('só a tentativa mais nova pode autenticar; logout cancela uma tentativa ainda pendente', async () => {
    const flow = createAuthenticationFlow()
    const first = deferred<string>()
    const accept = vi.fn((value: string) => value)
    const old = flow.run(() => first.promise, accept)
    const rejectedOld = expect(old).rejects.toThrow('Autenticação cancelada')
    expect(await flow.run(async () => 'nova', accept)).toBe('nova')
    first.resolve('antiga')
    await rejectedOld
    expect(accept.mock.calls).toEqual([['nova']])
    const pending = deferred<string>()
    const next = flow.run(() => pending.promise, accept)
    const rejectedNext = expect(next).rejects.toThrow('Autenticação cancelada')
    flow.cancel()
    pending.resolve('não aceitar')
    await rejectedNext
    expect(accept).toHaveBeenCalledTimes(1)
  })
})
