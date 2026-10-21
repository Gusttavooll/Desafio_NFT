import { describe, expect, it, vi } from 'vitest'
import { toSessionToken, type Collector, type SessionToken } from '@/domain/account'
import { bootstrapSession } from './bootstrap-session'
import { createSessionStore } from './session-store'

const collector: Collector = { id: 'user-a', displayName: 'Ana', username: 'ana', avatarUrl: null }

function setup(initialToken: SessionToken | null) {
  let stored = initialToken
  const tokens = {
    read: () => stored,
    write: (token: SessionToken) => void (stored = token),
    clear: () => void (stored = null),
  }
  const store = createSessionStore({ tokens, clearCache: vi.fn() })
  return { store, tokens, storedToken: () => stored }
}

describe('bootstrapSession', () => {
  it('sem token, vira Visitante sem consultar a API', async () => {
    const { store, tokens } = setup(null)
    const fetchCollector = vi.fn()

    await bootstrapSession({ store, tokens, fetchCollector })

    expect(store.getState()).toEqual({ status: 'guest' })
    expect(fetchCollector).not.toHaveBeenCalled()
  })

  it('com token válido, recupera o Colecionador após o refresh', async () => {
    const { store, tokens } = setup(toSessionToken('token-a'))
    const fetchCollector = vi.fn().mockResolvedValue(collector)

    await bootstrapSession({ store, tokens, fetchCollector })

    expect(fetchCollector).toHaveBeenCalledWith('token-a')
    expect(store.getState()).toEqual({ status: 'collector', collector })
    expect(store.getToken()).toBe('token-a')
  })

  it('com token expirado, vira Visitante e apaga o token', async () => {
    const { store, tokens, storedToken } = setup(toSessionToken('token-velho'))
    const fetchCollector = vi.fn().mockResolvedValue(null)

    await bootstrapSession({ store, tokens, fetchCollector })

    expect(store.getState()).toEqual({ status: 'guest' })
    expect(storedToken()).toBeNull()
  })

  it('com falha transitória, segue como Visitante mas guarda o token para o próximo carregamento', async () => {
    const { store, tokens, storedToken } = setup(toSessionToken('token-a'))
    const fetchCollector = vi.fn().mockRejectedValue(new Error('unavailable'))

    await bootstrapSession({ store, tokens, fetchCollector })

    expect(store.getState()).toEqual({ status: 'guest' })
    expect(storedToken()).toBe('token-a')
  })
})
