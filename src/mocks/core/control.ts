import { emitDomainEvent, type EmitInput } from './emit'
import { isScenarioName, type ScenarioName } from './scenario'
import type { Simulation } from './simulation'

export interface MockControlSummary {
  scenario: ScenarioName
  nfts: number
  collectors: number
  sessions: number
  orders: Array<{ id: string; status: string; collectorId: string }>
  versions: Record<string, number>
}

// Seam de teste: o Playwright executa estas operações dentro da página (`page.evaluate`), nunca via HTTP.
export interface MockControl {
  setScenario: (name: string) => void
  reset: (scenario?: string) => void
  emit: (input: EmitInput<unknown>) => void
  summary: () => MockControlSummary
}

function toScenario(name: string): ScenarioName {
  if (!isScenarioName(name)) throw new Error(`Cenário desconhecido: "${name}"`)
  return name
}

// Só deve ser chamado quando a simulação está ativa, para o controle nunca vazar para um build sem mocks.
export function installMockControl(sim: Simulation, target: { __mocks?: MockControl } = globalThis as { __mocks?: MockControl }): MockControl {
  const control: MockControl = {
    setScenario: (name) => sim.setScenario(toScenario(name)),
    reset: (scenario) => sim.reset(scenario === undefined ? undefined : toScenario(scenario)),
    emit: (input) => {
      if (input.resource !== 'nft' && input.resource !== 'order') throw new Error(`Recurso desconhecido: "${input.resource}"`)
      if (input.version !== undefined && !(Number.isInteger(input.version) && input.version >= 1)) {
        throw new Error('A Versão deve ser um inteiro maior ou igual a 1')
      }
      emitDomainEvent(sim, input)
    },
    summary: () => ({
      scenario: sim.scenario(),
      nfts: sim.state().nfts.length,
      collectors: sim.state().collectors.length,
      sessions: sim.state().sessions.length,
      orders: sim.state().orders.map((o) => ({ id: o.dto.id, status: o.dto.status, collectorId: o.collectorId })),
      versions: { ...sim.state().versions },
    }),
  }
  target.__mocks = control
  return control
}
