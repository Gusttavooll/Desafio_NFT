import { getSessionToken, onSessionEnded, onSessionStarted } from '@/application/account'
import { createSocketConnection } from '@/infrastructure/realtime'
import { socket } from '@/infrastructure/socket/socket'
import { bindConnectionToSession } from './session-socket-binding'

let stop: (() => void) | null = null

// Inicializador montado na raiz da aplicação; chamadas repetidas reaproveitam a mesma conexão.
export function startRealtime(): () => void {
  stop ??= bindConnectionToSession(createSocketConnection(socket), {
    getSessionToken,
    onSessionStarted,
    onSessionEnded,
  })
  return () => {
    stop?.()
    stop = null
  }
}
