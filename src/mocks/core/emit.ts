import type { DomainEvent, DomainEventResource } from '@/domain/shared'
import { buildDomainEvent } from './events'
import type { Simulation } from './simulation'

export interface EventAudience {
  // Eventos de um Colecionador só vão para a conexão autenticada com a Sessão dele.
  collectorId?: string
}

export type EventSink = (event: DomainEvent<unknown>, audience: EventAudience) => void

let sink: EventSink | null = null

// O contexto Tempo real liga o emissor ao socket simulado; o núcleo não conhece o transporte.
export function setEventSink(next: EventSink | null): void {
  sink = next
}

export interface EmitInput<TPayload> {
  resource: DomainEventResource
  resourceId: string
  payload: TPayload
  collectorId?: string
  // Versão explícita: não altera o estado. Serve para simular duplicata e evento antigo.
  version?: number
}

export function emitDomainEvent<TPayload>(sim: Simulation, input: EmitInput<TPayload>): DomainEvent<TPayload> {
  const version = input.version ?? sim.nextVersion(input.resource, input.resourceId)
  const event = buildDomainEvent({
    resource: input.resource,
    resourceId: input.resourceId,
    version,
    payload: input.payload,
  })
  sink?.(event, input.collectorId ? { collectorId: input.collectorId } : {})
  return event
}
