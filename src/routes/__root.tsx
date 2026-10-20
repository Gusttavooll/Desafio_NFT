import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  return (
    <main className="mx-auto max-w-7xl p-4">
      <Outlet />
    </main>
  )
}

function NotFoundPage() {
  return <h1 className="text-2xl font-semibold">Página não encontrada</h1>
}
