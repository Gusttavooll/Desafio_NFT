import { useParams, Link } from '@tanstack/react-router'
import { useNft } from '@/application/catalog'
import { Breadcrumb } from '@/ui/layout'
import { PriceTag } from '@/ui/components'
import './catalog.css'

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const { data: nft, isPending, isError, error, refetch } = useNft(nftId)
  if (isPending) return <div className="page-container catalog-empty" role="status">Carregando obra…</div>
  if (isError || !nft) {
    const notFound = error && 'status' in error && error.status === 404
    return <div className="page-container catalog-empty"><h1>{notFound ? 'Obra não encontrada.' : 'Não foi possível abrir a obra.'}</h1>{!notFound && <button className="k-button" onClick={() => void refetch()}>Tentar novamente</button>}<Link className="k-button" to="/">Voltar ao acervo</Link></div>
  }
  return <div className="page-container"><Breadcrumb current={nft.title} /><div className="nft-detail"><div className="art-frame"><img src={nft.image} alt={nft.title} width="1000" height="1000" /></div><div className="detail-copy"><p className="eyebrow">REGISTRO {nft.id.toUpperCase()} / {nft.network}</p><h1>{nft.title}</h1><p>{nft.description}</p><div className="detail-price"><span className="eyebrow">VALOR DEMONSTRATIVO</span><PriceTag value={nft.price} /></div><dl><div><dt>Coleção</dt><dd>{nft.collectionName}</dd></div><div><dt>Registro</dt><dd>{nft.id.toUpperCase()}</dd></div><div><dt>Natureza</dt><dd>Obra demonstrativa</dd></div></dl><p className="detail-note">Esta edição é uma demonstração. Compra e seleção de edições ainda estão em implementação.</p><Link to="/" className="k-button">Continuar explorando ↗</Link></div></div></div>
}
