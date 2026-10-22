import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from '@tanstack/react-router'
import { useProfile, useSession } from '@/application/account'
import { useCart, useCartPreferences, useQuote } from '@/application/cart'
import { useCheckout, orderError, type CollectorData } from '@/application/orders'
import { useWallets, walletApiError } from '@/application/wallets'
import type { Network, Wallet } from '@/domain/wallets'
import { Button, Input, RadioGroup, RadioGroupItem, Skeleton, Textarea } from '@/ui/components'
import { Breadcrumb } from '@/ui/layout'
import { CouponField, QuoteSummary } from '@/ui/cart'
import { OrderItems } from './OrderItems'

function CheckoutContent({ owner, defaults, wallets }: { owner: string; defaults: CollectorData; wallets: Wallet[] }) {
  const navigate = useNavigate()
  const cart = useCart()
  const preferences = useCartPreferences()
  const [walletId, setWalletId] = useState(wallets.find(wallet => wallet.kind === 'primary')?.id ?? wallets[0]?.id ?? '')
  const [connection, setConnection] = useState<'connected' | 'disconnected' | 'refused'>('disconnected')
  const selected = wallets.find(wallet => wallet.id === walletId)
  const request = { items: cart.items.map(item => ({ editionId: item.editionId, quantity: item.quantity })), network: preferences.network, ...(preferences.couponCode ? { couponCode: preferences.couponCode } : {}) }
  const quote = useQuote(request)
  const checkout = useCheckout(owner, defaults)
  const displayed = checkout.review?.request === JSON.stringify(request) ? checkout.review.quote : quote.data
  const order = checkout.order.data
  useEffect(() => {
    if (order?.status === 'confirmed') void navigate({ to: '/checkout/confirmation', search: { orderId: order.id } })
  }, [navigate, order])
  useEffect(() => { if (Object.keys(checkout.fields).length) document.querySelector<HTMLInputElement>('#collector-form [aria-invalid="true"]')?.focus() }, [checkout.fields])
  if (cart.isLoading) return <div className="market-panel" role="status"><p>Carregando seus NFTs…</p><Skeleton className="h-24" /></div>
  if (!cart.items.length && !checkout.attempt) return <Navigate to="/cart" />
  if (checkout.attempt?.orderId && !order) return <section className="market-panel market-stack"><h2 className="text-4xl">Recuperando pedido registrado.</h2><p>Consultamos o resultado antes de permitir uma nova compra.</p>{checkout.order.error ? <p className="market-error" role="alert">{orderError(checkout.order.error).message}</p> : <p role="status">Consultando status…</p>}<Button variant="outline" onClick={() => void checkout.order.refetch()}>Consultar status</Button>{orderError(checkout.order.error).code === 'not_found' && <Button onClick={checkout.retryRejected}>Revisar tentativa não encontrada</Button>}</section>
  if (order?.status === 'pending') return <section className="market-panel market-stack" role="status"><p className="eyebrow">TENTATIVA REGISTRADA</p><h2 className="text-4xl">Processando seu pedido.</h2><p>Aguardando o resultado da carteira simulada. Você pode atualizar esta página: o mesmo pedido será recuperado.</p><p className="mono">{order.id}</p>{checkout.order.error && <p className="market-error" role="alert">{orderError(checkout.order.error).message}</p>}<Button variant="outline" onClick={() => void checkout.order.refetch()}>Consultar status</Button></section>
  if (order?.status === 'rejected') return <section className="market-panel market-stack"><p className="eyebrow">PAGAMENTO NÃO CONCLUÍDO</p><h2 className="text-4xl">Pedido recusado.</h2><p>A carteira simulada recusou o pagamento ou uma edição ficou indisponível. Seus itens continuam no carrinho.</p><div className="market-actions"><Button onClick={checkout.retryRejected}>Revisar e tentar novamente</Button><Button asChild variant="outline"><Link to="/cart">Voltar ao carrinho</Link></Button></div></section>
  if (checkout.attempt && !checkout.attempt.orderId) return <section className="market-panel market-stack"><p className="eyebrow">RECONCILIAÇÃO</p><h2 className="text-4xl">Verificar tentativa enviada.</h2><p>Vamos consultar a mesma tentativa antes de permitir outra compra. Isso evita pedidos duplicados.</p>{checkout.error && <p role="alert" className="market-error">{checkout.error}</p>}<Button onClick={() => void checkout.recover()} disabled={checkout.busy} aria-busy={checkout.busy}>{checkout.busy ? 'Recuperando pedido…' : 'Recuperar mesmo pedido'}</Button></section>
  const field = (name: 'displayName' | 'username' | 'email' | 'ensName', label: string, optional = false) => <label htmlFor={`checkout-${name}`} className="market-field">{label}{!optional && ' *'}<Input id={`checkout-${name}`} value={checkout.collector[name] ?? ''} type={name === 'email' ? 'email' : 'text'} onChange={event => checkout.updateCollector({ [name]: event.target.value })} aria-invalid={!!checkout.fields[name]} aria-describedby={checkout.fields[name] ? `checkout-${name}-error` : undefined} disabled={checkout.busy} />{checkout.fields[name] && <span id={`checkout-${name}-error`} className="market-error">{checkout.fields[name]}</span>}</label>
  const chooseWallet = (id: string) => { setWalletId(id); setConnection('disconnected'); const wallet = wallets.find(item => item.id === id); if (wallet) preferences.setNetwork(wallet.network) }
  const compatible = selected?.network === preferences.network
  return <div className="market-grid"><div className="market-stack">
    <form id="collector-form" className="market-panel market-stack" noValidate onSubmit={event => { event.preventDefault(); if (connection === 'connected' && compatible) void checkout.execute(request, displayed, walletId) }}>
      <div><p className="eyebrow">01 // IDENTIFICAÇÃO</p><h2 className="text-3xl">Perfil do colecionador</h2></div>
      <div className="market-fields">{field('displayName', 'Nome de exibição')}{field('username', 'Nome do perfil')}{field('email', 'E-mail')}{field('ensName', 'Nome ENS', true)}</div>
      <label className="market-field" htmlFor="checkout-note">Observação (opcional)<Textarea id="checkout-note" value={checkout.collector.note ?? ''} maxLength={500} onChange={event => checkout.updateCollector({ note: event.target.value })} disabled={checkout.busy} aria-invalid={!!checkout.fields.note} aria-describedby={checkout.fields.note ? 'checkout-note-error' : undefined} /></label>{checkout.fields.note && <p id="checkout-note-error" className="market-error">{checkout.fields.note}</p>}
      <p className="market-muted">Os dados identificam este pedido. Alterações permanentes do perfil ficam em Minha conta.</p>
    </form>
    <section className="market-panel market-stack"><div><p className="eyebrow">02 // AUTORIZAÇÃO SIMULADA</p><h2 className="text-3xl">Carteira e rede</h2></div>
      {!wallets.length ? <div className="market-stack"><p>Cadastre uma carteira para continuar.</p><Button asChild><Link to="/wallets">Cadastrar carteira</Link></Button></div> : <>
      <RadioGroup value={walletId} onValueChange={chooseWallet} aria-label="Carteira para pagamento" disabled={checkout.busy}>{wallets.map(wallet => <RadioGroupItem key={wallet.id} id={`pay-${wallet.id}`} value={wallet.id} aria-label={`${wallet.nickname}, carteira ${wallet.kind === 'primary' ? 'principal' : 'secundária'}, ${wallet.network}`}><span><strong>{wallet.nickname}</strong><span className="block text-muted-foreground">{wallet.type} · {wallet.network}</span></span><span className="eyebrow">{wallet.kind === 'primary' ? 'Principal' : 'Secundária'}</span></RadioGroupItem>)}</RadioGroup>
      <label className="market-field">Endereço selecionado<Input readOnly value={selected?.address ?? ''} aria-label="Endereço da carteira selecionada" /></label>
      <RadioGroup value={preferences.network} onValueChange={value => { preferences.setNetwork(value as Network); setConnection('disconnected') }} className="market-fields" aria-label="Rede para pagamento" disabled={checkout.busy}>{(['ethereum', 'polygon', 'solana'] as const).map(network => <RadioGroupItem key={network} id={`network-${network}`} value={network} aria-label={network === 'ethereum' ? 'Ethereum' : network === 'polygon' ? 'Polygon' : 'Solana'}>{network === 'ethereum' ? 'Ethereum' : network === 'polygon' ? 'Polygon' : 'Solana'}</RadioGroupItem>)}</RadioGroup>
      {!compatible && <p role="alert" className="market-error">A carteira selecionada está cadastrada na rede {selected?.network}. Selecione uma carteira compatível ou altere a rede.</p>}
      <p aria-live="polite">{connection === 'connected' ? 'Carteira conectada (simulação).' : connection === 'refused' ? 'Conexão recusada. Você pode tentar novamente.' : 'Carteira desconectada.'}</p>
      <div className="market-actions">{connection === 'connected' ? <Button variant="outline" onClick={() => setConnection('disconnected')} disabled={checkout.busy}>Desconectar carteira</Button> : <Button variant="secondary" onClick={() => setConnection('connected')} disabled={!compatible || checkout.busy}>Conectar carteira simulada</Button>}<Button variant="ghost" onClick={() => setConnection('refused')} disabled={checkout.busy}>Simular recusa de conexão</Button></div>
      </>}
      <Link to="/wallets" className="underline">Gerenciar carteiras</Link>
    </section>
  </div><aside className="market-panel market-stack market-summary" aria-label="Revisão do pedido"><div><p className="eyebrow">03 // REVISÃO FINAL</p><h2 className="text-3xl">Seus NFTs</h2></div>
    {displayed && <OrderItems items={displayed.items} />}<QuoteSummary quote={displayed} isLoading={quote.isPending} error={quote.error} />
    <CouponField value={preferences.couponCode} onChange={preferences.setCouponCode} error={quote.error ? orderError(quote.error).message : undefined} />
    {checkout.changes.length > 0 && <div className="market-error market-panel" role="alert"><strong>A cotação mudou.</strong><p>Revise: {checkout.changes.join(', ')}. Confira o novo resumo e confirme novamente para aceitar.</p></div>}
    {checkout.error && <p role="alert" className="market-error">{checkout.error}</p>}{cart.error && <p role="alert" className="market-error">{orderError(cart.error).message}</p>}
    <Button form="collector-form" type="submit" disabled={checkout.busy || connection !== 'connected' || !compatible || !displayed || !!quote.error} aria-busy={checkout.busy}>{checkout.busy ? 'Revalidando e enviando…' : checkout.changes.length ? 'Aceitar nova cotação e confirmar' : 'Confirmar compra simulada'}</Button>
    <p className="market-muted">Compra de demonstração. Nenhuma cobrança ou emissão real de NFT será realizada.</p><Link to="/cart" className="underline">Voltar ao carrinho</Link>
  </aside></div>
}
function CheckoutLoader({ owner }: { owner: string }) {
  const profile = useProfile()
  const wallets = useWallets()
  if (profile.isPending || wallets.isPending) return <section className="market-panel" role="status"><p>Preparando pagamento…</p><Skeleton className="h-24" /></section>
  if (profile.error || wallets.error) return <section className="market-panel market-stack"><p className="market-error" role="alert">{walletApiError(profile.error ?? wallets.error).message}</p><Button onClick={() => { void profile.refetch(); void wallets.refetch() }}>Tentar novamente</Button></section>
  if (!profile.data || !wallets.data) return null
  return <CheckoutContent owner={owner} defaults={profile.data} wallets={[wallets.data.primary, wallets.data.secondary].filter((wallet): wallet is Wallet => wallet !== null)} />
}
export function CheckoutPage() {
  const session = useSession()
  if (session.status === 'loading') return <div className="market-page" role="status">Recuperando sessão…</div>
  if (session.status !== 'collector') return <Navigate to="/login" search={{ returnTo: '/checkout' }} />
  return <div className="page-container market-page"><Breadcrumb current="Pagamento" /><header className="market-header"><div><p className="eyebrow">COLEÇÃO // NOVO REGISTRO</p><h1 className="market-title">Finalize sua coleção.</h1><p>Revise os itens, conecte a carteira simulada e confirme a cotação.</p></div></header><CheckoutLoader key={session.userId} owner={session.userId!} /></div>
}
