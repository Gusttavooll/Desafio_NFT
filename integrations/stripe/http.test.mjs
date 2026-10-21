import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { createPaymentHandler } from './http.mjs'

function setup(overrides = {}, repositoryOverrides = {}) {
  const order = { id: 'o1', collectorId: 'u1', status: 'pending', revision: 1, amountMinor: 1000, currency: 'brl', stripeSessionId: 'cs_test_1' }
  const calls = []
  const handler = createPaymentHandler({
    origin: 'https://kronos.example', webhookSecret: 'whsec_fixture',
    authenticate: async () => ({ id: 'u1' }),
    repository: {
      getOwnedOrder: async (id, owner) => id === order.id && owner === order.collectorId ? order : null,
      prepareCheckout: async () => order,
      saveCheckout: async (...args) => calls.push(args),
      applyEvent: async (event, decide) => { calls.push(event.id); return decide(order) },
      ...repositoryOverrides,
    },
    checkout: async () => ({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' }),
    ...overrides,
  })
  const request = (path, body, headers = {}) => new Request(`https://kronos.example${path}`, body === undefined ? {} : { method: 'POST', headers: { origin: 'https://kronos.example', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
  return { handler, request, calls }
}

test('checkout saves session before returning and ignores client prices by rejecting extra fields', async () => {
  const { handler, request, calls } = setup()
  assert.equal((await handler(request('/payments/checkout', { orderId: 'o1', amountMinor: 1 }))).status, 400)
  const result = await handler(request('/payments/checkout', { orderId: 'o1' }))
  assert.equal(result.status, 200)
  assert.equal(calls.length, 1)
  assert.equal((await result.json()).id, 'cs_test_1')
})

test('requires authentication, trusted origin and ownership', async () => {
  const { handler, request } = setup()
  assert.equal((await handler(request('/payments/checkout', { orderId: 'o1' }, { origin: 'https://evil.example' }))).status, 403)
  assert.equal((await handler(request('/payments/checkout', { orderId: 'other' }))).status, 404)
  assert.equal((await handler(request('/payments/orders/other'))).status, 404)
  const guest = setup({ authenticate: async () => null })
  assert.equal((await guest.handler(request('/payments/orders/o1'))).status, 401)
})

test('status is private, pending remains pending, and internal identity is not returned', async () => {
  const { handler, request } = setup()
  const response = await handler(request('/payments/orders/o1'))
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { id: 'o1', status: 'pending', amountMinor: 1000, currency: 'brl' })
})

test('signed webhook applies through repository transaction and invalid signatures never write', async () => {
  const { handler, calls } = setup()
  const body = JSON.stringify({ id: 'evt_1', livemode: false, type: 'checkout.session.completed', data: { object: { id: 'cs_test_1', metadata: { order_id: 'o1' }, amount_total: 1000, currency: 'brl', payment_status: 'paid' } } })
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = `t=${timestamp},v1=${createHmac('sha256', 'whsec_fixture').update(`${timestamp}.${body}`).digest('hex')}`
  const request = (sig) => new Request('https://kronos.example/payments/webhook', { method: 'POST', headers: { 'stripe-signature': sig }, body })
  assert.equal((await handler(request('invalid'))).status, 400)
  assert.equal(calls.length, 0)
  assert.equal((await handler(request(signature))).status, 200)
  assert.deepEqual(calls, ['evt_1'])
})

test('persistence failures do not acknowledge success or expose internal errors', async () => {
  const { handler, request } = setup({}, { saveCheckout: async () => { throw new Error('private-provider-details') } })
  const response = await handler(request('/payments/checkout', { orderId: 'o1' }))
  assert.equal(response.status, 503)
  assert.equal((await response.text()).includes('private-provider-details'), false)
})

test('webhook database failure requests retry instead of acknowledging the event', async () => {
  const { handler } = setup({}, { applyEvent: async () => { throw new Error('database unavailable') } })
  const body = JSON.stringify({ id: 'evt_retry', livemode: false, type: 'checkout.session.completed', data: { object: { id: 'cs_test_1' } } })
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = `t=${timestamp},v1=${createHmac('sha256', 'whsec_fixture').update(`${timestamp}.${body}`).digest('hex')}`
  const response = await handler(new Request('https://kronos.example/payments/webhook', { method: 'POST', headers: { 'stripe-signature': signature }, body }))
  assert.equal(response.status, 503)
  assert.equal((await response.text()).includes('database'), false)
})

test('rejects malformed and oversized bodies', async () => {
  const { handler, request } = setup()
  assert.equal((await handler(request('/payments/checkout', { orderId: 'x'.repeat(70000) }))).status, 413)
  assert.equal((await handler(new Request('https://kronos.example/payments/checkout', { method: 'POST', headers: { origin: 'https://kronos.example', 'content-type': 'application/json' }, body: '{' }))).status, 400)
})
