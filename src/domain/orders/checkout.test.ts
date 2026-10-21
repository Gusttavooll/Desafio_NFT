import { describe, expect, it } from 'vitest'
import { compareQuotes, transitionOrder, reconcileOrder, purchasedRemainder, validateCollector } from './checkout'

const quote = { items: [{ nftId: 'a', editionId: 'a-one', title: 'A', tokenId: '1', editionLabel: 'Única', quantity: 1, unitPrice: '1.000000000000000001', subtotal: '1.000000000000000001', available: 4 }], subtotal: '1.000000000000000001', discount: '0', networkFee: '0.0021', total: '1.002100000000000001', coupon: null, quotedAt: '2026-01-01' }
describe('Checkout', () => {
  it('ignora timestamp, mas exige aceite para preço, estoque, taxa ou cupom diferentes', () => {
    expect(compareQuotes(quote, { ...quote, quotedAt: '2026-01-02' })).toEqual([])
    expect(compareQuotes(quote, { ...quote, networkFee: '0.0022', total: '1.002200000000000001' })).toContain('Taxa de rede')
    expect(compareQuotes(quote, { ...quote, items: [{ ...quote.items[0]!, available: 0 }] })).toContain('Disponibilidade')
    expect(compareQuotes(quote, { ...quote, coupon: { code: 'X', status: 'expired' } })).toContain('Cupom')
    expect(compareQuotes(quote, { ...quote, items: [{ ...quote.items[0]!, unitPrice: '1.000000000000000002' }] })).toContain('Preço dos NFTs')
  })
  it('estados terminais nunca regridem', () => {
    expect(transitionOrder('pending', 'confirmed')).toBe('confirmed')
    expect(transitionOrder('confirmed', 'pending')).toBe('confirmed')
    expect(transitionOrder('rejected', 'confirmed')).toBe('rejected')
  })
  it('uma REST atrasada não desfaz a transição terminal recebida por evento', () => {
    const pending = { id: 'a', status: 'pending' as const, version: 1, createdAt: '', updatedAt: '', receipt: null }
    const rejected = { ...pending, status: 'rejected' as const, version: 2 }
    expect(reconcileOrder(rejected, pending)).toBe(rejected)
    expect(reconcileOrder(rejected, { ...pending, version: 3 })).toBe(rejected)
    expect(reconcileOrder(pending, rejected)).toBe(rejected)
  })
  it('retira somente quantidades compradas, preservando novas adições', () => {
    expect(purchasedRemainder([{ id: 'a', editionId: 'a-one', quantity: 3 }, { id: 'b', editionId: 'b-one', quantity: 1 }], [{ editionId: 'a-one', quantity: 2 }])).toEqual([{ id: 'a', editionId: 'a-one', quantity: 1 }, { id: 'b', editionId: 'b-one', quantity: 1 }])
  })
  it('valida campos de colecionador', () => {
    expect(validateCollector({ displayName: '', username: '', email: 'bad', ensName: 'bad' })).toHaveProperty('email')
    expect(validateCollector({ displayName: 'Ana', username: 'ana.prado', email: 'ana@kronos.test', ensName: 'ana.eth' })).toEqual({})
  })
})
