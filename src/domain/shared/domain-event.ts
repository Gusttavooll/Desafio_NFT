export type DomainEventResource = 'nft' | 'order'

// Envelope dos eventos Socket.IO (`nft.updated`, `order.updated`).
export interface DomainEvent<TPayload> {
  id: string
  resource: DomainEventResource
  resourceId: string
  version: number
  occurredAt: string
  payload: TPayload
}

export interface DomainEventState {
  seenEventIds: ReadonlySet<string>
  // Versão atual do recurso afetado; `undefined` quando ainda não conhecida.
  currentVersion: number | undefined
}

// Duplicatas e eventos com versão menor ou igual à atual são ignorados.
export function isDomainEventApplicable(event: DomainEvent<unknown>, state: DomainEventState): boolean {
  if (state.seenEventIds.has(event.id)) return false
  return state.currentVersion === undefined || event.version > state.currentVersion
}
