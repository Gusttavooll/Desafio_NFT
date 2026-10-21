import type { DomainEventResource } from '@/domain/shared'
import { createVersionRegistry } from './events'
import { createInitialState } from './fixtures'
import { isScenarioName, resolveScenario, type ScenarioConfig, type ScenarioName, SCENARIOS } from './scenario'
import type { PersistedSimulation, SimState } from './state'

// A chave carrega a versão da estrutura: ao mudar o formato do estado, suba o número e o dado antigo é descartado.
export const SIMULATION_STORAGE_KEY = 'nft-simulation:v1'

export interface SimulationStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export interface Simulation {
  state: () => SimState
  scenario: () => ScenarioName
  scenarioConfig: () => ScenarioConfig
  setScenario: (name: ScenarioName) => void
  // Altera o estado e persiste.
  update: (mutate: (state: SimState) => void) => void
  // Restaura as Fixtures (e encerra Sessões e Pedidos). Mantém o Cenário, salvo se for informado outro.
  reset: (scenario?: ScenarioName) => void
  // Incrementa e devolve a nova Versão do recurso.
  nextVersion: (resource: DomainEventResource, resourceId: string) => number
}

function load(storage: SimulationStorage | null): PersistedSimulation | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(SIMULATION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedSimulation>
    if (!parsed || typeof parsed !== 'object' || !isScenarioName(parsed.scenario)) return null
    const s = parsed.state as Partial<SimState> | undefined
    if (!s || !Array.isArray(s.nfts) || !Array.isArray(s.collectors) || !Array.isArray(s.sessions)) return null
    if (!Array.isArray(s.orders) || !Array.isArray(s.coupons) || !s.versions || !s.carts || !s.wallets) return null
    return { scenario: parsed.scenario, state: s as SimState }
  } catch {
    return null
  }
}

export function createSimulation(options: { storage: SimulationStorage | null; search: string }): Simulation {
  const { storage } = options
  const persisted = load(storage)
  let state: SimState = persisted?.state ?? createInitialState()
  let scenario: ScenarioName = resolveScenario({ search: options.search, persisted: persisted?.scenario ?? null })

  const save = () => {
    if (!storage) return
    try {
      storage.setItem(SIMULATION_STORAGE_KEY, JSON.stringify({ scenario, state } satisfies PersistedSimulation))
    } catch {
      // Armazenamento cheio ou bloqueado: a simulação segue só em memória.
    }
  }
  save()

  return {
    state: () => state,
    scenario: () => scenario,
    scenarioConfig: () => SCENARIOS[scenario],
    setScenario(name) {
      scenario = name
      save()
    },
    update(mutate) {
      mutate(state)
      save()
    },
    reset(next) {
      const previous = state.versions
      state = createInitialState()
      // Versões nunca regridem: o cliente que já aplicou a Versão N ignoraria um evento com versão menor.
      for (const [key, version] of Object.entries(previous)) {
        state.versions[key] = Math.max(version, state.versions[key] ?? 0)
      }
      if (next) scenario = next
      save()
    },
    nextVersion(resource, resourceId) {
      const registry = createVersionRegistry(state.versions)
      const version = registry.next(resource, resourceId)
      state.versions = registry.snapshot()
      save()
      return version
    },
  }
}

let instance: Simulation | undefined

// Instância única da página, ligada ao localStorage e à URL atual.
export function getSimulation(): Simulation {
  instance ??= createSimulation({
    storage: typeof localStorage === 'undefined' ? null : localStorage,
    search: typeof location === 'undefined' ? '' : location.search,
  })
  return instance
}
