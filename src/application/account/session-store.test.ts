import { describe, expect, it, vi } from 'vitest'
import { toSessionToken, type Session, type SessionToken } from '@/domain/account'
import { createSessionStore } from './session-store'

function session(id: string): Session {
  return {
    token: toSessionToken(`token-${id}`),
    collector: { id, displayName: `Colecionador ${id}`, username: id, avatarUrl: null },
  }
}

function setup() {
  let stored: SessionToken | null = null
  const tokens = {
    read: () => stored,
    write: (token: SessionToken) => void (stored = token),
    clear: () => void (stored = null),
  }
  const clearCache = vi.fn()
  const store = createSessionStore({ tokens, clearCache })
  return { store, clearCache, storedToken: () => stored }
}

describe('createSessionStore', () => {
  it('começa carregando, sem identidade', () => {
    const { store } = setup()
    expect(store.getState()).toEqual({ status: 'loading' })
    expect(store.getToken()).toBeNull()
  })

  it('iniciar a Sessão expõe o Colecionador, guarda o token e emite "sessão iniciada"', () => {
    const { store, storedToken } = setup()
    const started = vi.fn()
    store.onSessionStarted(started)

    store.startSession(session('user-a'))

    expect(store.getState()).toEqual({ status: 'collector', collector: session('user-a').collector })
    expect(store.getToken()).toBe('token-user-a')
    expect(storedToken()).toBe('token-user-a')
    expect(started).toHaveBeenCalledWith(session('user-a'))
  })

  it('encerrar a Sessão volta a Visitante, apaga o token, limpa o cache e emite "sessão encerrada"', () => {
    const { store, clearCache, storedToken } = setup()
    const ended = vi.fn()
    store.onSessionEnded(ended)
    store.startSession(session('user-a'))

    store.endSession()

    expect(store.getState()).toEqual({ status: 'guest' })
    expect(store.getToken()).toBeNull()
    expect(storedToken()).toBeNull()
    expect(clearCache).toHaveBeenCalledTimes(1)
    expect(ended).toHaveBeenCalledWith({ transition: 'ended' })
  })

  it('trocar de Colecionador limpa o cache antes de iniciar a nova Sessão', () => {
    const { store, clearCache } = setup()
    const calls: string[] = []
    clearCache.mockImplementation(() => calls.push('clear'))
    store.onSessionEnded(({ transition }) => calls.push(`ended:${transition}`))
    store.onSessionStarted(({ collector }) => calls.push(`started:${collector.id}`))
    store.startSession(session('user-a'))
    calls.length = 0

    store.startSession(session('user-b'))

    expect(calls).toEqual(['clear', 'ended:switched', 'started:user-b'])
  })

  it('o mesmo Colecionador com token novo não limpa o cache nem emite eventos', () => {
    const { store, clearCache } = setup()
    const started = vi.fn()
    store.startSession(session('user-a'))
    store.onSessionStarted(started)

    store.startSession({ ...session('user-a'), token: toSessionToken('token-renovado') })

    expect(store.getToken()).toBe('token-renovado')
    expect(clearCache).not.toHaveBeenCalled()
    expect(started).not.toHaveBeenCalled()
  })

  it('carregar e virar Visitante não limpa o cache nem emite "sessão encerrada"', () => {
    const { store, clearCache } = setup()
    const ended = vi.fn()
    store.onSessionEnded(ended)

    store.endSession()

    expect(store.getState()).toEqual({ status: 'guest' })
    expect(clearCache).not.toHaveBeenCalled()
    expect(ended).not.toHaveBeenCalled()
  })

  it('avisa a expiração sem encerrar a Sessão, para a retomada preservar o contexto', () => {
    const { store, clearCache } = setup()
    const expired = vi.fn()
    store.onSessionExpired(expired)
    store.startSession(session('user-a'))

    store.expireSession()

    expect(expired).toHaveBeenCalledTimes(1)
    expect(store.getState().status).toBe('collector')
    expect(clearCache).not.toHaveBeenCalled()
  })

  it('notifica quem observa o estado depois de limpar o cache', () => {
    const { store, clearCache } = setup()
    const calls: string[] = []
    store.startSession(session('user-a'))
    clearCache.mockImplementation(() => calls.push('clear'))
    store.subscribe(() => calls.push(`state:${store.getState().status}`))

    store.endSession()

    expect(calls).toEqual(['clear', 'state:guest'])
  })

  it('para de receber eventos após cancelar a inscrição', () => {
    const { store } = setup()
    const started = vi.fn()
    const unsubscribe = store.onSessionStarted(started)
    unsubscribe()

    store.startSession(session('user-a'))

    expect(started).not.toHaveBeenCalled()
  })
})
