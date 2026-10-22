type Stock = { available: number; purchaseLimit?: number }
export function editionLimit(edition: Stock): number {
  if (!Number.isSafeInteger(edition.available) || edition.available < 0) return 0
  const limit = edition.purchaseLimit ?? edition.available
  return Number.isSafeInteger(limit) && limit >= 0 ? Math.min(edition.available, limit) : 0
}
export function clampEditionQuantity(quantity: number, edition: Stock): number {
  const max = editionLimit(edition)
  return max === 0 ? 0 : Math.min(max, Math.max(1, Number.isSafeInteger(quantity) ? quantity : 1))
}
