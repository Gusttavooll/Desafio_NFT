import type { DomainEvent } from '@/domain/shared'
import type { OrderDto } from '@/infrastructure/orders'

// Payloads dos eventos Socket.IO. O envelope é o `DomainEvent` do shared kernel.

export interface NftUpdatedPayload {
  price: string
  oldPrice?: string
  editions: Array<{ id: string; available: number }>
}

export type OrderUpdatedPayload = Pick<OrderDto, 'status' | 'receipt'>

export type NftUpdatedEvent = DomainEvent<NftUpdatedPayload>
export type OrderUpdatedEvent = DomainEvent<OrderUpdatedPayload>
