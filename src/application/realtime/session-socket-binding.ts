import type { Session, SessionToken } from '@/domain/account'
import type { SessionEnded } from '@/application/account'

// Porta da conexão em tempo real; token null conecta como Visitante (só Eventos públicos).
export interface RealtimeConnection {
  connect(token: SessionToken | null): void
  disconnect(): void
}

export interface SessionLifecycle {
  getSessionToken: () => SessionToken | null
  onSessionStarted: (listener: (session: Session) => void) => () => void
  onSessionEnded: (listener: (event: SessionEnded) => void) => () => void
}

// Mantém uma única conexão alinhada à identidade da Sessão atual.
export function bindConnectionToSession(connection: RealtimeConnection, lifecycle: SessionLifecycle): () => void {
  connection.connect(lifecycle.getSessionToken())

  const stopStarted = lifecycle.onSessionStarted((session) => {
    connection.disconnect()
    connection.connect(session.token)
  })

  const stopEnded = lifecycle.onSessionEnded(({ transition }) => {
    // Nenhum Evento da Sessão anterior pode chegar a quem usar o navegador depois.
    connection.disconnect()
    // Na troca, a nova Sessão reconecta logo em seguida com a própria identidade.
    if (transition === 'ended') connection.connect(null)
  })

  return () => {
    stopStarted()
    stopEnded()
    connection.disconnect()
  }
}
