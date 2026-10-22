import { delay, http, HttpResponse } from 'msw'
import { getSimulation, withScenarioLatency } from '@/mocks/core'
import { createOrderResponse, getOrderResponse, settleOrder } from './orders-response'

export const ordersHandlers = [
  http.post('/api/orders', async ({ request }) => {
    const sim = getSimulation()
    await withScenarioLatency(sim, 'POST /orders')
    const response = await createOrderResponse(sim, request)
    if (response.status === 201) {
      const body = await response.clone().json() as { id: string }
      setTimeout(() => settleOrder(sim, body.id), sim.scenarioConfig().order.settleDelayMs)
      if (sim.scenarioConfig().order.dropCreateResponse) { await delay(4600); return HttpResponse.error() }
    }
    return response
  }),
  http.get('/api/orders/:id', async ({ request, params }) => { const sim = getSimulation(); await withScenarioLatency(sim, 'GET /orders/:id'); return getOrderResponse(sim, request, String(params.id)) }),
]
