import { io } from 'socket.io-client'

// A conexão é aberta explicitamente por quem consumir o socket.
export const socket = io(import.meta.env.VITE_SOCKET_URL ?? window.location.origin, {
  autoConnect: false,
})
