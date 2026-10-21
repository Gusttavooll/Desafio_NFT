import { describe, it, expect } from 'vitest'
import { addItem, setQuantity, removeItem, countItems, mergeCarts } from './cart'

const item = { nftId: 'nft-1', editionId: 'edition-1', quantity: 2 }
const limit = { availability: 5, purchaseLimit: 3 }
describe('Carrinho e limites por Edição', () => {
  it('soma mesma edição sem alterar o carrinho original', () => {
    const original = [item]
    const result = addItem(original, { ...item, quantity: 1 }, limit)
    expect(result).toEqual([{ ...item, quantity: 3 }])
    expect(original).toEqual([item])
  })
  it('separa diferentes edições e NFTs', () => {
    let cart = addItem([item], { ...item, editionId: 'edition-2', quantity: 1 }, limit)
    cart = addItem(cart, { ...item, nftId: 'nft-2', quantity: 1 }, limit)
    expect(cart).toHaveLength(3)
    expect(countItems(cart)).toBe(4)
  })
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('recusa quantidade inválida %s', quantity => {
    expect(() => addItem([], { ...item, quantity }, limit)).toThrow()
  })
  it('respeita estoque e limite por compra, incluindo redução posterior', () => {
    expect(() => addItem([item], item, limit)).toThrow(/Disponibilidade/)
    expect(() => setQuantity([item], item, 2, { availability: 1, purchaseLimit: 3 })).toThrow(/Disponibilidade/)
    expect(setQuantity([item], item, 1, limit)).toEqual([{ ...item, quantity: 1 }])
    expect(() => addItem([], item, { availability: 0, purchaseLimit: 3 })).toThrow()
  })
  it('remove só a edição escolhida e conta unidades', () => {
    const second = { ...item, editionId: 'edition-2', quantity: 1 }
    expect(removeItem([item, second], item)).toEqual([second])
    expect(countItems([])).toBe(0)
  })
  it('mescla visitante e colecionador com ajustes explícitos', () => {
    const second = { ...item, editionId: 'edition-2' }
    const result = mergeCarts([item], [item, second], row => row.editionId === 'edition-1' ? limit : { availability: 0, purchaseLimit: 3 })
    expect(result.items).toEqual([{ ...item, quantity: 3 }])
    expect(result.adjustments).toEqual([{ nftId: item.nftId, editionId: item.editionId, requested: 4, accepted: 3 }, { nftId: item.nftId, editionId: 'edition-2', requested: 2, accepted: 0 }])
  })
  it('mescla vazios sem criar item e mantém entrada intacta', () => {
    expect(mergeCarts([], [], () => limit)).toEqual({ items: [], adjustments: [] })
    expect(mergeCarts([], [item], () => limit).items).toEqual([item])
    expect(item.quantity).toBe(2)
  })
  it('recusa contratos de limite inválidos e atualização de item inexistente', () => {
    expect(() => addItem([], item, { availability: -1, purchaseLimit: 3 })).toThrow()
    expect(() => addItem([], item, { availability: 5, purchaseLimit: 1.5 })).toThrow()
    expect(() => setQuantity([], item, 1, limit)).toThrow(/inexistente/)
  })
})
