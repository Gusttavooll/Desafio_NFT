import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reconcileOrder } from './reconcile.mjs'
import { createRepository } from './repository.mjs'

test('only authoritative paid test session confirms an order; unpaid and mismatched sessions do not', async () => {
  const repo = createRepository(':memory:')
  try {
    const { order } = repo.createDemoSession()
    repo.saveCheckout(order.id, 1, { id: 'cs_test_one', url: 'https://checkout.stripe.com/one' })
    const saved = repo.getOwnedOrder(order.id, order.collectorId)
    const session = { id: 'cs_test_one', client_reference_id: order.id, metadata: { order_id: order.id, revision: '1' }, livemode: false, amount_total: 1000, currency: 'brl', payment_status: 'unpaid', status: 'open' }
    const transport = change => async () => Response.json({ ...session, ...change })
    await reconcileOrder(saved, repo, 'sk_test_fixture', transport({}))
    assert.equal(repo.getOwnedOrder(order.id, order.collectorId).status, 'pending')
    for (const change of [{ livemode: true }, { client_reference_id: 'other' }, { amount_total: 1 }, { currency: 'usd' }, { metadata: { order_id: order.id, revision: '2' } }]) {
      await assert.rejects(reconcileOrder(saved, repo, 'sk_test_fixture', transport({ payment_status: 'paid', status: 'complete', ...change })))
    }
    await reconcileOrder(saved, repo, 'sk_test_fixture', transport({ payment_status: 'paid', status: 'complete' }))
    await reconcileOrder(saved, repo, 'sk_test_fixture', transport({ payment_status: 'paid', status: 'complete' }))
    assert.equal(repo.getOwnedOrder(order.id, order.collectorId).status, 'confirmed')
    assert.ok(repo.getReceipt(order.id, order.collectorId))
  } finally { repo.close() }
})
