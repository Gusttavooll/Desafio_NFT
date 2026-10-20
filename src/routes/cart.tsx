import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  return <h1 className="text-2xl font-semibold">Carrinho</h1>
}
