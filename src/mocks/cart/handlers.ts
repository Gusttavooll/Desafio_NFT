import { http, HttpResponse, delay } from 'msw'
import { getSimulation, requireSession, withScenarioLatency, forcedResponseFor, respondForced, respondWithError } from '@/mocks/core'
import type { QuoteRequest } from '@/infrastructure/cart'
import { buildQuote, CartError, changeCart, mergeGuestCart, readCart } from './cart-service'

let sequence = 0
async function handle(request: Request, action: 'get' | 'add' | 'update' | 'remove' | 'merge' | 'quote', id?: string) {
  const sim = getSimulation()
  const route = action === 'quote' ? 'POST /quotes' : `${request.method} /cart${action === 'get' ? '' : action === 'merge' ? '/merge' : action === 'add' ? '/items' : '/items/:id'}`
  const order = ++sequence
  await withScenarioLatency(sim, route)
  if (action === 'quote' && sim.scenarioConfig().outOfOrder && order % 2) await delay(700)
  if (sim.scenarioConfig().networkError) return HttpResponse.error()
  const forced = forcedResponseFor(sim.scenarioConfig(), route)
  if (forced) return respondForced(forced)
  let owner = 'guest'
  if (request.headers.has('Authorization')) {
    const session = requireSession(sim, request)
    if (!session.ok) return session.response
    owner = session.collector.id
  }
  try {
    if (action === 'get') return HttpResponse.json(readCart(sim, owner))
    if (action === 'merge') return HttpResponse.json(mergeGuestCart(sim, owner))
    if (action === 'remove') return HttpResponse.json(changeCart(sim, owner, action, { id }))
    const body = await request.json()
    if (!body || typeof body !== 'object') return respondWithError(422, 'validation_error', 'Dados inválidos.')
    if (action === 'quote') return HttpResponse.json(buildQuote(sim, body as QuoteRequest))
    return HttpResponse.json(changeCart(sim, owner, action, { ...body, id }))
  } catch (error) {
    if (error instanceof CartError) return respondWithError(error.status, error.code, error.message, error.details)
    return respondWithError(422, 'validation_error', 'Dados inválidos.')
  }
}
export const cartHandlers = [
  http.get('/api/cart', ({ request }) => handle(request, 'get')),
  http.post('/api/cart/items', ({ request }) => handle(request, 'add')),
  http.patch('/api/cart/items/:id', ({ request, params }) => handle(request, 'update', String(params.id))),
  http.delete('/api/cart/items/:id', ({ request, params }) => handle(request, 'remove', String(params.id))),
  http.post('/api/cart/merge', ({ request }) => handle(request, 'merge')),
  http.post('/api/quotes', ({ request }) => handle(request, 'quote')),
]
