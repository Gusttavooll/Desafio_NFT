import { paymentDecision } from './checkout.mjs'

// Server-to-Stripe verification also recovers payment when the browser returned
// before the webhook. Query-string values never determine the outcome.
export async function reconcileOrder(order, repository, secretKey, transport = fetch) {
  if (!order || order.status !== 'pending' || !order.stripeSessionId) return
  if (!secretKey?.startsWith('sk_test_') || !/^cs_test_[a-zA-Z0-9]+$/.test(order.stripeSessionId)) throw new Error('Test configuration required')
  const response = await transport(`https://api.stripe.com/v1/checkout/sessions/${order.stripeSessionId}`, {
    headers: { Authorization: `Bearer ${secretKey}` }, signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error('Stripe verification unavailable')
  const session = await response.json()
  if (session.livemode !== false || session.id !== order.stripeSessionId || session.client_reference_id !== order.id || session.metadata?.revision !== String(order.revision)) throw new Error('Session mismatch')
  if (session.payment_status !== 'paid' && session.status !== 'expired') return
  const event = {
    id: `reconcile:${session.id}:${session.payment_status}:${session.status}`,
    type: session.payment_status === 'paid' ? 'checkout.session.completed' : 'checkout.session.expired',
    livemode: false, data: { object: session },
  }
  repository.applyEvent(event, saved => paymentDecision(event, saved))
}
