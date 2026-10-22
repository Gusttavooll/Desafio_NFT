import { httpClient } from '@/infrastructure/http/http-client'
import type { CartDto, AddCartItemBody, QuoteRequest, QuoteDto } from './dto'

export const getCart = async (signal?: AbortSignal) => (await httpClient.get<CartDto>('/cart', { signal })).data
export const mergeCart = async (signal?: AbortSignal) => (await httpClient.post<CartDto & { adjusted: boolean }>('/cart/merge', undefined, { signal })).data
export const postCartItem = async (body: AddCartItemBody) => (await httpClient.post<CartDto>('/cart/items', body)).data
export const patchCartItem = async (id: string, quantity: number) => (await httpClient.patch<CartDto>(`/cart/items/${encodeURIComponent(id)}`, { quantity })).data
export const deleteCartItem = async (id: string) => (await httpClient.delete<CartDto>(`/cart/items/${encodeURIComponent(id)}`)).data
export const requestQuote = async (body: QuoteRequest, signal?: AbortSignal) => (await httpClient.post<QuoteDto>('/quotes', body, { signal })).data
export const revalidateQuote = requestQuote
export function mergeCartPreferences(owner: string) {
  try {
    const guest = localStorage.getItem('kronos.cart.preferences:guest')
    if (guest && !localStorage.getItem(`kronos.cart.preferences:${owner}`)) localStorage.setItem(`kronos.cart.preferences:${owner}`, guest)
    localStorage.removeItem('kronos.cart.preferences:guest')
  } catch { /* Storage can be blocked; the server cart still persists. */ }
}
export function cartPreferences(owner: string, value?: { couponCode: string; network: string }) {
  const key = `kronos.cart.preferences:${owner}`
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value))
    const result = JSON.parse(localStorage.getItem(key) ?? '{}')
    return { couponCode: typeof result.couponCode === 'string' ? result.couponCode : '', network: ['ethereum', 'polygon', 'solana'].includes(result.network) ? result.network as 'ethereum' | 'polygon' | 'solana' : 'ethereum' as const }
  } catch { return { couponCode: '', network: 'ethereum' as const } }
}
