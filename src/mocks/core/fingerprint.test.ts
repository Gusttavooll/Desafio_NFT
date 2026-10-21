import { describe, expect, it } from 'vitest'
import { contentFingerprint } from './fingerprint'

describe('contentFingerprint', () => {
  it('gera a mesma impressão para o mesmo conteúdo', () => {
    const body = { walletId: 'w1', items: [{ editionId: 'e1', quantity: 2 }] }
    expect(contentFingerprint(body)).toBe(contentFingerprint({ ...body }))
  })

  it('ignora a ordem das chaves', () => {
    expect(contentFingerprint({ a: 1, b: { c: 2, d: 3 } })).toBe(contentFingerprint({ b: { d: 3, c: 2 }, a: 1 }))
  })

  it('muda quando um valor muda', () => {
    expect(contentFingerprint({ quantity: 1 })).not.toBe(contentFingerprint({ quantity: 2 }))
  })

  it('preserva a ordem dos itens de uma lista', () => {
    expect(contentFingerprint({ ids: ['a', 'b'] })).not.toBe(contentFingerprint({ ids: ['b', 'a'] }))
  })

  it('diferencia string de número', () => {
    expect(contentFingerprint({ v: '1' })).not.toBe(contentFingerprint({ v: 1 }))
  })

  it('ignora campos undefined', () => {
    expect(contentFingerprint({ a: 1, b: undefined })).toBe(contentFingerprint({ a: 1 }))
  })
})
