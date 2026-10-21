import { afterEach, describe, expect, it } from 'vitest'
import type { DomainEvent } from '@/domain/shared'
import { installMockControl, type MockControl } from './control'
import { setEventSink } from './emit'
import { createSimulation } from './simulation'

afterEach(() => setEventSink(null))

function setup() {
  const sim = createSimulation({ storage: null, search: '' })
  const target: { __mocks?: MockControl } = {}
  installMockControl(sim, target)
  return { sim, control: target.__mocks! }
}

describe('controle dos mocks', () => {
  it('troca o Cenário', () => {
    const { sim, control } = setup()
    control.setScenario('payment-rejected')
    expect(sim.scenario()).toBe('payment-rejected')
  })

  it('rejeita nome de Cenário desconhecido', () => {
    const { control } = setup()
    expect(() => control.setScenario('nao-existe')).toThrow(/desconhecido/)
  })

  it('reseta o estado e pode trocar o Cenário no mesmo passo', () => {
    const { sim, control } = setup()
    sim.update((s) => {
      s.favorites['x'] = ['n']
    })
    control.reset('empty')
    expect(sim.state().favorites).toEqual({})
    expect(sim.scenario()).toBe('empty')
  })

  it('dispara um Evento com id e Versão corretos', () => {
    const { control } = setup()
    const events: DomainEvent<unknown>[] = []
    setEventSink((e) => events.push(e))
    control.emit({ resource: 'nft', resourceId: 'emerald-ape-042', payload: { price: '1.000', editions: [] } })
    expect(events[0]).toMatchObject({ resource: 'nft', resourceId: 'emerald-ape-042', version: 2 })
  })

  it('rejeita Evento malformado', () => {
    const { control } = setup()
    expect(() => control.emit({ resource: 'x' as never, resourceId: 'a', payload: {} })).toThrow(/Recurso/)
    expect(() => control.emit({ resource: 'nft', resourceId: 'a', payload: {}, version: -1 })).toThrow(/Versão/)
    expect(() => control.emit({ resource: 'nft', resourceId: 'a', payload: {}, version: 1.5 })).toThrow(/Versão/)
  })

  it('resume o estado para asserções, sem expor hashes de senha', () => {
    const { control } = setup()
    const summary = control.summary()
    expect(summary.scenario).toBe('success')
    expect(summary.nfts).toBeGreaterThanOrEqual(24)
    expect(JSON.stringify(summary)).not.toMatch(/passwordHash|salt/)
  })

  it('só existe depois de instalado (simulação ativa)', () => {
    const target: { __mocks?: MockControl } = {}
    expect(target.__mocks).toBeUndefined()
  })
})
