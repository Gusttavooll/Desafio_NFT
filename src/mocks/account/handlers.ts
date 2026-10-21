import { http, HttpResponse, type RequestHandler, type WebSocketHandler } from 'msw'
import type { ApiError } from '@/domain/shared'
import { stubSessions } from './session-stub'

const sessionExpired: ApiError = { code: 'session_expired', message: 'Sua sessão expirou. Entre novamente.' }

// Handlers do contexto Conta e Sessão.
export const accountHandlers: Array<RequestHandler | WebSocketHandler> = [
  http.get('/api/auth/session', ({ request }) => {
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
    const session = stubSessions[token]
    if (!session) return HttpResponse.json(sessionExpired, { status: 401 })
    return HttpResponse.json(session)
  }),
]
