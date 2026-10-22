import type { Order, OrderStatus } from './order'

export interface CollectorData {
  displayName: string
  username: string
  email: string
  ensName?: string
  note?: string
}
export type CollectorErrors = Partial<Record<keyof CollectorData, string>>
export function validateCollector(collector: CollectorData): CollectorErrors {
  const errors: CollectorErrors = {}
  if (typeof collector.displayName !== 'string' || !collector.displayName.trim()) errors.displayName = 'Informe seu nome de exibição.'
  if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(collector.username ?? '')) errors.username = 'Use de 3 a 40 letras, números, pontos ou traços.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collector.email ?? '')) errors.email = 'Informe um e-mail válido.'
  if (collector.ensName && !/^[a-zA-Z0-9-]+\.eth$/.test(collector.ensName)) errors.ensName = 'O nome ENS deve terminar em .eth.'
  if ((collector.note?.length ?? 0) > 500) errors.note = 'A observação deve ter até 500 caracteres.'
  return errors
}

interface ComparableQuote {
  quotedAt?: string
  items: Array<{ editionId: string; quantity: number; unitPrice: string; subtotal: string; available: number }>
  subtotal: string
  discount: string
  networkFee: string
  total: string
  coupon: { code: string; status: string } | null
}
export function compareQuotes(previous: ComparableQuote, current: ComparableQuote): string[] {
  const changes: string[] = []
  const previousItems = [...previous.items].sort((a, b) => a.editionId.localeCompare(b.editionId))
  const currentItems = [...current.items].sort((a, b) => a.editionId.localeCompare(b.editionId))
  const projection = (items: typeof previousItems, field: 'available' | 'unitPrice' | 'quantity') => items.map(item => [item.editionId, item[field]])
  if (JSON.stringify(projection(previousItems, 'quantity')) !== JSON.stringify(projection(currentItems, 'quantity'))) changes.push('Itens e quantidades')
  if (previous.subtotal !== current.subtotal || JSON.stringify(projection(previousItems, 'unitPrice')) !== JSON.stringify(projection(currentItems, 'unitPrice'))) changes.push('Preço dos NFTs')
  if (JSON.stringify(projection(previousItems, 'available')) !== JSON.stringify(projection(currentItems, 'available'))) changes.push('Disponibilidade')
  if (previous.networkFee !== current.networkFee) changes.push('Taxa de rede')
  if (previous.discount !== current.discount || JSON.stringify(previous.coupon) !== JSON.stringify(current.coupon)) changes.push('Cupom')
  if (previous.total !== current.total && changes.length === 0) changes.push('Total')
  return changes
}

export function transitionOrder(current: OrderStatus, next: OrderStatus): OrderStatus {
  return current === 'pending' ? next : current
}

export function reconcileOrder(current: Order | undefined, incoming: Order): Order {
  if (!current) return incoming
  if (current.id !== incoming.id || current.version >= incoming.version || current.status !== 'pending') return current
  return incoming
}

export function purchasedRemainder<T extends { editionId: string; quantity: number }>(cart: T[], purchased: Array<{ editionId: string; quantity: number }>): T[] {
  const quantities = new Map(purchased.map(item => [item.editionId, item.quantity]))
  return cart.map(item => ({ ...item, quantity: Math.max(0, item.quantity - (quantities.get(item.editionId) ?? 0)) })).filter(item => item.quantity > 0)
}
