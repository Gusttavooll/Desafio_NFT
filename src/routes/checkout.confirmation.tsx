import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/checkout/confirmation')({
  component: CheckoutConfirmationPage,
})

function CheckoutConfirmationPage() {
  return <h1 className="text-2xl font-semibold">Confirmação</h1>
}
