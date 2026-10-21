import { useSyncExternalStore } from 'react'
import { sessionUserId, type SessionState } from '@/domain/account'
import { getSessionStore } from './session'

export type UseSessionResult = SessionState & {
  // Id para `scopedQueryKey`: null para o Visitante e enquanto a Sessão carrega.
  userId: string | null
}

// Queries privadas devem usar `enabled: status !== 'loading'` para não buscar o escopo do Visitante à toa.
export function useSession(): UseSessionResult {
  const store = getSessionStore()
  const state = useSyncExternalStore(store.subscribe, store.getState)
  return { ...state, userId: sessionUserId(state) }
}
