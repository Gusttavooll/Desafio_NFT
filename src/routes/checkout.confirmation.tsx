import { createFileRoute } from '@tanstack/react-router'
import { CheckoutConfirmationPage } from '@/ui/orders'

export const Route = createFileRoute('/checkout/confirmation')({
  validateSearch: (raw: Record<string, unknown>): { orderId: string; explorer?: string } => ({ orderId: typeof raw.orderId === 'string' ? raw.orderId : '', explorer: raw.explorer === 1 || raw.explorer === '1' ? '1' : undefined }),
  component: CheckoutConfirmationPage,
})
