import { Link } from '@tanstack/react-router'
import { useCart, useQuote, useCartPreferences, useCartNfts } from '@/application/cart'
import { useSession } from '@/application/account'
import { Button, QuantityStepper, PriceTag } from '@/ui/components'
import { Breadcrumb } from '@/ui/layout'
import { NftCarousel } from '@/ui/catalog'
import { QuoteSummary } from './QuoteSummary'
import { CouponField } from './CouponField'

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error.response as { data?: { message?: string } }
    if (response?.data?.message) return response.data.message
  }
  return 'Não foi possível atualizar o carrinho. Tente novamente.'
}
export function CartPage() {
  const cart = useCart()
  const session = useSession()
  const preferences = useCartPreferences()
  const nfts = useCartNfts(cart.items)
  const recommendation = nfts.find(result => result.data)?.data
  const quote = useQuote({ items: cart.items.map(({ editionId, quantity }) => ({ editionId, quantity })), network: preferences.network, couponCode: preferences.couponCode || undefined })
  const unavailable = nfts.some(result => result.isError) || cart.items.some(item => {
    const edition = nfts.find(result => result.data?.id === item.nftId)?.data?.editions.find(edition => edition.id === item.editionId)
    return !edition || edition.available < item.quantity
  })
  return <div className="market-page"><Breadcrumb current="Carrinho" /><header className="market-header"><p className="eyebrow">SUA SELEÇÃO / {cart.count} UNIDADES</p><h1 className="market-title">Carrinho</h1></header>
    {cart.error && <div className="market-error" role="alert"><p>{errorMessage(cart.error)}</p><Button variant="outline" onClick={() => void cart.refetch()}>Tentar novamente</Button></div>}
    {cart.adjusted && <p className="market-message" role="status">Quantidades foram ajustadas à disponibilidade atual.</p>}
    {cart.notice && <p className="market-message" role="status">{cart.notice}</p>}
    {cart.isLoading ? <p role="status">Carregando carrinho…</p> : cart.items.length === 0 ? <section className="market-empty"><h2>Seu carrinho está vazio.</h2><p>Encontre uma obra para começar sua coleção.</p><Link className="k-button k-button-primary" to="/">Explorar acervo</Link></section> : <div className="market-grid"><section className="market-stack" aria-label="Itens do carrinho">{cart.items.map(item => {
      const nft = nfts.find(result => result.data?.id === item.nftId)?.data
      const edition = nft?.editions.find(edition => edition.id === item.editionId)
      const line = quote.data?.items.find(line => line.editionId === item.editionId)
      const max = edition ? Math.min(edition.available, edition.purchaseLimit ?? edition.available) : 0
      return <article className="market-panel market-stack" key={item.id}><div className="market-row">{nft && <img src={nft.image} alt="" width="84" height="84" />}<div><h2>{nft?.title ?? 'Carregando obra…'}</h2><p>{edition?.label ?? item.editionId}</p>{edition && <PriceTag value={edition.price} />}</div></div>{max < item.quantity && <p className="market-error">{max === 0 ? 'Edição esgotada. Remova para continuar.' : `Disponibilidade alterada: máximo ${max}. Ajuste a quantidade.`}</p>}<div className="market-actions"><QuantityStepper value={item.quantity} max={max} disabled={cart.isPending} label={`Quantidade ${nft?.title ?? 'da obra'}`} onChange={quantity => void cart.updateItem(item.id, quantity).catch(() => {})} /><Button variant="ghost" disabled={cart.isPending} onClick={() => void cart.removeItem(item.id).catch(() => {})}>Remover {nft?.title ?? 'item'}</Button></div>{line && <p className="mono">Total da linha: {line.subtotal} ETH</p>}</article>
    })}<Link to="/" className="k-button">Continuar explorando</Link></section><aside className="market-panel market-summary market-stack"><h2>Resumo do pedido</h2><label className="market-field">Rede<select aria-label="Rede da cotação" value={preferences.network} onChange={event => preferences.setNetwork(event.target.value as typeof preferences.network)}><option value="ethereum">Ethereum</option><option value="polygon">Polygon</option><option value="solana">Solana</option></select></label><CouponField key={preferences.owner} value={preferences.couponCode} onChange={preferences.setCouponCode} error={quote.error && preferences.couponCode ? errorMessage(quote.error) : undefined} /><QuoteSummary quote={quote.data} isLoading={quote.isFetching} error={quote.error} />{quote.error && <Button variant="outline" onClick={() => void quote.refetch()}>Atualizar cotação</Button>}{unavailable || quote.isError || quote.isFetching || cart.isPending ? <Button disabled>Revise o carrinho para continuar</Button> : session.status === 'collector' ? <Link className="k-button k-button-primary" to="/checkout">Finalizar pedido</Link> : <Link className="k-button k-button-primary" to="/login" search={{ returnTo: '/checkout' }}>Conectar e finalizar</Link>}<p className="market-muted">Compra simulada em ETH. Nenhuma cobrança real.</p></aside></div>}
    {recommendation && <NftCarousel collection={recommendation.collection} excludeId={recommendation.id} />}
  </div>
}
