import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/ui/catalog'
import { catalogSearch } from '@/application/catalog'

export const Route = createFileRoute('/')({
  component: HomePage,
  validateSearch: catalogSearch,
})
