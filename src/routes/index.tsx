import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/ui/catalog'

export const Route = createFileRoute('/')({
  component: HomePage,
})
