import { isDomainEventApplicable, type DomainEvent } from '@/domain/shared'

export function createEventGate() {
  const seen = new Set<string>()
  const versions = new Map<string, number>()
  return { accept(value: unknown): value is DomainEvent<unknown> {
    if (!value || typeof value !== 'object') return false
    const event = value as DomainEvent<unknown>
    if (!event.id || typeof event.id !== 'string' || !event.resourceId || typeof event.resourceId !== 'string' || !['nft', 'order'].includes(event.resource) || !Number.isSafeInteger(event.version) || event.version < 1) return false
    const key = `${event.resource}:${event.resourceId}`
    if (!isDomainEventApplicable(event, { seenEventIds: seen, currentVersion: versions.get(key) })) return false
    seen.add(event.id)
    versions.set(key, event.version)
    if (seen.size > 2000) seen.delete(seen.values().next().value!)
    return true
  } }
}
