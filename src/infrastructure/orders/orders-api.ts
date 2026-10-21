import { parseEthAmount } from '@/domain/shared'
import type { Order } from '@/domain/orders'
import { httpClient } from '@/infrastructure/http/http-client'
import type { CreateOrderBody, OrderDto } from './dto'

export function mapOrder(dto: OrderDto): Order {
  return { ...dto, receipt: dto.receipt ? { ...dto.receipt,
    items: dto.receipt.items.map(item => ({ ...item, unitPrice: parseEthAmount(item.unitPrice), subtotal: parseEthAmount(item.subtotal) })),
    subtotal: parseEthAmount(dto.receipt.subtotal), discount: parseEthAmount(dto.receipt.discount), networkFee: parseEthAmount(dto.receipt.networkFee), total: parseEthAmount(dto.receipt.total),
  } : null }
}
export async function postOrder(body: CreateOrderBody, key: string, signal?: AbortSignal): Promise<Order> {
  return mapOrder((await httpClient.post<OrderDto>('/orders', body, { headers: { 'Idempotency-Key': key }, timeout: 4000, signal })).data)
}
export async function getOrder(id: string, signal?: AbortSignal): Promise<Order> {
  return mapOrder((await httpClient.get<OrderDto>(`/orders/${encodeURIComponent(id)}`, { signal })).data)
}
export interface OrderAttempt { key: string; body: CreateOrderBody; orderId?: string }
export function orderAttempt(owner: string, value?: OrderAttempt | null): OrderAttempt | null {
  try {
    const key = `kronos.order-attempt:${owner}`
    if (value === null) localStorage.removeItem(key)
    else if (value) localStorage.setItem(key, JSON.stringify(value))
    return JSON.parse(localStorage.getItem(key) ?? 'null') as OrderAttempt | null
  } catch { return null }
}
export function checkoutDraft(owner: string, value?: CreateOrderBody['collector'] | null): CreateOrderBody['collector'] | null {
  try {
    const key = `kronos.checkout-draft:${owner}`
    if (value === null) localStorage.removeItem(key)
    else if (value) localStorage.setItem(key, JSON.stringify(value))
    return JSON.parse(localStorage.getItem(key) ?? 'null') as CreateOrderBody['collector'] | null
  } catch { return null }
}
export function clearCheckoutStorage(owner: string): void { orderAttempt(owner, null); checkoutDraft(owner, null) }
export function clearAllCheckoutStorage(): void {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => !!key && (key.startsWith('kronos.order-attempt:') || key.startsWith('kronos.checkout-draft:')))
    for (const key of keys) localStorage.removeItem(key)
  } catch { /* Storage can be unavailable; private cache is still session-scoped. */ }
}
