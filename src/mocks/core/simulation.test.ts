import { describe, expect, it } from 'vitest'
import { createSimulation, SIMULATION_STORAGE_KEY, type SimulationStorage } from './simulation'

function memoryStorage(initial: Record<string, string> = {}): SimulationStorage & { data: Record<string, string> } {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
  }
}

describe('simulação: estado, Cenário e persistência', () => {
  it('começa nas Fixtures com o Cenário `success`', () => {
    const sim = createSimulation({ storage: memoryStorage(), search: '' })
    expect(sim.scenario()).toBe('success')
    expect(sim.state().nfts.length).toBeGreaterThanOrEqual(24)
  })

  it('persiste mudanças e as recupera após um novo carregamento (refresh)', () => {
    const storage = memoryStorage()
    const first = createSimulation({ storage, search: '' })
    first.update((s) => {
      s.favorites['collector-ana'] = ['emerald-ape-042']
    })
    const second = createSimulation({ storage, search: '' })
    expect(second.state().favorites['collector-ana']).toEqual(['emerald-ape-042'])
  })

  it('o Cenário da URL vence o persistido e passa a ser o persistido', () => {
    const storage = memoryStorage()
    createSimulation({ storage, search: '?scenario=slow' })
    const reloaded = createSimulation({ storage, search: '' })
    expect(reloaded.scenario()).toBe('slow')
  })

  it('o Cenário atual sobrevive ao refresh até a troca explícita', () => {
    const storage = memoryStorage()
    const first = createSimulation({ storage, search: '' })
    first.setScenario('payment-rejected')
    expect(createSimulation({ storage, search: '' }).scenario()).toBe('payment-rejected')
    first.setScenario('success')
    expect(createSimulation({ storage, search: '' }).scenario()).toBe('success')
  })

  it('o reset restaura as Fixtures, encerra Sessões e apaga Pedidos', () => {
    const sim = createSimulation({ storage: memoryStorage(), search: '' })
    sim.update((s) => {
      s.sessions.push({ token: 't', collectorId: 'collector-ana', expiresAt: '2099-01-01T00:00:00.000Z' })
      s.nfts[0]!.editions[0]!.available = 0
    })
    sim.reset()
    expect(sim.state().sessions).toEqual([])
    expect(sim.state().orders).toEqual([])
    expect(sim.state().nfts[0]!.editions[0]!.available).toBeGreaterThan(0)
  })

  it('o reset não faz as Versões regredirem', () => {
    const sim = createSimulation({ storage: null, search: '' })
    sim.nextVersion('nft', 'emerald-ape-042')
    sim.nextVersion('nft', 'emerald-ape-042')
    sim.reset()
    expect(sim.nextVersion('nft', 'emerald-ape-042')).toBe(4)
  })

  it('ignora estado persistido incompleto', () => {
    const storage = memoryStorage({ [SIMULATION_STORAGE_KEY]: JSON.stringify({ scenario: 'slow', state: { nfts: [] } }) })
    const sim = createSimulation({ storage, search: '' })
    expect(sim.scenario()).toBe('success')
    expect(sim.state().nfts.length).toBeGreaterThanOrEqual(24)
  })

  it('o reset mantém o Cenário atual quando não é pedido outro', () => {
    const sim = createSimulation({ storage: memoryStorage(), search: '' })
    sim.setScenario('empty')
    sim.reset()
    expect(sim.scenario()).toBe('empty')
  })

  it('descarta dado persistido de outra versão da estrutura e recarrega as Fixtures', () => {
    const storage = memoryStorage({
      [SIMULATION_STORAGE_KEY.replace(/v\d+$/, 'v0')]: JSON.stringify({ scenario: 'slow', state: { nfts: [] } }),
    })
    const sim = createSimulation({ storage, search: '' })
    expect(sim.scenario()).toBe('success')
    expect(sim.state().nfts.length).toBeGreaterThanOrEqual(24)
  })

  it('ignora JSON corrompido no armazenamento', () => {
    const storage = memoryStorage({ [SIMULATION_STORAGE_KEY]: '{nao-e-json' })
    const sim = createSimulation({ storage, search: '' })
    expect(sim.state().nfts.length).toBeGreaterThanOrEqual(24)
  })

  it('funciona sem armazenamento (somente memória)', () => {
    const sim = createSimulation({ storage: null, search: '' })
    sim.update((s) => {
      s.favorites['x'] = ['n']
    })
    expect(sim.state().favorites['x']).toEqual(['n'])
  })

  it('incrementa a Versão do recurso e guarda no estado', () => {
    const sim = createSimulation({ storage: memoryStorage(), search: '' })
    expect(sim.nextVersion('nft', 'emerald-ape-042')).toBe(2)
    expect(sim.state().versions['nft:emerald-ape-042']).toBe(2)
  })
})
