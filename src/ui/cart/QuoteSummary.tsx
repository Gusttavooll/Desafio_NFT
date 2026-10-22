import type { QuoteDto } from '@/application/cart'
import { Skeleton } from '@/ui/components'

export function QuoteSummary({ quote, isLoading, error }: { quote?: QuoteDto; isLoading?: boolean; error?: unknown }) {
  if (isLoading) return <div role="status" className="market-stack"><p>Atualizando cotação…</p><Skeleton className="h-24" /></div>
  if (error) return <p className="market-error" role="alert">Não foi possível obter a cotação. Revise os itens ou tente novamente.</p>
  if (!quote) return null
  return <dl className="market-stack" aria-live="polite"><div className="market-row"><dt>Subtotal</dt><dd>{quote.subtotal} ETH</dd></div><div className="market-row"><dt>Desconto{quote.coupon ? ` (${quote.coupon.code})` : ''}</dt><dd>−{quote.discount} ETH</dd></div><div className="market-row"><dt>Taxa de rede <small>(estimada)</small></dt><dd>{quote.networkFee} ETH</dd></div><div className="market-row"><dt><strong>Total</strong></dt><dd><strong>{quote.total} ETH</strong></dd></div></dl>
}
