import {
  sessionTransition,
  type Session,
  type SessionState,
  type SessionToken,
  type SessionTransition,
} from '@/domain/account'
import type { SessionTokenStorage } from '@/infrastructure/account'

export interface SessionEnded {
  transition: Exclude<SessionTransition, 'started'>
}

type Listener<T> = (value: T) => void

function createEmitter<T>() {
  const listeners = new Set<Listener<T>>()
  return {
    on(listener: Listener<T>) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    emit(value: T) {
      for (const listener of [...listeners]) listener(value)
    },
  }
}

export interface SessionStoreDependencies {
  tokens: SessionTokenStorage
  clearCache: () => void
}

export type SessionStore = ReturnType<typeof createSessionStore>

// Fonte única do estado da Sessão e do seu ciclo de vida.
// Fica fora do TanStack Query porque `queryClient.clear()` apagaria a própria Sessão.
export function createSessionStore({ tokens, clearCache }: SessionStoreDependencies) {
  let state: SessionState = { status: 'loading' }
  let token: SessionToken | null = null
  const stateChanged = createEmitter<void>()
  const started = createEmitter<Session>()
  const ended = createEmitter<SessionEnded>()
  const expired = createEmitter<void>()

  function change(next: SessionState, nextSession: Session | null) {
    const transition = sessionTransition(state, next)
    state = next
    if (transition === 'ended' || transition === 'switched') {
      // Nenhum dado privado do Colecionador anterior pode sobreviver à troca.
      clearCache()
      ended.emit({ transition })
    }
    if (nextSession && (transition === 'started' || transition === 'switched')) started.emit(nextSession)
    stateChanged.emit()
  }

  return {
    getState: () => state,
    getToken: () => token,
    subscribe: (listener: () => void) => stateChanged.on(listener),
    onSessionStarted: (listener: Listener<Session>) => started.on(listener),
    onSessionEnded: (listener: Listener<SessionEnded>) => ended.on(listener),
    onSessionExpired: (listener: () => void) => expired.on(listener),

    startSession(session: Session) {
      token = session.token
      tokens.write(session.token)
      change({ status: 'collector', collector: session.collector }, session)
    },

    endSession() {
      token = null
      tokens.clear()
      change({ status: 'guest' }, null)
    },

    // A retomada (login e volta à rota) decide depois se a Sessão termina ou é renovada.
    expireSession() {
      expired.emit()
    },
  }
}
