import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/ui/account'
import { safeReturnTo } from '@/application/account'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: (raw: Record<string, unknown>): { returnTo?: string; expired?: boolean } => ({ returnTo: safeReturnTo(raw.returnTo), expired: raw.expired === true || raw.expired === 'true' }),
})
