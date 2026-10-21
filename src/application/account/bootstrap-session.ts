import type { Collector, SessionToken } from '@/domain/account'
import type { SessionTokenStorage } from '@/infrastructure/account'
import type { SessionStore } from './session-store'

export interface BootstrapSessionDependencies {
  store: SessionStore
  tokens: SessionTokenStorage
  // Resolve null quando a API recusa o token (401 `session_expired`).
  fetchCollector: (token: SessionToken) => Promise<Collector | null>
}

// Recupera a Sessão após o refresh, antes de mostrar conteúdo privado.
export async function bootstrapSession({ store, tokens, fetchCollector }: BootstrapSessionDependencies) {
  const token = tokens.read()
  if (token === null) {
    store.endSession()
    return
  }

  let collector: Collector | null
  try {
    collector = await fetchCollector(token)
  } catch {
    store.continueAsGuest()
    return
  }

  if (collector === null) store.endSession()
  else store.startSession({ token, collector })
}
