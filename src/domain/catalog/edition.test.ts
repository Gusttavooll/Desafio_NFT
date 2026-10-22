import { describe, expect, it } from 'vitest'
import { editionLimit, clampEditionQuantity } from './edition'

describe('quantidade da edição', () => {
  it('respeita estoque e limite por compra sem aceitar valores fracionários', () => {
    expect(editionLimit({ available: 30, purchaseLimit: 5 })).toBe(5)
    expect(editionLimit({ available: 2, purchaseLimit: 5 })).toBe(2)
    expect(editionLimit({ available: 0 })).toBe(0)
    expect(editionLimit({ available: 1.5 })).toBe(0)
    expect(clampEditionQuantity(12, { available: 3 })).toBe(3)
    expect(clampEditionQuantity(0, { available: 3 })).toBe(1)
    expect(clampEditionQuantity(2, { available: 0 })).toBe(0)
  })
})
