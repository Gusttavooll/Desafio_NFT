import { createFileRoute } from '@tanstack/react-router'
import { NftDetailPage } from '@/ui/catalog'

export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetailPage,
})
