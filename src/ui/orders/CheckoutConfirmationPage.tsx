import { Link, Navigate, useNavigate, useSearch } from '@tanstack/react-router'
import { useSession } from '@/application/account'
import { orderError, useOrder } from '@/application/orders'
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, PriceTag, Skeleton } from '@/ui/components'
import { Breadcrumb } from '@/ui/layout'
import { OrderItems } from './OrderItems'

function ConfirmationContent({ id, explorer }: { id: string; explorer: boolean }) {
  const order = useOrder(id || null)
  const navigate = useNavigate()
  if (!id) return <section className="market-panel market-stack"><h1 className="market-title">Nenhum pedido selecionado.</h1><p>Abra a confirmação de uma compra para consultar seu recibo.</p><Button asChild><Link to="/">Explorar acervo</Link></Button></section>
  if (order.isPending) return <div role="status"><p>Consultando pedido…</p><Skeleton className="h-24" /></div>
  if (order.error) return <section className="market-panel market-stack"><h1 className="market-title">Recibo indisponível.</h1><p role="alert" className="market-error">{orderError(order.error).message}</p><Button onClick={() => void order.refetch()}>Tentar novamente</Button><Link to="/">Voltar ao acervo</Link></section>
  if (order.data?.status !== 'confirmed' || !order.data.receipt) return <section className="market-panel market-stack"><h1 className="market-title">{order.data?.status === 'rejected' ? 'Pedido recusado.' : 'Pedido em processamento.'}</h1><p>{order.data?.status === 'rejected' ? 'Não houve compra confirmada. O carrinho foi preservado.' : 'A confirmação só será exibida quando a API confirmar o pedido.'}</p><Button asChild variant="outline"><Link to="/checkout">Voltar ao pagamento</Link></Button></section>
  const receipt = order.data.receipt
  return <><header className="market-header"><div><p className="eyebrow">REGISTRO CONCLUÍDO</p><h1 className="market-title">Sua coleção, ampliada.</h1></div><Button asChild variant="outline"><Link to="/">Continuar explorando</Link></Button></header>
    <Dialog open onOpenChange={open => { if (!open) void navigate({ to: '/' }) }}><DialogContent className="sm:max-w-[calc(var(--grid-major)*6)]"><DialogHeader><p className="eyebrow">RECIBO // SIMULAÇÃO</p><DialogTitle className="text-4xl">Compra confirmada.</DialogTitle><DialogDescription>Este recibo registra os valores aceitos no pedido. Preços futuros do acervo não alteram este comprovante.</DialogDescription></DialogHeader>
      {explorer && <p className="market-message">Explorador simulado: esta transação não foi enviada a uma blockchain pública.</p>}
      <dl className="market-stack"><div className="market-row"><dt>Transação simulada</dt><dd className="mono break-all">{receipt.transaction.hash}</dd></div><div className="market-row"><dt>Data</dt><dd>{new Date(receipt.issuedAt).toLocaleString('pt-BR')}</dd></div><div className="market-row"><dt>Carteira</dt><dd className="mono break-all">{receipt.walletAddress}</dd></div></dl>
      <OrderItems items={receipt.items} />
      <dl className="market-stack"><div className="market-row"><dt>Subtotal</dt><dd><PriceTag value={receipt.subtotal} /></dd></div><div className="market-row"><dt>Desconto</dt><dd><PriceTag value={receipt.discount} /></dd></div><div className="market-row"><dt>Taxa de rede</dt><dd><PriceTag value={receipt.networkFee} /></dd></div><div className="market-row"><dt><strong>Total</strong></dt><dd><PriceTag value={receipt.total} /></dd></div></dl>
      <p className="market-muted">Nenhuma cobrança real ocorreu. Pedido {order.data.id}.</p><div className="market-actions"><Button asChild><Link to="/">Continuar explorando</Link></Button><Button asChild variant="outline"><Link to="/checkout/confirmation" search={{ orderId: id, explorer: '1' }}>Ver no explorador simulado</Link></Button></div>
    </DialogContent></Dialog>
  </>
}
export function CheckoutConfirmationPage() {
  const session = useSession()
  const search = useSearch({ from: '/checkout/confirmation' })
  if (session.status === 'loading') return <div className="market-page" role="status">Recuperando sessão…</div>
  if (session.status !== 'collector') return <Navigate to="/login" search={{ returnTo: `/checkout/confirmation?orderId=${encodeURIComponent(search.orderId)}` }} />
  return <div className="page-container market-page"><Breadcrumb current="Confirmação" /><ConfirmationContent key={`${session.userId}:${search.orderId}`} id={search.orderId} explorer={search.explorer === '1'} /></div>
}
