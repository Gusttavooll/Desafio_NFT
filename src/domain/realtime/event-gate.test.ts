import { expect, it } from 'vitest'
import type { DomainEvent } from '@/domain/shared'
import { createEventGate } from './event-gate'

const event = (id: string, version: number): DomainEvent<unknown> => ({ id, resource: 'nft', resourceId: 'n1', version, occurredAt: new Date(0).toISOString(), payload: {} })
it('descarta duplicatas e versões antigas e aceita recursos independentes', () => {
  const gate = createEventGate()
  expect(gate.accept(event('a', 3))).toBe(true)
  expect(gate.accept(event('a', 4))).toBe(false)
  expect(gate.accept(event('b', 2))).toBe(false)
  expect(gate.accept(event('c', 3))).toBe(false)
  expect(gate.accept(event('d', 4))).toBe(true)
  expect(gate.accept({ ...event('e', 1), resourceId: 'n2' })).toBe(true)
})
it('rejeita envelopes malformados antes de invocar um contexto', () => {
  const gate = createEventGate()
  expect(gate.accept(null)).toBe(false)
  expect(gate.accept({ ...event('x', 1), version: NaN })).toBe(false)
  expect(gate.accept({ ...event('x', 1), resource: 'user' })).toBe(false)
})
