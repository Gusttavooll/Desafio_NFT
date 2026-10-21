import { describe, expect, it } from 'vitest'
import { createSimulation } from '@/mocks/core'
import { buildQuote } from '@/mocks/cart'
import type { CreateOrderBody } from '@/infrastructure/orders'
import { createOrderResponse, getOrderResponse, settleOrder } from './orders-response'

function fixture() {
  const sim = createSimulation({ storage: null, search: '' })
  const nft = sim.state().nfts[0]!
  const edition = nft.editions.find(e => e.available > 1)!
  sim.update(state => {
    state.sessions.push({ token: 'token', collectorId: 'collector-ana', expiresAt: '2099-01-01' })
    state.carts['collector-ana'] = [{ id: 'item', nftId: nft.id, editionId: edition.id, quantity: 1 }]
  })
  const items = [{ editionId: edition.id, quantity: 1 }]
  const body: CreateOrderBody = { items, network: 'ethereum', walletId: 'wallet-ana-primary', collector: { displayName: 'Ana', username: 'ana', email: 'ana@kronos.test' }, acceptedQuote: buildQuote(sim, { items, network: 'ethereum' }) }
  const request = (key = 'idempotent', next = body) => new Request('http://local/api/orders', { method: 'POST', headers: { Authorization: 'Bearer token', 'Idempotency-Key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(next) })
  return { sim, nft, edition, body, request }
}
describe('API de Pedidos', () => {
  it('um reenvio recupera o mesmo pedido; conteúdo diferente é conflito', async () => {
    const { sim, request, body } = fixture()
    const first = await (await createOrderResponse(sim, request())).json()
    expect(first.status).toBe('pending')
    const retry = await (await createOrderResponse(sim, request())).json()
    expect(retry.id).toBe(first.id)
    expect(sim.state().orders).toHaveLength(1)
    expect((await createOrderResponse(sim, request('idempotent', { ...body, collector: { ...body.collector, note: 'changed' } }))).status).toBe(409)
  })
  it('rejeita cotação desatualizada e carteira de outra conta', async () => {
    const { sim, request, body, edition } = fixture()
    expect((await createOrderResponse(sim, request('wrong-wallet', { ...body, walletId: 'other' }))).status).toBe(422)
    sim.update(state => { state.nfts[0]!.editions.find(e => e.id === edition.id)!.price = '99' })
    expect((await createOrderResponse(sim, request())).status).toBe(409)
    expect(sim.state().orders).toHaveLength(0)
  })
  it('confirma uma única vez; preserva novas adições e congela o recibo', async () => {
    const { sim, request, edition } = fixture()
    const order = await (await createOrderResponse(sim, request())).json()
    sim.update(state => { state.carts['collector-ana']![0]!.quantity = 3 })
    const stock = edition.available
    settleOrder(sim, order.id, new Date('2099-01-01'))
    expect(sim.state().orders[0]!.dto.status).toBe('confirmed')
    expect(sim.state().carts['collector-ana']![0]!.quantity).toBe(2)
    expect(edition.available).toBe(stock - 1)
    const receipt = JSON.stringify(sim.state().orders[0]!.dto.receipt)
    sim.update(state => { state.nfts[0]!.editions[0]!.price = '222' })
    settleOrder(sim, order.id, new Date('2099-01-01'))
    expect(JSON.stringify(sim.state().orders[0]!.dto.receipt)).toBe(receipt)
    expect(edition.available).toBe(stock - 1)
  })
  it('congela a miniatura canônica ao criar o pedido, antes da liquidação', async () => {
    const { sim, nft, request } = fixture()
    const image = nft.imageUrl
    const order = await (await createOrderResponse(sim, request())).json()
    sim.update(state => { state.nfts[0]!.imageUrl = '/nfts/changed-before-confirmation.svg' })
    settleOrder(sim, order.id, new Date('2099-01-01'))
    expect(sim.state().orders[0]!.dto.receipt!.items[0]!.image).toBe(image)
    sim.update(state => { state.nfts[0]!.imageUrl = '/nfts/changed-after-confirmation.svg' })
    const reloaded = await getOrderResponse(sim, new Request(`http://local/api/orders/${order.id}`, { headers: { Authorization: 'Bearer token' } }), order.id).json()
    expect(reloaded.receipt.items[0].image).toBe(image)
  })
  it('recusa preserva carrinho e não entrega recibo; outro usuário não consulta', async () => {
    const { sim, request } = fixture()
    sim.setScenario('payment-rejected')
    const order = await (await createOrderResponse(sim, request())).json()
    settleOrder(sim, order.id, new Date('2099-01-01'))
    expect(sim.state().orders[0]!.dto).toMatchObject({ status: 'rejected', receipt: null })
    expect(sim.state().carts['collector-ana']).toHaveLength(1)
    sim.update(state => { state.sessions[0]!.collectorId = 'collector-bruno' })
    expect(getOrderResponse(sim, new Request('http://local/api/orders/a', { headers: { Authorization: 'Bearer token' } }), order.id).status).toBe(404)
  })
  it('o recibo usa metadados do servidor e trata uma cotação malformada como validação', async () => {
    const { sim, request, body } = fixture()
    const malicious = structuredClone(body)
    malicious.acceptedQuote.items[0]!.title = 'Texto falsificado'
    malicious.acceptedQuote.items[0]!.image = '/imagem-falsificada.svg'
    malicious.acceptedQuote.items[0]!.subtotal = '0'
    const order = await (await createOrderResponse(sim, request('snapshot', malicious))).json()
    settleOrder(sim, order.id, new Date('2099-01-01'))
    expect(sim.state().orders[0]!.dto.receipt!.items[0]!.title).toBe(body.acceptedQuote.items[0]!.title)
    expect(sim.state().orders[0]!.dto.receipt!.items[0]!.image).toBe(sim.state().nfts[0]!.imageUrl)
    expect(sim.state().orders[0]!.dto.receipt!.items[0]!.subtotal).toBe(body.acceptedQuote.items[0]!.subtotal)
    const malformed = structuredClone(body)
    malformed.acceptedQuote.items = [null] as unknown as typeof body.acceptedQuote.items
    expect((await createOrderResponse(sim, request('invalid', malformed))).status).toBe(422)
  })
  it('dois pedidos concorrentes não vendem mais que a disponibilidade', async () => {
    const { sim, request, edition } = fixture()
    sim.update(() => { edition.available = 1 })
    const body: CreateOrderBody = { items: [{ editionId: edition.id, quantity: 1 }], network: 'ethereum', walletId: 'wallet-ana-primary', collector: { displayName: 'Ana', username: 'ana', email: 'ana@kronos.test' }, acceptedQuote: buildQuote(sim, { items: [{ editionId: edition.id, quantity: 1 }], network: 'ethereum' }) }
    const one = await (await createOrderResponse(sim, request('one', body))).json()
    const two = await (await createOrderResponse(sim, request('two', body))).json()
    settleOrder(sim, one.id, new Date('2099-01-01'))
    settleOrder(sim, two.id, new Date('2099-01-01'))
    expect(sim.state().orders.map(order => order.dto.status)).toEqual(['confirmed', 'rejected'])
    expect(edition.available).toBe(0)
  })
})
