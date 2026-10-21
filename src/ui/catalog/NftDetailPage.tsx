import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useNft, editionLimit, clampEditionQuantity } from '@/application/catalog'
import { useCart } from '@/application/cart'
import type { Nft } from '@/domain/catalog'
import { Breadcrumb } from '@/ui/layout'
import { Button, PriceTag, QuantityStepper, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/components'
import { FavoriteButton } from './FavoriteButton'
import { NftCarousel } from './NftCarousel'
import './catalog.css'

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const { data: nft, isPending, isError, error, refetch } = useNft(nftId)
  if (isPending) return <NftDetailSkeleton />
  if (isError || !nft) {
    const notFound = error && 'status' in error && error.status === 404
    return <div className="page-container catalog-empty"><h1>{notFound ? 'Obra não encontrada.' : 'Não foi possível abrir a obra.'}</h1>{!notFound && <button className="k-button" onClick={() => void refetch()}>Tentar novamente</button>}<Link className="k-button" to="/">Voltar ao acervo</Link></div>
  }
  return <NftPurchase key={nft.id} nft={nft} />
}

function NftDetailSkeleton() {
  return <div className="page-container"><Breadcrumb current="Carregando obra" /><div className="nft-detail" role="status" aria-busy="true" aria-label="Carregando obra"><p className="sr-only">Carregando obra…</p><div><div className="art-frame"><Skeleton className="aspect-square" /></div><div className="detail-thumbnails">{[0, 1, 2].map(index => <Skeleton key={index} className="aspect-square max-w-[calc(var(--grid)*3)]" />)}</div></div><div className="detail-copy market-stack"><Skeleton className="h-4 max-w-1/3" /><Skeleton className="h-[calc(var(--grid)*3)]" /><div className="market-stack"><Skeleton className="h-4" /><Skeleton className="h-4 max-w-3/4" /></div><div className="detail-price"><Skeleton className="h-4 max-w-1/3" /><Skeleton className="h-6 max-w-1/2" /></div><div className="edition-picker">{[0, 1, 2].map(index => <Skeleton key={index} className="h-[var(--touch)]" />)}</div><Skeleton className="h-[var(--touch)]" /><Skeleton className="h-[var(--touch)]" /></div></div></div>
}

function NftPurchase({ nft }: { nft: Nft }) {
  const cart = useCart()
  const [selected, setSelected] = useState(nft.editions.find(edition => editionLimit(edition) > 0)?.id ?? nft.editions[0]?.id ?? '')
  const [requestedQuantity, setQuantity] = useState(1)
  const [image, setImage] = useState(nft.image)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const edition = nft.editions.find(item => item.id === selected)
  const max = edition ? editionLimit(edition) : 0
  const quantity = edition ? clampEditionQuantity(requestedQuantity, edition) : 0
  async function add() {
    if (!edition || quantity < 1) return
    setMessage(''); setError('')
    try {
      await cart.addItem({ nftId: nft.id, editionId: edition.id, quantity })
      setMessage(`${quantity} ${quantity === 1 ? 'unidade adicionada' : 'unidades adicionadas'} ao carrinho.`)
    } catch { setError('Não foi possível adicionar. Confira a disponibilidade e tente novamente.') }
  }
  return <div className="page-container nft-purchase-page"><Breadcrumb current={nft.title} /><div className="nft-detail">
    <div><div className="art-frame"><img src={image} alt={nft.title} width="1000" height="1000" fetchPriority="high" /></div><div className="detail-thumbnails" role="group" aria-label="Galeria da obra">{(nft.images ?? [nft.image]).map((url, index) => <button type="button" key={url} aria-label={`Ver imagem ${index + 1}`} aria-pressed={image === url} onClick={() => setImage(url)}><img src={url} alt="" width="100" height="100" loading="lazy" /></button>)}</div></div>
    <div className="detail-copy"><p className="eyebrow">REGISTRO {nft.id.toUpperCase()} / {nft.network}</p><h1>{nft.title}</h1><p>{nft.description}</p>
      <div className="detail-price"><span className="eyebrow">A PARTIR DE / VALOR DEMONSTRATIVO</span><PriceTag value={nft.price} />{nft.oldPrice && <span className="market-muted">Anterior: <s>{nft.oldPrice} ETH</s></span>}</div>
      <fieldset className="edition-picker"><legend className="eyebrow">Escolha a edição</legend>{nft.editions.map(item => <label key={item.id} className={`edition-option ${selected === item.id ? 'selected' : ''}`}><input type="radio" name="edition" value={item.id} checked={selected === item.id} disabled={editionLimit(item) === 0} onChange={() => { setSelected(item.id); setQuantity(1); setMessage('') }} /><span><strong>{item.label}</strong><small>{item.available > 0 ? `${item.available} disponíveis` : 'Esgotada'}</small></span><span className="edition-amount">{item.price} ETH</span></label>)}</fieldset>
      <p className="market-muted">{max === 0 ? 'Esta edição está esgotada. Escolha outra edição disponível.' : `Máximo de ${max} por compra${edition?.purchaseLimit && max === edition.purchaseLimit ? ' nesta edição' : ', conforme disponibilidade'}.`}</p>
      <div className="purchase-controls" role="group" aria-label="Comprar esta edição"><div className="market-row"><QuantityStepper value={quantity} max={max} onChange={setQuantity} label="Quantidade da obra" /><span className="eyebrow">{edition?.price ?? nft.price} ETH / UN.</span></div><Button type="button" disabled={max === 0 || cart.isPending} onClick={() => void add()}>{cart.isPending ? 'Adicionando…' : 'Adicionar ao carrinho'}</Button><Link className="k-button" to="/cart">Carrinho{cart.count > 0 ? ` (${cart.count})` : ''}</Link></div>
      <FavoriteButton nftId={nft.id} />
      {message && <div className="market-message" role="status">{message} <Link to="/cart">Ver carrinho →</Link></div>}{error && <p className="market-error" role="alert">{error}</p>}
      <p className="detail-note">Compra demonstrativa com carteiras simuladas. Nenhuma cobrança real ou emissão de NFT.</p>
      <Tabs defaultValue="details"><TabsList aria-label="Informações da obra"><TabsTrigger value="details">Detalhes do NFT</TabsTrigger><TabsTrigger value="reviews">Avaliações</TabsTrigger></TabsList><TabsContent value="details"><dl><div><dt>Coleção</dt><dd>{nft.collectionName}</dd></div><div><dt>Token</dt><dd>{nft.tokenId ?? nft.id}</dd></div>{nft.attributes?.map(attribute => <div key={attribute.trait}><dt>{attribute.trait}</dt><dd>{attribute.value}</dd></div>)}</dl></TabsContent><TabsContent value="reviews"><p>{nft.rating?.toFixed(1) ?? '0.0'} / 5 · {nft.reviewCount ?? 0} avaliações demonstrativas.</p><p className="market-muted">A pontuação faz parte dos dados de demonstração. O envio de novas avaliações não integra o desafio.</p></TabsContent></Tabs>
      <Link to="/" className="k-button">Continuar explorando ↗</Link>
    </div></div><NftCarousel collection={nft.collection} excludeId={nft.id} /></div>
}
