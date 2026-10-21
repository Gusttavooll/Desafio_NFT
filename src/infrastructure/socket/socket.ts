import { io } from 'socket.io-client'

// A conexão é aberta explicitamente por quem consumir o socket.
// Com os mocks, só WebSocket: o @mswjs/socket.io-binding não intercepta long-polling.
export const socket = io(import.meta.env.VITE_SOCKET_URL ?? window.location.origin, {
  autoConnect: false,
  ...(import.meta.env.VITE_ENABLE_MOCKS === 'true' && { transports: ['websocket'] }),
})
