import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/ui/layout'
import { onSessionExpired, safeReturnTo, useSession } from '@/application/account'
import { applyCatalogNftUpdate, reconcileCatalog } from '@/application/catalog'
import { applyCartNftUpdate, cartQueryKeys } from '@/application/cart'
import { applyOrderUpdate, orderQueryKeys, startOrdersSessionLifecycle } from '@/application/orders'
import { startRealtime, useRealtimeStatus } from '@/application/realtime'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  return (
    <AppShell><AccountSessionBridge /><RealtimeBridge /><Outlet /></AppShell>
  )
}

function AccountSessionBridge() {
  const navigate = useNavigate()
  useEffect(() => onSessionExpired(() => {
    if (window.location.pathname === '/login' || window.location.pathname === '/register') return
    const returnTo = safeReturnTo(`${window.location.pathname}${window.location.search}${window.location.hash}`)
    void navigate({ to: '/login', search: { returnTo, expired: true }, replace: true })
  }), [navigate])
  return null
}

function RealtimeBridge() {
  const client = useQueryClient()
  const session = useSession()
  const status = useRealtimeStatus()
  useEffect(() => startOrdersSessionLifecycle(), [])
  useEffect(() => startRealtime({
    onNftUpdated: event => { applyCatalogNftUpdate(event); applyCartNftUpdate(event) },
    onOrderUpdated: event => applyOrderUpdate(client, session.userId, event),
    onReconnect: () => {
      reconcileCatalog()
      for (const queryKey of [cartQueryKeys.cart(session.userId), cartQueryKeys.quote(session.userId), orderQueryKeys.all(session.userId)]) void client.invalidateQueries({ queryKey, type: 'active' })
    },
  }), [client, session.userId])
  return <p className={status === 'disconnected' ? 'market-message realtime-status' : 'sr-only'} role="status">{status === 'disconnected' ? 'Atualizações ao vivo desconectadas. Reconectando…' : status === 'connected' ? 'Atualizações ao vivo conectadas.' : 'Conectando atualizações ao vivo…'}</p>
}

function NotFoundPage() {
  return <h1 className="text-2xl font-semibold">Página não encontrada</h1>
}
