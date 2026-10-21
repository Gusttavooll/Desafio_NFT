import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/ui/account'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})
