import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import type { Order } from '@/domain/orders'
import { applyOrderUpdate, orderQueryKeys } from './use-checkout'

const pending: Order = { id: 'order-a', status: 'pending', version: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01', receipt: null }
describe('Reconciliação de Pedidos', () => {
  it('ignora eventos antigos e não regride um pedido terminal', () => {
    const client = new QueryClient()
    const key = orderQueryKeys.detail('ana', pending.id)
    client.setQueryData(key, pending)
    applyOrderUpdate(client, 'ana', { id: 'older', resource: 'order', resourceId: pending.id, version: 1, occurredAt: '', payload: { ...pending, status: 'rejected' } })
    expect(client.getQueryData<Order>(key)?.status).toBe('pending')
    applyOrderUpdate(client, 'ana', { id: 'rejected', resource: 'order', resourceId: pending.id, version: 2, occurredAt: '', payload: { ...pending, status: 'rejected' } })
    expect(client.getQueryData<Order>(key)?.status).toBe('rejected')
    applyOrderUpdate(client, 'ana', { id: 'late', resource: 'order', resourceId: pending.id, version: 3, occurredAt: '', payload: pending })
    expect(client.getQueryData<Order>(key)?.status).toBe('rejected')
    client.clear()
  })
  it('não introduz pedidos de outra sessão em um cache sem esse recurso', () => {
    const client = new QueryClient()
    const event = { id: 'event', resource: 'order' as const, resourceId: pending.id, version: 2, occurredAt: '', payload: { ...pending, status: 'rejected' } }
    applyOrderUpdate(client, 'bruno', event)
    expect(client.getQueryData(orderQueryKeys.detail('bruno', pending.id))).toBeUndefined()
    applyOrderUpdate(client, null, event)
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })
  it('aceita o payload canônico parcial status e receipt, preservando identidade e data de criação', () => {
    const client = new QueryClient()
    const key = orderQueryKeys.detail('ana', pending.id)
    client.setQueryData(key, pending)
    applyOrderUpdate(client, 'ana', { id: 'canonical', resource: 'order', resourceId: pending.id, version: 2, occurredAt: '2026-02-01', payload: { status: 'rejected', receipt: null } })
    expect(client.getQueryData<Order>(key)).toMatchObject({ id: pending.id, status: 'rejected', version: 2, createdAt: pending.createdAt, updatedAt: '2026-02-01', receipt: null })
    client.clear()
  })
})
