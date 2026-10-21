import { describe, expect, it } from 'vitest'
import { toSessionToken } from '@/domain/account'
import { createSessionTokenStorage, type KeyValueStorage } from './session-token-storage'

function memoryStorage(): KeyValueStorage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  }
}

describe('createSessionTokenStorage', () => {
  it('não tem token antes de a Sessão iniciar', () => {
    expect(createSessionTokenStorage(memoryStorage()).read()).toBeNull()
  })

  it('lê o token gravado, como após um refresh', () => {
    const storage = memoryStorage()
    createSessionTokenStorage(storage).write(toSessionToken('token-1'))
    expect(createSessionTokenStorage(storage).read()).toBe('token-1')
  })

  it('esquece o token ao limpar', () => {
    const tokens = createSessionTokenStorage(memoryStorage())
    tokens.write(toSessionToken('token-1'))
    tokens.clear()
    expect(tokens.read()).toBeNull()
  })

  it('trata valor vazio como ausência de token', () => {
    const storage = memoryStorage()
    storage.setItem('desafio-nft.session-token', '')
    expect(createSessionTokenStorage(storage).read()).toBeNull()
  })
})
