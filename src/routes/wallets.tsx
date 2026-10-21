import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/ui/wallets'

export const Route = createFileRoute('/wallets')({
  component: WalletsPage,
})
