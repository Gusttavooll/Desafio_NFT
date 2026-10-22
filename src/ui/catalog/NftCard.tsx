import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { PriceTag } from '@/ui/components'
import type { Nft } from '@/domain/catalog'
import { FavoriteButton } from './FavoriteButton'

export function NftCard({ nft }: { nft: Nft }) {
  return <article className="nft-card"><Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="art-link" aria-label={`Inspecionar ${nft.title}`}><div className="art-frame"><img src={nft.image} alt={nft.title} width="1000" height="1000" loading="lazy" /></div><span className="inspect-icon" aria-hidden="true"><ArrowUpRight size={22} /></span></Link><div className="record-line"><span>{nft.id.toUpperCase()}</span><span>{nft.network}</span></div><h3><Link to="/nfts/$nftId" params={{ nftId: nft.id }}>{nft.title}</Link></h3><div className="card-price"><span className="eyebrow">VALOR DEMONSTRATIVO</span><PriceTag value={nft.price} />{nft.editions.every(edition => edition.available === 0) && <span className="eyebrow">Esgotado</span>}</div><FavoriteButton nftId={nft.id} /></article>
}
