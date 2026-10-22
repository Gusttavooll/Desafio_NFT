import { useEffect, useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query'
import { useSession, getSessionToken } from '@/application/account'
import { scopedQueryKey } from '@/application/shared'
import { queryClient } from '@/application/query-client'
import { getCart, mergeCart, postCartItem, patchCartItem, deleteCartItem, requestQuote, cartPreferences, mergeCartPreferences } from '@/infrastructure/cart'
import type { AddCartItemBody, CartDto, CartItemDto, QuoteRequest } from '@/infrastructure/cart'
import { getNft } from '@/infrastructure/catalog'
import type { DomainEvent } from '@/domain/shared'

export const cartQueryKeys = {
  cart: (userId: string | null) => scopedQueryKey(userId, 'cart'),
  quote: (userId: string | null, request?: QuoteRequest) => scopedQueryKey(userId, 'quote', ...(request ? [request] : [])),
}
export function useCart() {
  const session = useSession()
  const client = useQueryClient()
  const [notice, setNotice] = useState('')
  const key = useMemo(() => cartQueryKeys.cart(session.userId), [session.userId])
  const cart = useQuery({ queryKey: key, enabled: session.status !== 'loading', queryFn: async ({ signal }) => {
    if (!session.userId) return getCart(signal)
    const token = getSessionToken()
    const result = await mergeCart(signal)
    if (signal.aborted || token !== getSessionToken()) throw new Error('A sessão mudou. Recarregue o carrinho atual.')
    mergeCartPreferences(session.userId)
    window.dispatchEvent(new Event('kronos-cart-preferences'))
    return result
  }, retry: false, refetchOnWindowFocus: true })
  useEffect(() => {
    const sync = () => { void client.invalidateQueries({ queryKey: key }) }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [client, key])
  type Operation = ({ action: 'add'; body: AddCartItemBody } | { action: 'update'; id: string; quantity: number } | { action: 'remove'; id: string }) & { token: string | null }
  const mutation = useMutation({
    mutationKey: key, scope: { id: `cart:${session.userId ?? 'guest'}` }, retry: false,
    mutationFn: (operation: Operation) => {
      if (operation.token !== getSessionToken()) throw new Error('A sessão mudou. Refaça a operação no carrinho atual.')
      return operation.action === 'add' ? postCartItem(operation.body) : operation.action === 'update' ? patchCartItem(operation.id, operation.quantity) : deleteCartItem(operation.id)
    },
    onMutate: async operation => {
      await client.cancelQueries({ queryKey: key })
      if (operation.token !== getSessionToken()) return { previous: undefined }
      const previous = client.getQueryData<CartDto>(key)
      if (previous && operation.action !== 'add') client.setQueryData<CartDto>(key, { ...previous, items: operation.action === 'remove' ? previous.items.filter(item => item.id !== operation.id) : previous.items.map(item => item.id === operation.id ? { ...item, quantity: operation.quantity } : item) })
      return { previous }
    },
    onSuccess: (data, operation) => { if (operation.token === getSessionToken()) client.setQueryData(key, data) },
    onError: (_error, operation, context) => { if (operation.token === getSessionToken() && context?.previous) client.setQueryData(key, context.previous) },
    onSettled: (_data, _error, operation) => { if (operation.token === getSessionToken()) { void client.invalidateQueries({ queryKey: key }); void client.invalidateQueries({ queryKey: cartQueryKeys.quote(session.userId) }) } },
  })
  const items = cart.data?.items ?? []
  useEffect(() => {
    const updated = (event: Event) => {
      const id = (event as CustomEvent<string>).detail
      if (cart.data?.items.some(item => item.nftId === id)) setNotice('Preço ou disponibilidade atualizados. Confira a nova cotação antes de continuar.')
    }
    window.addEventListener('kronos-cart-nft-update', updated)
    return () => window.removeEventListener('kronos-cart-nft-update', updated)
  }, [cart.data])
  return { ...cart, cart: cart.data, items, count: items.reduce((sum, item) => sum + item.quantity, 0), isLoading: cart.isPending || session.status === 'loading', error: mutation.error ?? cart.error,
    notice,
    isPending: mutation.isPending, adjusted: cart.data && 'adjusted' in cart.data ? Boolean(cart.data.adjusted) : false,
    addItem: (body: AddCartItemBody) => mutation.mutateAsync({ action: 'add', body, token: getSessionToken() }),
    updateItem: (id: string, quantity: number) => mutation.mutateAsync({ action: 'update', id, quantity, token: getSessionToken() }),
    removeItem: (id: string) => mutation.mutateAsync({ action: 'remove', id, token: getSessionToken() }),
  }
}
export function useQuote(request: QuoteRequest) {
  const session = useSession()
  return useQuery({ queryKey: cartQueryKeys.quote(session.userId, request), queryFn: ({ signal }) => requestQuote(request, signal), enabled: session.status !== 'loading', retry: false, staleTime: 0 })
}
export function useCartNfts(items: CartItemDto[]) {
  const ids = [...new Set(items.map(item => item.nftId))]
  return useQueries({ queries: ids.map(id => ({ queryKey: ['catalog', id], queryFn: ({ signal }: { signal: AbortSignal }) => getNft(id, signal) })) })
}
export function useCartPreferences() {
  const session = useSession()
  const owner = session.userId ?? 'guest'
  const [state, setState] = useState(() => ({ owner, ...cartPreferences(owner) }))
  useEffect(() => {
    const refresh = () => setState({ owner, ...cartPreferences(owner) })
    window.addEventListener('kronos-cart-preferences', refresh)
    return () => window.removeEventListener('kronos-cart-preferences', refresh)
  }, [owner])
  const current = state.owner === owner ? state : { owner, ...cartPreferences(owner) }
  const set = (patch: Partial<Pick<typeof current, 'couponCode' | 'network'>>) => {
    const next = { ...current, ...patch }
    cartPreferences(owner, next)
    setState(next)
  }
  return { ...current, setCouponCode: (couponCode: string) => set({ couponCode }), setNetwork: (network: typeof current.network) => set({ network }) }
}
let lastVersion: Record<string, number> = {}
export function applyCartNftUpdate(event: DomainEvent<unknown>) {
  if (event.resource !== 'nft' || event.version <= (lastVersion[event.resourceId] ?? -1)) return
  lastVersion = { ...lastVersion, [event.resourceId]: event.version }
  window.dispatchEvent(new CustomEvent('kronos-cart-nft-update', { detail: event.resourceId }))
  void queryClient.invalidateQueries({ predicate: query => query.queryKey.includes('cart') || query.queryKey.includes('quote') || query.queryKey.includes('catalog') })
}
