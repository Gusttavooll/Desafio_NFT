import type { ReceiptItem } from '@/domain/orders'
import type { QuoteDto } from '@/application/cart'

export function OrderItems({ items }: { items: ReceiptItem[] | QuoteDto['items'] }) {
  return <ul className="market-stack" aria-label="Itens do pedido">{items.map(item => <li key={item.editionId} className="flex min-w-0 items-start gap-[var(--space-4)]">
    {item.image && <img src={item.image} alt={`Miniatura de ${item.title}`} width="64" height="64" className="size-[calc(var(--grid)*2)] shrink-0 rounded-[var(--radius-inner)] object-cover" />}
    <div className="min-w-0 flex-1 break-words"><strong>{item.title}</strong><p className="eyebrow">{item.tokenId} · {item.editionLabel} · {item.quantity} unidade{item.quantity !== 1 ? 's' : ''}</p><span className="market-muted">{item.unitPrice} ETH por unidade</span><p className="mono">Subtotal: {item.subtotal} ETH</p></div>
  </li>)}</ul>
}
