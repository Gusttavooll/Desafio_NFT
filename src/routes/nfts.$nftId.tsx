import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetailPage,
})

function NftDetailPage() {
  return <h1 className="text-2xl font-semibold">Detalhe do NFT</h1>
}
