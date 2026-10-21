import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getSessionToken, onSessionEnded, useSession } from '@/application/account'
import { cartQueryKeys } from '@/application/cart'
import { scopedQueryKey } from '@/application/shared'
import { compareQuotes, reconcileOrder, validateCollector, type CollectorData, type CollectorErrors, type Order } from '@/domain/orders'
import type { ApiError, DomainEvent } from '@/domain/shared'
import { revalidateQuote, type QuoteDto, type QuoteRequest } from '@/infrastructure/cart'
import { checkoutDraft, clearCheckoutStorage, clearAllCheckoutStorage, getOrder, mapOrder, orderAttempt, postOrder, type CreateOrderBody, type OrderAttempt, type OrderDto } from '@/infrastructure/orders'

export function startOrdersSessionLifecycle(): () => void {
  return onSessionEnded(clearAllCheckoutStorage)
}

export const orderQueryKeys = {
  all: (userId: string | null) => scopedQueryKey(userId, 'orders'),
  detail: (userId: string | null, id: string) => scopedQueryKey(userId, 'orders', id),
}
export function useOrder(id: string | null) {
  const session = useSession()
  const client = useQueryClient()
  const key = orderQueryKeys.detail(session.userId, id ?? '')
  return useQuery({ queryKey: key, queryFn: async ({ signal }) => {
    const incoming = await getOrder(id!, signal)
    return reconcileOrder(client.getQueryData<Order>(key), incoming)
  }, enabled: session.status === 'collector' && Boolean(id), retry: false,
    refetchInterval: query => query.state.data?.status === 'pending' ? 600 : false, refetchOnWindowFocus: true,
  })
}
export function applyOrderUpdate(client: QueryClient, userId: string | null, event: DomainEvent<unknown>): void {
  if (!userId || event.resource !== 'order') return
  const payload = event.payload as Partial<OrderDto>
  if (!payload || typeof payload !== 'object' || (payload.id !== undefined && payload.id !== event.resourceId) || !payload.status || !['pending', 'confirmed', 'rejected'].includes(payload.status)) return
  if (payload.status === 'confirmed' && !payload.receipt) return
  const key = orderQueryKeys.detail(userId, event.resourceId)
  const current = client.getQueryData<Order>(key)
  if (!current || current.version >= event.version || current.status !== 'pending') return
  try {
    client.setQueryData(key, reconcileOrder(current, mapOrder({ ...current, ...payload, id: current.id, createdAt: current.createdAt, version: event.version, updatedAt: event.occurredAt })))
  } catch {
    void client.invalidateQueries({ queryKey: key })
  }
}
export function orderError(error: unknown): { message: string; fields: CollectorErrors; quote?: QuoteDto; code?: string } {
  if (isAxiosError<ApiError>(error)) {
    const details = error.response?.data.details
    return { message: error.response?.data.message ?? 'A resposta não chegou. Recupere a tentativa para verificar o mesmo pedido.', code: error.response?.data.code,
      fields: Object.fromEntries(Object.entries(details ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string')),
      quote: details?.quote as QuoteDto | undefined,
    }
  }
  return { message: error instanceof Error ? error.message : 'Não foi possível consultar o pedido.', fields: {} }
}

export function useCheckout(owner: string, defaults: CollectorData) {
  const client = useQueryClient()
  const [collector, setCollector] = useState<CollectorData>(() => checkoutDraft(owner) ?? defaults)
  const [attempt, setAttempt] = useState<OrderAttempt | null>(() => orderAttempt(owner))
  const [review, setReview] = useState<{ request: string; quote: QuoteDto } | null>(null)
  const [changes, setChanges] = useState<string[]>([])
  const [fields, setFields] = useState<CollectorErrors>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const order = useOrder(attempt?.orderId ?? null)
  const active = useRef(true)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => onSessionEnded(() => { active.current = false; clearCheckoutStorage(owner) }), [owner])
  useEffect(() => {
    if (!order.data || order.data.status === 'pending') return
    orderAttempt(owner, null)
    if (order.data.status === 'confirmed') {
      checkoutDraft(owner, null)
      void client.invalidateQueries({ queryKey: cartQueryKeys.cart(owner) })
      void client.invalidateQueries({ queryKey: cartQueryKeys.quote(owner) })
    }
  }, [client, order.data, owner])

  const updateCollector = (patch: Partial<CollectorData>) => {
    const next = { ...collector, ...patch }
    setCollector(next); checkoutDraft(owner, next)
  }
  const remember = (value: OrderAttempt | null) => { orderAttempt(owner, value); if (active.current) setAttempt(value) }
  const send = async (current: OrderAttempt) => {
    const token = getSessionToken()
    if (!token || !active.current) return
    const controller = new AbortController()
    const stop = onSessionEnded(() => controller.abort())
    const stillCurrent = () => active.current && !controller.signal.aborted && getSessionToken() === token
    remember(current)
    try {
      let result: Order
      try { result = await postOrder(current.body, current.key, controller.signal) } catch (failure) {
        // A retry must never send the old collector's body under a new session token.
        if (!stillCurrent()) return
        if (!isAxiosError(failure) || failure.response) throw failure
        result = await postOrder(current.body, current.key, controller.signal)
      }
      if (!stillCurrent()) return
      remember({ ...current, orderId: result.id })
      client.setQueryData(orderQueryKeys.detail(owner, result.id), result)
    } finally {
      stop()
    }
  }
  const execute = async (request: QuoteRequest, displayed: QuoteDto | undefined, walletId: string) => {
    if (busyRef.current || order.data?.status === 'pending') return
    const actionToken = getSessionToken()
    if (!actionToken || !active.current) return
    const validation = validateCollector(collector)
    setFields(validation); setError('')
    if (Object.keys(validation).length) return
    if (!walletId || !displayed) { setError('Selecione uma carteira e aguarde a cotação.'); return }
    busyRef.current = true; setBusy(true)
    try {
      if (attempt && !order.data) { await send(attempt); return }
      const fresh = await revalidateQuote(request)
      if (!active.current || getSessionToken() !== actionToken) return
      const nextChanges = compareQuotes(displayed, fresh)
      if (nextChanges.length) {
        setReview({ request: JSON.stringify(request), quote: fresh }); setChanges(nextChanges)
        return
      }
      if (fresh.items.some(item => item.quantity > item.available)) { setError('Uma edição ficou sem disponibilidade. Ajuste o carrinho.'); return }
      if (fresh.coupon && fresh.coupon.status !== 'valid') { setError('Remova ou corrija o cupom antes de confirmar.'); return }
      const body: CreateOrderBody = { ...request, walletId, collector, acceptedQuote: fresh }
      await send({ key: crypto.randomUUID(), body })
      setChanges([])
    } catch (failure) {
      if (!active.current) return
      const problem = orderError(failure)
      setError(problem.message); setFields(problem.fields)
      if (problem.code && !['session_expired', 'unavailable'].includes(problem.code)) remember(null)
      if (problem.quote) { setReview({ request: JSON.stringify(request), quote: problem.quote }); setChanges(['Cotação atualizada']) }
    } finally { busyRef.current = false; if (active.current) setBusy(false) }
  }
  const recover = async () => {
    if (!attempt || busyRef.current) return
    busyRef.current = true; setBusy(true); setError('')
    try { await send(attempt) } catch (failure) { if (active.current) setError(orderError(failure).message) }
    finally { busyRef.current = false; if (active.current) setBusy(false) }
  }
  const retryRejected = () => { remember(null); setReview(null); setError(''); setChanges([]) }
  return { collector, updateCollector, fields, error, busy, changes, review, attempt, order, execute, recover, retryRejected }
}
