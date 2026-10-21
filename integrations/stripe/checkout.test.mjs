import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { createCheckout, verifyEvent, paymentDecision } from './checkout.mjs'

const order = { id: 'order-1', collectorId: 'collector-1', revision: 1, amountMinor: 12900, currency: 'brl', description: 'Edição de teste', status: 'pending' }
const config = { secretKey: 'sk_test_fixture', origin: 'http://localhost:5173' }
test('creates hosted checkout using the authoritative amount and a stable idempotency key', async () => {
  const calls = []
  const transport = async (url, options) => { calls.push({ url, options }); return new Response(JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1', livemode: false })) }
  const result = await createCheckout(order, config, transport)
  await createCheckout(order, config, transport)
  assert.equal(result.id, 'cs_test_1')
  assert.equal(calls[0].options.headers['Idempotency-Key'], calls[1].options.headers['Idempotency-Key'])
  const form = new URLSearchParams(calls[0].options.body)
  assert.equal(form.get('line_items[0][price_data][unit_amount]'), '12900')
  assert.equal(form.get('metadata[order_id]'), order.id)
  assert.equal(form.get('success_url'), 'http://localhost:5173/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}')
})
test('refuses live keys, fractional amounts, ETH and terminal orders before calling Stripe', async () => {
  const transport = () => { throw Error('network must not be called') }
  await assert.rejects(createCheckout(order, { ...config, secretKey: 'sk_live_fixture' }, transport), /test/)
  for (const change of [{ amountMinor: 1.1 }, { amountMinor: 0 }, { amountMinor: Number.MAX_SAFE_INTEGER + 1 }, { currency: 'eth' }, { status: 'confirmed' }, { revision: 0 }]) {
    await assert.rejects(createCheckout({ ...order, ...change }, config, transport))
  }
})
test('does not expose Stripe response bodies on provider errors', async () => {
  await assert.rejects(createCheckout(order, config, async () => new Response('sensitive-provider-details', { status: 401 })), /^Error: Stripe unavailable \(401\)$/)
})
const secret = 'whsec_fixture'
const raw = JSON.stringify({ id: 'evt_1', livemode: false, type: 'checkout.session.completed', data: { object: { id: 'cs_test_1', metadata: { order_id: 'order-1' }, payment_status: 'paid', amount_total: 12900, currency: 'brl' } } })
function signature(body = raw, timestamp = 1000) { return `t=${timestamp},v1=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}` }
test('verifies raw bytes, rejects tampering, missing/expired/future signatures and live events', () => {
  assert.equal(verifyEvent(Buffer.from(raw), signature(), secret, 1000).id, 'evt_1')
  assert.throws(() => verifyEvent(Buffer.from(raw + ' '), signature(), secret, 1000))
  assert.throws(() => verifyEvent(Buffer.from(raw), '', secret, 1000))
  assert.throws(() => verifyEvent(Buffer.from(raw), signature(), secret, 1301))
  assert.throws(() => verifyEvent(Buffer.from(raw), signature(), secret, 699))
  const live = raw.replace('"livemode":false', '"livemode":true')
  assert.throws(() => verifyEvent(Buffer.from(live), signature(live), secret, 1000))
})
test('only a paid matching session can confirm; URL return and unpaid events are insufficient', () => {
  const event = JSON.parse(raw)
  const saved = { ...order, stripeSessionId: 'cs_test_1' }
  assert.equal(paymentDecision(event, saved), 'confirmed')
  assert.equal(paymentDecision({ ...event, type: 'unknown' }, saved), null)
  assert.equal(paymentDecision({ ...event, data: { object: { ...event.data.object, payment_status: 'unpaid' } } }, saved), null)
  for (const change of [{ amountMinor: 12800 }, { currency: 'usd' }, { stripeSessionId: 'cs_test_other' }, { id: 'other-order' }]) assert.throws(() => paymentDecision(event, { ...saved, ...change }))
})
test('terminal states never regress when duplicate or delayed events arrive', () => {
  const event = JSON.parse(raw)
  assert.equal(paymentDecision(event, { ...order, stripeSessionId: 'cs_test_1', status: 'confirmed' }), null)
  assert.equal(paymentDecision({ ...event, type: 'checkout.session.async_payment_failed' }, { ...order, stripeSessionId: 'cs_test_1', status: 'confirmed' }), null)
})
