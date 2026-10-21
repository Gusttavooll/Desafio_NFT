import { createHmac, timingSafeEqual } from 'node:crypto'

// Server-only adapter. Never import this file in Vite or pass browser prices here.
// The caller must authenticate, load/revalidate the Order and persist the Session.
export async function createCheckout(order, { secretKey, origin }, transport = fetch) {
  if (!secretKey?.startsWith('sk_test_')) throw new Error('Stripe test key required')
  if (!order.id || !order.collectorId || order.status !== 'pending') throw new Error('Pending authenticated Order required')
  if (!Number.isSafeInteger(order.revision) || order.revision < 1) throw new Error('Immutable Order revision required')
  if (!Number.isSafeInteger(order.amountMinor) || order.amountMinor <= 0) throw new Error('Positive integer fiat amount required')
  if (!['brl', 'usd', 'eur'].includes(order.currency)) throw new Error('Supported fiat currency required; never convert ETH implicitly')
  const base = new URL(origin)
  if (base.username || base.password || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) throw new Error('Trusted HTTPS origin required')
  const form = new URLSearchParams({
    mode: 'payment',
    'payment_method_types[0]': 'card',
    'line_items[0][price_data][currency]': order.currency,
    'line_items[0][price_data][unit_amount]': String(order.amountMinor),
    'line_items[0][price_data][product_data][name]': order.description || 'Pedido KRONOS',
    'line_items[0][quantity]': '1',
    client_reference_id: order.id,
    'metadata[order_id]': order.id,
    'metadata[revision]': String(order.revision),
    success_url: `${base.origin}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base.origin}/checkout`,
  })
  const response = await transport('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `kronos:${order.id}:${order.revision}`,
    },
    body: form.toString(),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Stripe unavailable (${response.status})`)
  const session = await response.json()
  if (session.livemode !== false || !session.id?.startsWith('cs_test_') || !session.url) throw new Error('Invalid test Checkout Session')
  const checkoutUrl = new URL(session.url)
  if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'checkout.stripe.com') throw new Error('Invalid Checkout URL')
  return { id: session.id, url: session.url }
}

// Pass the ORIGINAL request bytes, before JSON parsing. Timestamp tolerance = 5 min.
export function verifyEvent(rawBody, signature, secret, now = Math.floor(Date.now() / 1000)) {
  if (!Buffer.isBuffer(rawBody) || !secret?.startsWith('whsec_') || typeof signature !== 'string') throw new Error('Invalid webhook input')
  const fields = signature.split(',').map(field => field.trim().split('='))
  const timestamp = fields.find(([key]) => key === 't')?.[1]
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(now - Number(timestamp)) > 300) throw new Error('Expired webhook signature')
  const digest = createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest()
  const valid = fields.some(([key, value]) => key === 'v1' && /^[a-f0-9]{64}$/i.test(value || '') && timingSafeEqual(digest, Buffer.from(value, 'hex')))
  if (!valid) throw new Error('Invalid webhook signature')
  const event = JSON.parse(rawBody.toString('utf8'))
  if (!event.id || event.livemode !== false || !event.data?.object) throw new Error('Invalid test webhook event')
  return event
}

// Pure decision, not persistence. Apply inside one DB transaction with event-id
// deduplication, compare-and-set status and inventory/receipt writes (see README).
export function paymentDecision(event, order) {
  const supported = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired']
  if (!supported.includes(event.type)) return null
  const session = event.data.object
  if (event.livemode !== false || session.id !== order.stripeSessionId || session.metadata?.order_id !== order.id || session.amount_total !== order.amountMinor || session.currency !== order.currency) throw new Error('Payment does not match Order')
  if (order.status !== 'pending') return null
  if (['checkout.session.async_payment_failed', 'checkout.session.expired'].includes(event.type)) return 'rejected'
  return session.payment_status === 'paid' ? 'confirmed' : null
}
