import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '@/ui/orders'

export const Route = createFileRoute('/checkout/')({
  component: CheckoutPage,
})
