import { describe, expect, it } from 'vitest'
import { validateWallet, resolveSecondaryWallet } from './validation'

const primary = { id: 'one', kind: 'primary' as const, address: `0x${'a'.repeat(40)}`, network: 'ethereum' as const, type: 'metamask' as const, nickname: 'Principal', displayName: 'Ana Prado', username: 'ana', email: 'ana@example.test', ensName: 'ana.eth' }
describe('Carteiras', () => {
  it('valida endereço e dados sem aceitar formas parciais', () => {
    expect(validateWallet(primary)).toEqual({})
    expect(validateWallet({ ...primary, address: '0x123', email: 'ana', ensName: 'ana.com', displayName: '' })).toMatchObject({ address: expect.any(String), email: expect.any(String), ensName: expect.any(String), displayName: expect.any(String) })
  })
  it('valida Solana conforme a rede, sem aceitar endereço Ethereum', () => {
    expect(validateWallet({ ...primary, network: 'solana', address: '11111111111111111111111111111111', ensName: '' })).toEqual({})
    expect(validateWallet({ ...primary, network: 'solana' })).toHaveProperty('address')
  })
  it('secundária igual à principal acompanha a principal sem duplicar identidade', () => {
    const secondary = { ...primary, id: 'two', kind: 'secondary' as const, sameAsPrimary: true }
    expect(resolveSecondaryWallet({ ...primary, nickname: 'Nova' }, secondary)).toMatchObject({ id: 'two', kind: 'secondary', nickname: 'Nova', sameAsPrimary: true })
    expect(resolveSecondaryWallet(null, secondary)).toBeNull()
  })
})
