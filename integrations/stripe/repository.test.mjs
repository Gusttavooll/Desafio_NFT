import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRepository } from './repository.mjs'
import { paymentDecision } from './checkout.mjs'

test('server sessions isolate orders; checkout binding is idempotent and immutable', () => {
  const repo = createRepository(':memory:')
  try {
    const first = repo.createDemoSession()
    const second = repo.createDemoSession()
    const owner = repo.authenticate(first.token)
    assert.equal(repo.authenticate('invalid'), null)
    assert.equal(repo.getOwnedOrder(first.order.id, repo.authenticate(second.token).id), null)
    assert.equal(repo.prepareCheckout(first.order.id, owner.id).amountMinor, 1000)
    repo.saveCheckout(first.order.id, 1, { id: 'cs_test_one', url: 'https://checkout.stripe.com/one' })
    repo.saveCheckout(first.order.id, 1, { id: 'cs_test_one', url: 'https://checkout.stripe.com/one' })
    assert.throws(() => repo.saveCheckout(first.order.id, 1, { id: 'cs_test_other', url: 'https://checkout.stripe.com/other' }))
  } finally { repo.close() }
})

test('payment confirmation, receipt and event deduplication commit atomically', () => {
  const repo = createRepository(':memory:')
  try {
    const { order } = repo.createDemoSession()
    const event = { id: 'evt_paid', type: 'checkout.session.completed', livemode: false, data: { object: { id: 'cs_test_one', metadata: { order_id: order.id }, amount_total: 1000, currency: 'brl', payment_status: 'paid' } } }
    assert.throws(() => repo.applyEvent(event, o => paymentDecision(event, o)))
    repo.saveCheckout(order.id, 1, { id: 'cs_test_one', url: 'https://checkout.stripe.com/one' })
    assert.throws(() => repo.applyEvent(event, () => { throw Error('rollback') }))
    assert.equal(repo.getOwnedOrder(order.id, order.collectorId).status, 'pending')
    repo.applyEvent(event, o => paymentDecision(event, o))
    repo.applyEvent(event, () => { throw Error('duplicate must not be applied') })
    assert.equal(repo.getOwnedOrder(order.id, order.collectorId).status, 'confirmed')
    assert.equal(repo.getReceipt(order.id, order.collectorId).amountMinor, 1000)
    const late = { ...event, id: 'evt_late', type: 'checkout.session.expired' }
    repo.applyEvent(late, o => paymentDecision(late, o))
    assert.equal(repo.getOwnedOrder(order.id, order.collectorId).status, 'confirmed')
  } finally { repo.close() }
})
