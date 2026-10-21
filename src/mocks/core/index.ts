// Estado simulado compartilhado (db), cenários e reset. Mudanças aqui exigem revisão de mais de um dev.
export { installMockControl, type MockControl, type MockControlSummary } from './control'
export { emitDomainEvent, setEventSink, type EmitInput, type EventAudience, type EventSink } from './emit'
export { buildDomainEvent, createVersionRegistry } from './events'
export { contentFingerprint } from './fingerprint'
export { COLLECTOR_CREDENTIALS, COUPON_EXPIRED, COUPON_VALID, createInitialState } from './fixtures'
export {
  forcedResponseFor,
  latencyFor,
  requireSession,
  respondForced,
  respondWithError,
  withScenarioLatency,
  type SessionResult,
} from './helpers'
export { generateSalt, generateToken, hashPassword, verifyPassword } from './password'
export {
  DEFAULT_SCENARIO,
  isScenarioName,
  resolveScenario,
  SCENARIO_NAMES,
  SCENARIOS,
  type ForcedResponse,
  type OrderBehavior,
  type ScenarioConfig,
  type ScenarioName,
} from './scenario'
export {
  createSimulation,
  getSimulation,
  SIMULATION_STORAGE_KEY,
  type Simulation,
  type SimulationStorage,
} from './simulation'
export type { PersistedSimulation, SimState, StoredCollector, StoredCoupon, StoredOrder, StoredSession } from './state'
