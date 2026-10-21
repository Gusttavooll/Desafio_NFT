export interface CartItem { nftId: string; editionId: string; quantity: number }
export type Cart = readonly CartItem[]
export interface EditionLimit { availability: number; purchaseLimit: number }
export interface CartAdjustment { nftId: string; editionId: string; requested: number; accepted: number }
type ItemIdentity = Pick<CartItem, 'nftId' | 'editionId'>

const sameEdition = (a: ItemIdentity, b: ItemIdentity) => a.nftId === b.nftId && a.editionId === b.editionId
function assertQuantity(value: number) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('Quantidade deve ser um inteiro positivo seguro.')
}
function maxQuantity(limit: EditionLimit) {
  if (!Number.isSafeInteger(limit.availability) || limit.availability < 0 || !Number.isSafeInteger(limit.purchaseLimit) || limit.purchaseLimit < 1) throw new Error('Limites da Edição inválidos.')
  return Math.min(limit.availability, limit.purchaseLimit)
}
function validate(item: CartItem, limit: EditionLimit) {
  if (!item.nftId || !item.editionId) throw new Error('NFT e Edição são obrigatórios.')
  assertQuantity(item.quantity)
  if (item.quantity > maxQuantity(limit)) throw new Error('Quantidade excede a Disponibilidade ou limite por compra.')
}
export function addItem(cart: Cart, item: CartItem, limit: EditionLimit): CartItem[] {
  assertQuantity(item.quantity)
  const existing = cart.find(row => sameEdition(row, item))
  const next = { ...item, quantity: (existing?.quantity ?? 0) + item.quantity }
  validate(next, limit)
  return existing ? cart.map(row => sameEdition(row, item) ? next : row) : [...cart, next]
}
export function setQuantity(cart: Cart, identity: ItemIdentity, quantity: number, limit: EditionLimit): CartItem[] {
  if (!cart.some(row => sameEdition(row, identity))) throw new Error('Item do carrinho inexistente.')
  const next = { ...identity, quantity }
  validate(next, limit)
  return cart.map(row => sameEdition(row, identity) ? next : row)
}
export function removeItem(cart: Cart, identity: ItemIdentity): CartItem[] {
  return cart.filter(row => !sameEdition(row, identity))
}
export function countItems(cart: Cart): number {
  return cart.reduce((sum, row) => { assertQuantity(row.quantity); const next = sum + row.quantity; assertQuantity(next); return next }, 0)
}
// Pure merge proposal. Application/server must deduplicate the merge attempt;
// calling this twice with the same guest payload is not an idempotent HTTP flow.
export function mergeCarts(collector: Cart, guest: Cart, getLimit: (identity: ItemIdentity) => EditionLimit): { items: CartItem[]; adjustments: CartAdjustment[] } {
  const grouped: CartItem[] = []
  for (const item of [...collector, ...guest]) {
    assertQuantity(item.quantity)
    if (!item.nftId || !item.editionId) throw new Error('NFT e Edição são obrigatórios.')
    const existing = grouped.find(row => sameEdition(row, item))
    if (existing) { const quantity = existing.quantity + item.quantity; assertQuantity(quantity); existing.quantity = quantity }
    else grouped.push({ ...item })
  }
  const items: CartItem[] = []
  const adjustments: CartAdjustment[] = []
  for (const item of grouped) {
    const accepted = Math.min(item.quantity, maxQuantity(getLimit(item)))
    if (accepted !== item.quantity) adjustments.push({ nftId: item.nftId, editionId: item.editionId, requested: item.quantity, accepted })
    if (accepted > 0) items.push({ ...item, quantity: accepted })
  }
  return { items, adjustments }
}
