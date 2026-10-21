import { HttpResponse } from 'msw'
import type { SessionDto } from '@/infrastructure/account'
import { requireSession, respondForced, respondWithError, type Simulation } from '@/mocks/core'

export function sessionResponse(sim: Simulation, request: Request): Response {
  const config = sim.scenarioConfig()
  if (config.networkError) return HttpResponse.error()
  const forced = config.forced['GET /auth/session'] ?? config.forced['*']
  if (forced) return respondForced(forced)

  const result = requireSession(sim, request)
  if (!result.ok) return result.response
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const session = sim.state().sessions.find((entry) => entry.token === token)
  if (!session) return respondWithError(401, 'session_expired', 'Sua sessão expirou. Entre novamente.')

  // Lista explícita: o estado também contém salt/hash, que nunca fazem parte da resposta REST.
  const { id, displayName, username, email, ensName, avatarUrl } = result.collector
  return HttpResponse.json({
    token: session.token,
    expiresAt: session.expiresAt,
    collector: { id, displayName, username, email, ensName, avatarUrl: avatarUrl ?? null },
  } satisfies SessionDto)
}
