import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { isEthAmount } from '@/domain/shared'
import type { NftUpdatedPayload } from '@/infrastructure/realtime'
import { getSimulation, setEventSink } from '@/mocks/core'

const connections = new Set<{ token: string | null; emit: (name: string, value: unknown) => void }>()

// The simulated transport and REST share a single authoritative resource state.
setEventSink((event, audience) => {
  const sim = getSimulation()
  if (event.resource === 'nft') {
    const nft = sim.state().nfts.find(item => item.id === event.resourceId)
    const payload = event.payload as Partial<NftUpdatedPayload> | null
    if (nft && event.version > nft.version && payload && typeof payload.price === 'string' && isEthAmount(payload.price)) sim.update(state => {
      nft.price = payload.price!
      if (typeof payload.oldPrice === 'string' && isEthAmount(payload.oldPrice)) nft.oldPrice = payload.oldPrice
      if (Array.isArray(payload.editions)) for (const update of payload.editions) {
        const edition = nft.editions.find(item => item.id === update.id)
        if (edition && Number.isSafeInteger(update.available) && update.available >= 0) edition.available = update.available
      }
      nft.version = event.version
      state.versions[`nft:${nft.id}`] = Math.max(state.versions[`nft:${nft.id}`] ?? 0, event.version)
    })
  }
  for (const connection of connections) {
    if (event.resource === 'order') {
      const session = sim.state().sessions.find(item => item.token === connection.token && Date.parse(item.expiresAt) > Date.now())
      const owner = audience.collectorId ?? sim.state().orders.find(item => item.dto.id === event.resourceId)?.collectorId
      if (!session || !owner || session.collectorId !== owner) continue
    }
    connection.emit(`${event.resource}.updated`, event)
  }
})

// MSW normalizes Socket.IO URLs by removing the /socket.io/ path before matching.
const socketOrigin = new URL(import.meta.env.VITE_SOCKET_URL ?? (typeof location === 'undefined' ? 'http://localhost' : location.origin))
socketOrigin.protocol = socketOrigin.protocol === 'https:' || socketOrigin.protocol === 'wss:' ? 'wss:' : 'ws:'
const endpoint = ws.link(socketOrigin.origin)
export const realtimeHandlers = [endpoint.addEventListener('connection', connection => {
  const io = toSocketIo(connection)
  const client = { token: null as string | null, emit: (name: string, value: unknown) => io.client.emit(name, value) }
  connections.add(client)
  connection.client.addEventListener('message', event => {
    if (typeof event.data !== 'string' || !event.data.startsWith('40')) return
    try { const auth = JSON.parse(event.data.slice(2)); client.token = typeof auth.token === 'string' ? auth.token : null } catch { client.token = null }
  })
  const heartbeat = setInterval(() => connection.client.send('2'), 10000)
  connection.client.addEventListener('close', () => { clearInterval(heartbeat); connections.delete(client) })
})]
