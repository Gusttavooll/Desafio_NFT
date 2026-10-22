import type { ApiErrorCode } from '@/domain/shared'
import type { QuoteDto, QuoteRequest, CartDto, CartItemDto } from '@/infrastructure/cart'
import type { Simulation } from '@/mocks/core'

export class CartError extends Error {
  constructor(public status: number, public code: ApiErrorCode, message: string, public details?: Record<string, unknown>) { super(message) }
}
const invalid = (message: string) => new CartError(422, 'validation_error', message)
const wei = (price: string) => { const [whole = '0', fraction = ''] = price.split('.'); return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0')) }
const decimal = (amount: bigint) => { const fraction = (amount % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, ''); return `${amount / 10n ** 18n}${fraction ? `.${fraction}` : ''}` }
function editionFor(sim: Simulation, id: string) {
  const nft = sim.state().nfts.find(nft => nft.editions.some(edition => edition.id === id))
  const edition = nft?.editions.find(edition => edition.id === id)
  if (!nft || !edition) throw new CartError(404, 'not_found', 'Edição não encontrada.')
  return { nft, edition }
}
function quantity(value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) throw invalid('Quantidade deve ser inteira e positiva.')
}
export function buildQuote(sim: Simulation, input: QuoteRequest): QuoteDto {
  if (!input || !Array.isArray(input.items) || input.items.length > 100 || !['ethereum', 'polygon', 'solana'].includes(input.network)) throw invalid('Cotação inválida.')
  const seen = new Set<string>()
  let subtotal = 0n
  const items = input.items.map(item => {
    if (!item || typeof item.editionId !== 'string') throw invalid('Edição inválida.')
    quantity(item.quantity)
    if (seen.has(item.editionId)) throw invalid('Edição duplicada.')
    seen.add(item.editionId)
    const { nft, edition } = editionFor(sim, item.editionId)
    if (item.quantity > Math.min(edition.available, edition.purchaseLimit ?? edition.available)) throw new CartError(409, 'availability_conflict', 'Disponibilidade alterada. Revise o carrinho.', { editionId: edition.id, available: edition.available })
    const line = wei(edition.price) * BigInt(item.quantity)
    subtotal += line
    return { nftId: nft.id, editionId: edition.id, title: nft.title, image: nft.imageUrl, tokenId: nft.tokenId, editionLabel: edition.label, quantity: item.quantity, unitPrice: edition.price, subtotal: decimal(line), available: edition.available }
  })
  let discount = 0n
  let coupon: QuoteDto['coupon'] = null
  if (input.couponCode) {
    if (typeof input.couponCode !== 'string') throw invalid('Cupom inválido.')
    const code = input.couponCode.trim().toUpperCase()
    const found = sim.state().coupons.find(coupon => coupon.code === code)
    const reason = !found || sim.scenario() === 'coupon-invalid' ? 'invalid' : Date.parse(found.expiresAt) <= Date.now() || sim.scenario() === 'coupon-expired' ? 'expired' : null
    if (reason) throw new CartError(422, 'validation_error', reason === 'expired' ? 'Cupom expirado.' : 'Cupom inválido.', { field: 'couponCode', reason })
    discount = subtotal * BigInt(found!.percentOff) / 100n
    coupon = { code, status: 'valid' }
  }
  const fee = items.length ? wei(sim.state().networkFees[input.network]) : 0n
  return { items, subtotal: decimal(subtotal), discount: decimal(discount), networkFee: decimal(fee), total: decimal(subtotal - discount + fee), coupon, quotedAt: new Date().toISOString() }
}
export function readCart(sim: Simulation, owner: string): CartDto {
  const stored = sim.state().carts[owner] ?? []
  let changed = false
  const items = stored.map(item => {
    const { edition } = editionFor(sim, item.editionId)
    const max = Math.min(edition.available, edition.purchaseLimit ?? edition.available)
    if (max > 0 && item.quantity > max) { changed = true; return { ...item, quantity: max } }
    return item
  })
  if (changed) sim.update(state => { state.carts[owner] = items; state.versions[`cart:${owner}`] = (state.versions[`cart:${owner}`] ?? 0) + 1 })
  return { items, version: sim.state().versions[`cart:${owner}`] ?? 0, adjusted: changed }
}
export function changeCart(sim: Simulation, owner: string, action: 'add' | 'update' | 'remove', input: { id?: string; nftId?: string; editionId?: string; quantity?: number }): CartDto {
  const items = readCart(sim, owner).items.map(item => ({ ...item }))
  if (action === 'remove') {
    const index = items.findIndex(item => item.id === input.id)
    if (index >= 0) items.splice(index, 1)
  } else {
    quantity(input.quantity)
    const existing = action === 'update' ? items.find(item => item.id === input.id) : items.find(item => item.nftId === input.nftId && item.editionId === input.editionId)
    if (action === 'update' && !existing) throw new CartError(404, 'not_found', 'Item não encontrado.')
    const { nft, edition } = editionFor(sim, existing?.editionId ?? input.editionId ?? '')
    if (action === 'add' && nft.id !== input.nftId) throw invalid('NFT e Edição não correspondem.')
    const next = input.quantity + (action === 'add' ? existing?.quantity ?? 0 : 0)
    quantity(next)
    if (next > Math.min(edition.available, edition.purchaseLimit ?? edition.available)) throw new CartError(409, 'availability_conflict', 'Quantidade excede a disponibilidade ou limite por compra.', { available: edition.available })
    if (existing) existing.quantity = next
    else items.push({ id: crypto.randomUUID(), nftId: nft.id, editionId: edition.id, quantity: next })
  }
  sim.update(state => { state.carts[owner] = items; state.versions[`cart:${owner}`] = (state.versions[`cart:${owner}`] ?? 0) + 1 })
  return readCart(sim, owner)
}
// Guest source is consumed in the same persisted update; retries cannot add it twice.
export function mergeGuestCart(sim: Simulation, owner: string): CartDto & { adjusted: boolean } {
  if (owner === 'guest') throw new CartError(401, 'session_expired', 'Entre para mesclar o carrinho.')
  const existingCart = readCart(sim, owner)
  const guestCart = readCart(sim, 'guest')
  if (guestCart.items.length === 0) return { ...existingCart, adjusted: Boolean(existingCart.adjusted) }
  const rows: CartItemDto[] = existingCart.items.map(item => ({ ...item }))
  let adjusted = Boolean(existingCart.adjusted || guestCart.adjusted)
  for (const guest of guestCart.items) {
    const { edition } = editionFor(sim, guest.editionId)
    const existing = rows.find(item => item.editionId === guest.editionId)
    const requested = (existing?.quantity ?? 0) + guest.quantity
    const accepted = Math.min(requested, edition.available, edition.purchaseLimit ?? edition.available)
    adjusted ||= accepted !== requested
    if (existing) existing.quantity = accepted || existing.quantity
    else if (accepted) rows.push({ ...guest, quantity: accepted })
  }
  sim.update(state => { state.carts[owner] = rows; state.carts.guest = []; state.versions[`cart:${owner}`] = (state.versions[`cart:${owner}`] ?? 0) + 1 })
  return { ...readCart(sim, owner), adjusted }
}
