import { delay, HttpResponse } from 'msw'
import type { ApiError, ApiErrorCode } from '@/domain/shared'
import type { ForcedResponse, ScenarioConfig } from './scenario'
import type { Simulation } from './simulation'
import type { StoredCollector } from './state'

// Helpers para handlers de qualquer contexto: todos se comportam igual sob o mesmo Cenário.

// Envelope único de erro `{ code, message, details? }`.
export function respondWithError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  const body: ApiError = { code, message, ...(details ? { details } : {}) }
  return HttpResponse.json(body, { status })
}

function routeHash(route: string): number {
  let h = 0
  for (const ch of route) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

// Latência do Cenário; a variação é determinística por rota, sem aleatoriedade.
export function latencyFor(config: ScenarioConfig, route: string): number {
  const { baseMs, jitterMs } = config.latency
  return baseMs + (jitterMs > 0 ? routeHash(route) % (jitterMs + 1) : 0)
}

export function withScenarioLatency(sim: Simulation, route: string): Promise<void> {
  return delay(latencyFor(sim.scenarioConfig(), route))
}

// Resposta forçada pela chave `MÉTODO /rota` ou pela global `*`.
export function forcedResponseFor(config: ScenarioConfig, route: string): ForcedResponse | undefined {
  // A global `*` não afeta login e cadastro, para a Sessão poder ser retomada.
  return config.forced[route] ?? (route.includes(' /auth/') ? undefined : config.forced['*'])
}

export function respondForced(forced: ForcedResponse) {
  return respondWithError(forced.status, forced.code as ApiErrorCode, forced.message)
}

export type SessionResult = { ok: true; collector: StoredCollector } | { ok: false; response: Response }

// Resolve o Colecionador pelo token `Authorization: Bearer`, ou responde `session_expired`.
export function requireSession(sim: Simulation, request: Request): SessionResult {
  const expired = () => ({
    ok: false as const,
    response: respondWithError(401, 'session_expired', 'Sua sessão expirou. Entre novamente.'),
  })
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return expired()
  const session = sim.state().sessions.find((s) => s.token === token)
  if (!session || !(Date.parse(session.expiresAt) > Date.now())) return expired()
  const collector = sim.state().collectors.find((c) => c.id === session.collectorId)
  return collector ? { ok: true, collector } : expired()
}
