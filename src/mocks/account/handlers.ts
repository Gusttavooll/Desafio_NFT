import { http, type RequestHandler, type WebSocketHandler } from 'msw'
import { getSimulation, withScenarioLatency } from '@/mocks/core'
import { sessionResponse } from './session-response'

// Handlers do contexto Conta e Sessão.
export const accountHandlers: Array<RequestHandler | WebSocketHandler> = [
  http.get('/api/auth/session', async ({ request }) => {
    const sim = getSimulation()
    await withScenarioLatency(sim, 'GET /auth/session')
    return sessionResponse(sim, request)
  }),
]
