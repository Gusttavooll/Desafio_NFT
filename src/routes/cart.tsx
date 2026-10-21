import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@/ui/cart'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})
