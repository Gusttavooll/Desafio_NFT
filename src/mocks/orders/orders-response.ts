import { HttpResponse } from 'msw'
import { compareQuotes, purchasedRemainder, validateCollector } from '@/domain/orders'
import { resolveSecondaryWallet } from '@/domain/wallets'
import type { CreateOrderBody, ReceiptDto } from '@/infrastructure/orders'
import { buildQuote, CartError } from '@/mocks/cart'
import { contentFingerprint, emitDomainEvent, forcedResponseFor, requireSession, respondForced, respondWithError, type Simulation, type StoredOrder } from '@/mocks/core'

export function settleOrder(sim: Simulation, id: string, now = new Date()): void {
  const stored = sim.state().orders.find(order => order.dto.id === id)
  if (!stored || stored.dto.status !== 'pending' || Date.parse(stored.settleAt) > now.getTime() || !stored.request) return
  const body = stored.request
  const editions = body.items.map(item => sim.state().nfts.flatMap(nft => nft.editions).find(edition => edition.id === item.editionId))
  const available = body.items.every((item, index) => (editions[index]?.available ?? 0) >= item.quantity)
  const outcome = available ? stored.outcome : 'rejected'
  const updatedAt = now.toISOString()
  const version = sim.nextVersion('order', id)
  const changedNfts: string[] = []
  sim.update(state => {
    stored.dto = { ...stored.dto, status: outcome, version, updatedAt }
    if (outcome !== 'confirmed') return
    const quote = body.acceptedQuote
    const receipt: ReceiptDto = {
      transaction: { hash: `sim-${id}`, explorerUrl: `/checkout/confirmation?orderId=${encodeURIComponent(id)}&explorer=1`, confirmedAt: updatedAt },
      items: quote.items.map(item => ({ nftId: item.nftId, editionId: item.editionId, title: item.title, image: item.image, tokenId: item.tokenId, editionLabel: item.editionLabel, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal })),
      subtotal: quote.subtotal, discount: quote.discount, networkFee: quote.networkFee, total: quote.total,
      walletAddress: stored.walletAddress ?? '', issuedAt: updatedAt,
    }
    stored.dto.receipt = receipt
    for (const item of body.items) {
      const nft = state.nfts.find(candidate => candidate.editions.some(edition => edition.id === item.editionId))!
      const edition = nft.editions.find(candidate => candidate.id === item.editionId)!
      edition.available -= item.quantity
      if (!changedNfts.includes(nft.id)) changedNfts.push(nft.id)
    }
    state.carts[stored.collectorId] = purchasedRemainder(state.carts[stored.collectorId] ?? [], body.items)
  })
  for (const nftId of changedNfts) {
    const nft = sim.state().nfts.find(candidate => candidate.id === nftId)!
    const nftVersion = sim.nextVersion('nft', nftId)
    sim.update(() => { nft.version = nftVersion })
    emitDomainEvent(sim, { resource: 'nft', resourceId: nftId, version: nftVersion, payload: structuredClone(nft) })
  }
  emitDomainEvent(sim, { resource: 'order', resourceId: id, version, payload: structuredClone(stored.dto), collectorId: stored.collectorId })
}

export async function createOrderResponse(sim: Simulation, request: Request): Promise<Response> {
  if (sim.scenarioConfig().networkError) return HttpResponse.error()
  const session = requireSession(sim, request)
  if (!session.ok) return session.response
  const key = request.headers.get('Idempotency-Key')?.trim()
  if (!key || key.length > 200) return respondWithError(422, 'validation_error', 'Informe uma chave de idempotência válida.')
  let body: CreateOrderBody
  try { body = await request.json() as CreateOrderBody } catch { return respondWithError(422, 'validation_error', 'Dados do pedido inválidos.') }
  if (!body || !Array.isArray(body.items) || !body.acceptedQuote || !Array.isArray(body.acceptedQuote.items) || !body.collector || typeof body.collector !== 'object') return respondWithError(422, 'validation_error', 'Revise os dados do pedido.')
  if (body.acceptedQuote.items.some(item => !item || typeof item.editionId !== 'string' || typeof item.unitPrice !== 'string' || !Number.isSafeInteger(item.quantity) || !Number.isSafeInteger(item.available)) || [body.acceptedQuote.subtotal, body.acceptedQuote.discount, body.acceptedQuote.networkFee, body.acceptedQuote.total].some(value => typeof value !== 'string')) return respondWithError(422, 'validation_error', 'Cotação aceita inválida.')
  const fingerprint = contentFingerprint(body)
  const existing = sim.state().orders.find(order => order.collectorId === session.collector.id && order.idempotencyKey === key)
  if (existing) {
    if (existing.fingerprint !== fingerprint) return respondWithError(409, 'idempotency_conflict', 'Esta tentativa já foi enviada com outros dados.')
    settleOrder(sim, existing.dto.id)
    return HttpResponse.json(existing.dto)
  }
  if (sim.scenario() === 'price-changed' || sim.scenario() === 'edition-sold-out') {
    const scenario = sim.scenario()
    const target = sim.state().nfts.find(nft => nft.editions.some(edition => edition.id === body.items[0]?.editionId))
    const edition = target?.editions.find(candidate => candidate.id === body.items[0]?.editionId)
    if (edition && target) sim.update(() => {
      if (scenario === 'edition-sold-out') edition.available = 0
      else { const [whole, fraction] = edition.price.split('.'); edition.price = `${BigInt(whole!) + 1n}${fraction ? `.${fraction}` : ''}`; target.price = edition.price }
    })
    sim.setScenario('success')
    if (target) {
      const nextVersion = sim.nextVersion('nft', target.id)
      sim.update(() => { target.version = nextVersion })
      emitDomainEvent(sim, { resource: 'nft', resourceId: target.id, version: nextVersion, payload: structuredClone(target) })
    }
  }
  const forced = forcedResponseFor(sim.scenarioConfig(), 'POST /orders')
  if (forced) return respondForced(forced)
  const collectorErrors = validateCollector(body.collector)
  if (Object.keys(collectorErrors).length) return respondWithError(422, 'validation_error', 'Confira o perfil do colecionador.', collectorErrors)
  const wallets = sim.state().wallets[session.collector.id] ?? []
  const selected = wallets.find(wallet => wallet.id === body.walletId)
  const wallet = selected?.sameAsPrimary ? resolveSecondaryWallet(wallets.find(candidate => candidate.kind === 'primary') ?? null, selected) : selected
  if (!wallet || wallet.network !== body.network) return respondWithError(422, 'validation_error', 'Escolha uma carteira da rede selecionada.', { walletId: 'Carteira indisponível nesta rede.' })
  let current
  try { current = buildQuote(sim, body) } catch (error) {
    if (error instanceof CartError) return respondWithError(error.status, error.code, error.message, error.details)
    throw error
  }
  if (!current.items.length || current.items.some(item => item.quantity > item.available)) return respondWithError(409, 'availability_conflict', 'Uma edição ficou sem disponibilidade. Ajuste o carrinho.')
  if (current.coupon && current.coupon.status !== 'valid') return respondWithError(409, 'price_changed', 'Remova ou corrija o cupom antes de confirmar.', { quote: current })
  const changes = compareQuotes(body.acceptedQuote, current)
  if (changes.length) return respondWithError(409, 'price_changed', 'A cotação mudou. Revise e confirme novamente.', { quote: current, changes })
  const cart = sim.state().carts[session.collector.id] ?? []
  if (body.items.some(item => (cart.find(candidate => candidate.editionId === item.editionId)?.quantity ?? 0) < item.quantity)) return respondWithError(409, 'availability_conflict', 'Os itens do carrinho mudaram. Revise antes de confirmar.')
  const id = `order-${crypto.randomUUID()}`
  const now = new Date()
  const version = sim.nextVersion('order', id)
  const order: StoredOrder = {
    dto: { id, status: 'pending', version, createdAt: now.toISOString(), updatedAt: now.toISOString(), receipt: null },
    collectorId: session.collector.id, idempotencyKey: key, fingerprint,
    outcome: sim.scenarioConfig().order.outcome, settleAt: new Date(now.getTime() + sim.scenarioConfig().order.settleDelayMs).toISOString(),
    // O recibo usa o snapshot revalidado pelo servidor, nunca metadados editáveis do cliente.
    request: structuredClone({ ...body, acceptedQuote: current }), walletAddress: wallet.address,
  }
  sim.update(state => { state.orders.push(order) })
  return HttpResponse.json(order.dto, { status: 201 })
}

export function getOrderResponse(sim: Simulation, request: Request, id: string): Response {
  if (sim.scenarioConfig().networkError) return HttpResponse.error()
  const forced = forcedResponseFor(sim.scenarioConfig(), 'GET /orders/:id')
  if (forced) return respondForced(forced)
  const session = requireSession(sim, request)
  if (!session.ok) return session.response
  const order = sim.state().orders.find(candidate => candidate.dto.id === id && candidate.collectorId === session.collector.id)
  if (!order) return respondWithError(404, 'not_found', 'Pedido não encontrado nesta conta.')
  settleOrder(sim, id)
  return HttpResponse.json(order.dto)
}
