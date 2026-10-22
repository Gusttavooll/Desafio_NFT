import { describe, it, expect } from 'vitest'
import { createSimulation } from '@/mocks/core'
import { buildQuote, changeCart, mergeGuestCart, readCart } from './cart-service'

describe('Carrinho e cotação do servidor simulado', () => {
  it('reconcilia queda de estoque sem apagar edição esgotada', () => {
    const sim = createSimulation({ storage: null, search: '' })
    const nft = sim.state().nfts[0]!
    const edition = nft.editions[1]!
    changeCart(sim, 'guest', 'add', { nftId: nft.id, editionId: edition.id, quantity: 3 })
    edition.available = 2
    expect(readCart(sim, 'guest')).toMatchObject({ items: [{ quantity: 2 }], adjusted: true })
    edition.available = 0
    expect(readCart(sim, 'guest').items).toHaveLength(1)
    expect(() => buildQuote(sim, { items: readCart(sim, 'guest').items, network: 'ethereum' })).toThrow(/Disponibilidade/)
  })
  it('limite por compra restringe adição e cotação', () => {
    const sim = createSimulation({ storage: null, search: '' })
    const nft = sim.state().nfts[0]!
    const edition = nft.editions[1]!
    edition.purchaseLimit = 1
    expect(() => changeCart(sim, 'guest', 'add', { nftId: nft.id, editionId: edition.id, quantity: 2 })).toThrow()
    expect(() => buildQuote(sim, { items: [{ editionId: edition.id, quantity: 2 }], network: 'ethereum' })).toThrow()
  })
  it('cota ETH exato e aplica desconto só no subtotal', () => {
    const sim = createSimulation({ storage: null, search: '' })
    const nft = sim.state().nfts[0]!
    nft.editions[0]!.price = '0.420000000000000001'
    const result = buildQuote(sim, { items: [{ editionId: nft.editions[0]!.id, quantity: 1 }], network: 'ethereum', couponCode: 'KRONOS10' })
    expect(result.subtotal).toBe('0.420000000000000001')
    expect(result.discount).toBe('0.042')
    expect(result.total).toBe('0.380100000000000001')
  })
  it('rejeita frações, duplicatas, estoque e cupom inválido/expirado', () => {
    const sim = createSimulation({ storage: null, search: '' })
    const item = { editionId: sim.state().nfts[0]!.editions[0]!.id, quantity: 1 }
    for (const items of [[{ ...item, quantity: 1.5 }], [item, item], [{ ...item, quantity: 1000 }]]) expect(() => buildQuote(sim, { items, network: 'ethereum' })).toThrow()
    for (const couponCode of ['INVALIDO', 'EXPIRADO5']) expect(() => buildQuote(sim, { items: [item], network: 'ethereum', couponCode })).toThrow(/Cupom/)
  })
  it('persiste soma/alteração/remoção e mescla sem duplicar em retry', () => {
    const sim = createSimulation({ storage: null, search: '' })
    const nft = sim.state().nfts[0]!
    const item = { nftId: nft.id, editionId: nft.editions[1]!.id, quantity: 2 }
    changeCart(sim, 'guest', 'add', item)
    changeCart(sim, 'guest', 'add', { ...item, quantity: 1 })
    expect(sim.state().carts.guest?.[0]?.quantity).toBe(3)
    mergeGuestCart(sim, 'collector-ana')
    const version = sim.state().versions['cart:collector-ana']
    mergeGuestCart(sim, 'collector-ana')
    expect(sim.state().versions['cart:collector-ana']).toBe(version)
    expect(sim.state().carts['collector-ana']?.[0]?.quantity).toBe(3)
    expect(sim.state().carts.guest).toEqual([])
    const id = sim.state().carts['collector-ana']![0]!.id
    changeCart(sim, 'collector-ana', 'update', { id, quantity: 1 })
    expect(sim.state().carts['collector-ana']![0]!.quantity).toBe(1)
    changeCart(sim, 'collector-ana', 'remove', { id })
    expect(sim.state().carts['collector-ana']).toEqual([])
  })
})
