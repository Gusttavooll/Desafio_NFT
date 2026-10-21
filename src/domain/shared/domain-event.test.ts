import { describe, expect, it } from 'vitest'
import { isDomainEventApplicable, type DomainEvent } from './domain-event'

function event(overrides: Partial<DomainEvent<unknown>> = {}): DomainEvent<unknown> {
  return {
    id: 'evt-1',
    resource: 'nft',
    resourceId: 'nft-1',
    version: 2,
    occurredAt: '2026-10-21T12:00:00.000Z',
    payload: {},
    ...overrides,
  }
}

describe('isDomainEventApplicable', () => {
  it('aplica evento novo de recurso ainda sem versão conhecida', () => {
    expect(isDomainEventApplicable(event(), { seenEventIds: new Set(), currentVersion: undefined })).toBe(true)
  })

  it('aplica evento com versão maior que a atual', () => {
    expect(isDomainEventApplicable(event({ version: 3 }), { seenEventIds: new Set(), currentVersion: 2 })).toBe(true)
  })

  it('ignora evento duplicado (id já visto)', () => {
    expect(
      isDomainEventApplicable(event({ version: 3 }), { seenEventIds: new Set(['evt-1']), currentVersion: 2 }),
    ).toBe(false)
  })

  it('ignora evento com versão igual à atual', () => {
    expect(isDomainEventApplicable(event({ version: 2 }), { seenEventIds: new Set(), currentVersion: 2 })).toBe(false)
  })

  it('ignora evento antigo (versão menor que a atual)', () => {
    expect(isDomainEventApplicable(event({ version: 1 }), { seenEventIds: new Set(), currentVersion: 2 })).toBe(false)
  })
})
