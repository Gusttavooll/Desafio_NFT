import { createCheckout, paymentDecision, verifyEvent } from './checkout.mjs'

const supported = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'])
const reply = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
class HttpError extends Error {
  constructor(status) { super(); this.status = status }
}
async function readBody(request) {
  const chunks = []
  let size = 0
  if (!request.body) throw new HttpError(400)
  const reader = request.body.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > 65536) { await reader.cancel(); throw new HttpError(413) }
      chunks.push(Buffer.from(value))
    }
  } finally { reader.releaseLock() }
  return Buffer.concat(chunks)
}

// repository must provide transactional event deduplication and order revalidation.
// authenticate must validate a real server session, never an MSW/browser identity.
export function createPaymentHandler({ origin, secretKey, webhookSecret, authenticate, repository, checkout = order => createCheckout(order, { origin, secretKey }) }) {
  const trustedOrigin = new URL(origin).origin
  return async request => {
    try {
      const path = new URL(request.url).pathname
      if (path === '/payments/webhook' && request.method === 'POST') {
        const bytes = await readBody(request)
        let event
        try { event = verifyEvent(bytes, request.headers.get('stripe-signature'), webhookSecret) }
        catch { throw new HttpError(400) }
        if (supported.has(event.type)) {
          // Must throw if session is not yet persisted, so Stripe retries delivery.
          await repository.applyEvent(event, order => paymentDecision(event, order))
        }
        return reply(200, { received: true })
      }
      const isCheckout = path === '/payments/checkout' && request.method === 'POST'
      const match = /^\/payments\/orders\/([a-zA-Z0-9_-]+)$/.exec(path)
      if (!isCheckout && !(match && request.method === 'GET')) return reply(404, { error: 'not_found' })
      if (isCheckout && request.headers.get('origin') !== trustedOrigin) throw new HttpError(403)
      const collector = await authenticate(request)
      if (!collector?.id) throw new HttpError(401)
      let id = match?.[1]
      if (isCheckout) {
        if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new HttpError(415)
        const bytes = await readBody(request)
        let body
        try { body = JSON.parse(bytes.toString('utf8')) } catch { throw new HttpError(400) }
        if (!body || Object.keys(body).length !== 1 || typeof body.orderId !== 'string' || !/^[a-zA-Z0-9_-]{1,200}$/.test(body.orderId)) throw new HttpError(400)
        id = body.orderId
      }
      const order = await repository.getOwnedOrder(id, collector.id)
      if (!order || order.collectorId !== collector.id) throw new HttpError(404)
      if (!isCheckout) return reply(200, { id: order.id, status: order.status, amountMinor: order.amountMinor, currency: order.currency })
      if (order.status !== 'pending') throw new HttpError(409)
      const frozen = await repository.prepareCheckout(id, collector.id)
      if (!frozen || frozen.id !== id || frozen.collectorId !== collector.id || frozen.status !== 'pending') throw new HttpError(409)
      const session = await checkout(frozen)
      await repository.saveCheckout(frozen.id, frozen.revision, session)
      return reply(200, session)
    } catch (error) {
      return reply(error instanceof HttpError ? error.status : 503, { error: error instanceof HttpError ? 'request_rejected' : 'payment_temporarily_unavailable' })
    }
  }
}
