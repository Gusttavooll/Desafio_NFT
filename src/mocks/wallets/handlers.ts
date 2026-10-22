import { http } from 'msw'
import { getSimulation, withScenarioLatency } from '@/mocks/core'
import { walletsResponse } from './wallets-response'

export const walletsHandlers = [
  http.get('/api/wallets', async ({ request }) => { const sim = getSimulation(); await withScenarioLatency(sim, 'GET /wallets'); return walletsResponse(sim, request) }),
  http.post('/api/wallets', async ({ request }) => { const sim = getSimulation(); await withScenarioLatency(sim, 'POST /wallets'); return walletsResponse(sim, request) }),
  http.patch('/api/wallets/:id', async ({ request, params }) => { const sim = getSimulation(); await withScenarioLatency(sim, 'PATCH /wallets/:id'); return walletsResponse(sim, request, String(params.id)) }),
]
