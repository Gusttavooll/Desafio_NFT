import { useSyncExternalStore } from 'react'
import { getSessionToken, onSessionEnded, onSessionStarted } from '@/application/account'
import { createEventGate } from '@/domain/realtime'
import type { DomainEvent } from '@/domain/shared'
import { createSocketConnection } from '@/infrastructure/realtime'
import { getSocket } from '@/infrastructure/socket/socket'
import { bindConnectionToSession } from './session-socket-binding'

type ConnectionState = 'connecting' | 'connected' | 'disconnected'
let state: ConnectionState = 'connecting'
const listeners = new Set<() => void>()
const update = (next: ConnectionState) => { state = next; listeners.forEach(listener => listener()) }
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export function useRealtimeStatus() { return useSyncExternalStore(subscribe, () => state) }

export interface RealtimeHandlers {
  onNftUpdated: (event: DomainEvent<unknown>) => void
  onOrderUpdated: (event: DomainEvent<unknown>) => void
  onReconnect: () => void
}

// One owner mounts this in the app root. Cleanup removes all owned subscriptions.
export function startRealtime(handlers: RealtimeHandlers): () => void {
  let disposed = false
  let release = () => {}
  void getSocket().then(socket => {
  if (disposed) return
  let gate = createEventGate()
  let token = getSessionToken()
  let connectedOnce = false
  const connected = () => {
    update('connected')
    if (connectedOnce) handlers.onReconnect()
    connectedOnce = true
  }
  const disconnected = () => update('disconnected')
  const nftUpdated = (event: unknown) => { if (gate.accept(event) && event.resource === 'nft') handlers.onNftUpdated(event) }
  const orderUpdated = (event: unknown) => {
    if (token && token === getSessionToken() && gate.accept(event) && event.resource === 'order') handlers.onOrderUpdated(event)
  }
  const stopStarted = onSessionStarted(session => { token = session.token; gate = createEventGate() })
  const stopEnded = onSessionEnded(() => { token = null; gate = createEventGate() })
  socket.on('connect', connected)
  socket.on('disconnect', disconnected)
  socket.on('connect_error', disconnected)
  socket.on('nft.updated', nftUpdated)
  socket.on('order.updated', orderUpdated)
  const stopConnection = bindConnectionToSession(createSocketConnection(socket), { getSessionToken, onSessionStarted, onSessionEnded })
  const mockDisconnect = () => socket.disconnect()
  const mockReconnect = () => socket.connect()
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    window.addEventListener('kronos-mock-disconnect', mockDisconnect)
    window.addEventListener('kronos-mock-reconnect', mockReconnect)
  }
  release = () => {
    stopStarted(); stopEnded()
    socket.off('connect', connected); socket.off('disconnect', disconnected); socket.off('connect_error', disconnected)
    socket.off('nft.updated', nftUpdated); socket.off('order.updated', orderUpdated)
    stopConnection()
    window.removeEventListener('kronos-mock-disconnect', mockDisconnect)
    window.removeEventListener('kronos-mock-reconnect', mockReconnect)
  }
  }).catch(() => { if (!disposed) update('disconnected') })
  return () => { disposed = true; release() }
}
