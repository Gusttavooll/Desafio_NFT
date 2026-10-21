import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/ui/account'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
