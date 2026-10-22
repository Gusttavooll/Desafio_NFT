import { http, type RequestHandler, type WebSocketHandler } from 'msw'
import { getSimulation, withScenarioLatency } from '@/mocks/core'
import { accountResponse } from './account-response'

// Handlers do contexto Conta e Sessão.
const respond = async ({ request }: { request: Request }) => {
  const sim = getSimulation()
  await withScenarioLatency(sim, `${request.method} ${new URL(request.url).pathname.replace(/^\/api/, '')}`)
  return accountResponse(sim, request)
}
export const accountHandlers: Array<RequestHandler | WebSocketHandler> = [
  http.get('/api/auth/session', respond), http.post('/api/auth/login', respond), http.post('/api/auth/register', respond), http.post('/api/auth/logout', respond),
  http.get('/api/me', respond), http.patch('/api/me', respond), http.put('/api/me/avatar', respond), http.post('/api/me/password', respond),
]
