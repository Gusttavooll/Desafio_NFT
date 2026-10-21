import { createFileRoute } from '@tanstack/react-router'
import { CheckoutConfirmationPage } from '@/ui/orders'

export const Route = createFileRoute('/checkout/confirmation')({
  component: CheckoutConfirmationPage,
})
