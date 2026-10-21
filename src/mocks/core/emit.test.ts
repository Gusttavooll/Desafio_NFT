import { afterEach, describe, expect, it } from 'vitest'
import type { DomainEvent } from '@/domain/shared'
import { emitDomainEvent, setEventSink } from './emit'
import { createSimulation } from './simulation'

const received: Array<{ event: DomainEvent<unknown>; collectorId?: string }> = []

function connect() {
  received.length = 0
  setEventSink((event, audience) => received.push({ event, ...audience }))
}

afterEach(() => setEventSink(null))

describe('emitDomainEvent', () => {
  it('incrementa a Versão do recurso e dá um id único a cada Evento', () => {
    connect()
    const sim = createSimulation({ storage: null, search: '' })
    const first = emitDomainEvent(sim, { resource: 'order', resourceId: 'o1', payload: { status: 'pending' } })
    const second = emitDomainEvent(sim, { resource: 'order', resourceId: 'o1', payload: { status: 'confirmed' } })
    expect([first.version, second.version]).toEqual([1, 2])
    expect(first.id).not.toBe(second.id)
    expect(received).toHaveLength(2)
  })

  it('usa a Versão informada sem alterar o estado (simula duplicata e evento antigo)', () => {
    connect()
    const sim = createSimulation({ storage: null, search: '' })
    sim.nextVersion('nft', 'n1')
    const old = emitDomainEvent(sim, { resource: 'nft', resourceId: 'n1', payload: {}, version: 1 })
    expect(old.version).toBe(1)
    expect(sim.state().versions['nft:n1']).toBe(1)
  })

  it('entrega o Evento de um Colecionador só para a audiência dele', () => {
    connect()
    const sim = createSimulation({ storage: null, search: '' })
    emitDomainEvent(sim, { resource: 'order', resourceId: 'o1', payload: {}, collectorId: 'collector-ana' })
    expect(received[0]?.collectorId).toBe('collector-ana')
  })

  it('não falha quando ninguém está conectado', () => {
    const sim = createSimulation({ storage: null, search: '' })
    expect(() => emitDomainEvent(sim, { resource: 'nft', resourceId: 'n1', payload: {} })).not.toThrow()
  })
})
