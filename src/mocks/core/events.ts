import type { DomainEvent, DomainEventResource } from '@/domain/shared'

export interface VersionRegistry {
  // Incrementa e devolve a nova Versão do recurso.
  next: (resource: DomainEventResource, resourceId: string) => number
  // Versão atual; 0 quando o recurso ainda não teve eventos.
  current: (resource: DomainEventResource, resourceId: string) => number
  snapshot: () => Record<string, number>
}

// Versão crescente por recurso; a REST devolve a mesma Versão dos eventos.
export function createVersionRegistry(initial: Record<string, number> = {}): VersionRegistry {
  const versions = new Map<string, number>(Object.entries(initial))
  const key = (resource: DomainEventResource, resourceId: string) => `${resource}:${resourceId}`
  return {
    next(resource, resourceId) {
      const next = (versions.get(key(resource, resourceId)) ?? 0) + 1
      versions.set(key(resource, resourceId), next)
      return next
    },
    current: (resource, resourceId) => versions.get(key(resource, resourceId)) ?? 0,
    snapshot: () => Object.fromEntries(versions),
  }
}

export interface BuildDomainEventInput<TPayload> {
  resource: DomainEventResource
  resourceId: string
  version: number
  payload: TPayload
  now?: Date
  id?: string
}

// Envelope `{ id, resource, resourceId, version, occurredAt, payload }` com id único.
export function buildDomainEvent<TPayload>(input: BuildDomainEventInput<TPayload>): DomainEvent<TPayload> {
  return {
    id: input.id ?? crypto.randomUUID(),
    resource: input.resource,
    resourceId: input.resourceId,
    version: input.version,
    occurredAt: (input.now ?? new Date()).toISOString(),
    payload: input.payload,
  }
}
