import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppShell, AccountLayout } from '@/ui/layout'
import { useRouterState } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  const pathname = useRouterState({ select: state => state.location.pathname })
  const account = pathname === '/profile' || pathname === '/wallets'
  return (
    <AppShell>{account ? <AccountLayout><Outlet /></AccountLayout> : <Outlet />}</AppShell>
  )
}

function NotFoundPage() {
  return <h1 className="text-2xl font-semibold">Página não encontrada</h1>
}
