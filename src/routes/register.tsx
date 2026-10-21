import { createFileRoute } from '@tanstack/react-router'
import { RegisterPage } from '@/ui/account'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})
