import { createFileRoute } from '@tanstack/react-router'
import { RegisterPage } from '@/ui/account'
import { safeReturnTo } from '@/application/account'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
  validateSearch: (raw: Record<string, unknown>): { returnTo?: string } => ({ returnTo: safeReturnTo(raw.returnTo) }),
})
