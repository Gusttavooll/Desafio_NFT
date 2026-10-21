import type { Socket } from 'socket.io-client'
import type { SessionToken } from '@/domain/account'

// Adapta o cliente Socket.IO à porta de conexão do Tempo real.
export function createSocketConnection(socket: Socket) {
  return {
    connect(token: SessionToken | null) {
      // A identidade vai no handshake; sem token, o servidor só envia Eventos públicos.
      socket.auth = token ? { token } : {}
      socket.connect()
    },
    disconnect() {
      socket.disconnect()
    },
  }
}
