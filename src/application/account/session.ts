import type { Session, SessionToken } from '@/domain/account'
import { createSessionTokenStorage, fetchSessionCollector } from '@/infrastructure/account'
import { httpClient, installSessionInterceptors } from '@/infrastructure/http/http-client'
import { queryClient } from '@/application/query-client'
import { bootstrapSession } from './bootstrap-session'
import { createSessionStore, type SessionEnded, type SessionStore } from './session-store'

let instance: SessionStore | null = null

// Criada no primeiro uso (useSession ou inscrição no ciclo de vida), sem exigir passo extra no main.tsx.
export function getSessionStore(): SessionStore {
  if (instance) return instance

  const tokens = createSessionTokenStorage(window.localStorage)
  const store = createSessionStore({ tokens, clearCache: () => queryClient.clear() })
  installSessionInterceptors(httpClient, {
    getToken: store.getToken,
    // 401 ao recuperar a Sessão não é expiração: o Visitante nunca chegou a ver a Sessão ativa.
    onSessionExpired: () => {
      if (store.getState().status === 'collector') store.expireSession()
    },
  })
  instance = store
  void bootstrapSession({ store, tokens, fetchCollector: (token) => fetchSessionCollector(httpClient, token) })
  return store
}

export function getSessionToken(): SessionToken | null {
  return getSessionStore().getToken()
}

export function onSessionStarted(listener: (session: Session) => void): () => void {
  return getSessionStore().onSessionStarted(listener)
}

// Sessão encerrada (logout) ou trocada (outro Colecionador); o cache já foi limpo quando dispara.
export function onSessionEnded(listener: (event: SessionEnded) => void): () => void {
  return getSessionStore().onSessionEnded(listener)
}

export function onSessionExpired(listener: () => void): () => void {
  return getSessionStore().onSessionExpired(listener)
}
