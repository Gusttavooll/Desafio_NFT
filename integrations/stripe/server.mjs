import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createPaymentHandler } from './http.mjs'
import { createRepository } from './repository.mjs'
import { reconcileOrder } from './reconcile.mjs'

const origin = process.env.APP_ORIGIN || 'http://127.0.0.1:5201'
const base = new URL(origin)
if (base.protocol !== 'http:' || base.hostname !== '127.0.0.1' || base.pathname !== '/') throw new Error('Sandbox must bind to http://127.0.0.1:PORT')
const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey?.startsWith('sk_test_')) throw new Error('Stripe test key required')
const dataDirectory = new URL('./.local/', import.meta.url)
await mkdir(dataDirectory, { recursive: true })
const repo = createRepository(fileURLToPath(new URL('sandbox.sqlite', dataDirectory)))
const authenticate = request => repo.authenticate(request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith('kronos_sandbox='))?.slice('kronos_sandbox='.length))
const handler = createPaymentHandler({ origin, secretKey, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET, authenticate, repository: repo })
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const reconciliation = new Map()
async function refresh(order) {
  if (!order || order.status !== 'pending' || !order.stripeSessionId) return
  if (!reconciliation.has(order.id)) {
    const promise = reconcileOrder(order, repo, secretKey).finally(() => reconciliation.delete(order.id))
    reconciliation.set(order.id, promise)
  }
  await reconciliation.get(order.id)
}
const server = createServer(async (req, res) => {
  try {
    if (req.headers.host !== base.host) { res.writeHead(403); res.end(); return }
    const request = new Request(new URL(req.url, origin), {
      method: req.method, headers: req.headers,
      ...(['GET', 'HEAD'].includes(req.method) ? {} : { body: Readable.toWeb(req), duplex: 'half' }),
    })
    const path = new URL(request.url).pathname
    let response
    if (['/', '/checkout', '/checkout/confirmation'].includes(path) && req.method === 'GET') {
      response = new Response(await readFile(new URL('./sandbox.html', import.meta.url)), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    } else if (path === '/sandbox.js' && req.method === 'GET') {
      response = new Response(await readFile(new URL('./sandbox.js', import.meta.url)), { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } })
    } else if (path === '/sandbox/start' && req.method === 'POST') {
      if (request.headers.get('origin') !== origin) response = json({ error: 'invalid_origin' }, 403)
      else {
        const user = authenticate(request)
        if (user) response = json({ orderId: repo.getDemoOrder(user.id).id })
        else {
          const session = repo.createDemoSession()
          response = json({ orderId: session.order.id })
          response.headers.set('Set-Cookie', `kronos_sandbox=${session.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`)
        }
      }
    } else if (path === '/sandbox/status' && req.method === 'GET') {
      const user = authenticate(request)
      if (!user) response = json({ error: 'no_session' }, 401)
      else {
        const order = repo.getDemoOrder(user.id)
        await refresh(order)
        const current = repo.getOwnedOrder(order.id, user.id)
        response = json({ orderId: current.id, status: current.status, amountMinor: current.amountMinor, currency: current.currency, receipt: repo.getReceipt(current.id, user.id), sandbox: true })
      }
    } else {
      const match = /^\/payments\/orders\/([a-zA-Z0-9_-]+)$/.exec(path)
      if (match && req.method === 'GET') {
        const user = authenticate(request)
        if (user) await refresh(repo.getOwnedOrder(match[1], user.id))
      }
      response = await handler(request)
    }
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify({ error: 'payment_temporarily_unavailable' }))
  }
})
server.requestTimeout = 20000
server.headersTimeout = 10000
server.listen(Number(base.port || 80), '127.0.0.1', () => console.log(`KRONOS Stripe sandbox: ${origin} (test only)`))
