import { toSessionToken, type SessionToken } from '@/domain/account'

// Subconjunto de `Storage` usado aqui; permite trocar o localStorage nos testes.
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export interface SessionTokenStorage {
  read(): SessionToken | null
  write(token: SessionToken): void
  clear(): void
}

const SESSION_TOKEN_KEY = 'desafio-nft.session-token'

// O token fica no localStorage para a Sessão sobreviver ao refresh. Nunca guardamos a senha.
export function createSessionTokenStorage(storage: KeyValueStorage): SessionTokenStorage {
  return {
    read() {
      const value = storage.getItem(SESSION_TOKEN_KEY)
      return value ? toSessionToken(value) : null
    },
    write(token) {
      storage.setItem(SESSION_TOKEN_KEY, token)
    },
    clear() {
      storage.removeItem(SESSION_TOKEN_KEY)
    },
  }
}
