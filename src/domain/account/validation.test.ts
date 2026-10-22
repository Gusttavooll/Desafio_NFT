import { describe, expect, it } from 'vitest'
import { safeAuthCancelPath, safeReturnTo, validateAvatar, validatePasswordChange, validateProfile, validateRegistration } from './validation'

describe('validação de Conta', () => {
  it('aceita cadastro válido e associa erros ao campo incorreto', () => {
    expect(validateRegistration({ displayName: 'Nova Pessoa', username: 'nova.pessoa', email: 'nova@kronos.test', password: 'SenhaNova#1', confirmation: 'SenhaNova#1' })).toEqual({})
    expect(validateRegistration({ displayName: '', username: 'a!', email: 'sem-email', password: 'curta', confirmation: 'outra' })).toMatchObject({ displayName: expect.any(String), username: expect.any(String), email: expect.any(String), password: expect.any(String), confirmation: expect.any(String) })
  })
  it('valida perfil e nova senha sem aceitar confirmação divergente', () => {
    expect(validateProfile({ displayName: 'Ana Prado', username: 'ana.prado', email: 'ana@kronos.test', ensName: '' })).toEqual({})
    expect(validatePasswordChange({ currentPassword: '', newPassword: 'nova', confirmation: 'diferente' })).toMatchObject({ currentPassword: expect.any(String), newPassword: expect.any(String), confirmation: expect.any(String) })
  })
  it('restringe avatar a imagens seguras de até 2 MB', () => {
    expect(validateAvatar({ type: 'image/png', size: 100 })).toBeNull()
    expect(validateAvatar({ type: 'image/svg+xml', size: 100 })).toBeTruthy()
    expect(validateAvatar({ type: 'image/jpeg', size: 2 * 1024 * 1024 + 1 })).toBeTruthy()
  })
  it('mantém rota e contexto internos e bloqueia redirecionamento externo', () => {
    expect(safeReturnTo('/checkout?step=review#total')).toBe('/checkout?step=review#total')
    for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/%2F%2Fevil.test', '/login', '/register?returnTo=/cart', '/\n/evil.test']) expect(safeReturnTo(value)).toBe('/')
  })
  it('cancelar autenticação não retorna a uma rota que exige login', () => {
    for (const path of ['/profile', '/profile?section=password', '/wallets/', '/checkout', '/checkout/confirmation?orderId=demo']) expect(safeAuthCancelPath(path)).toBe('/')
    expect(safeAuthCancelPath('/cart?coupon=KRONOS10')).toBe('/cart?coupon=KRONOS10')
    expect(safeAuthCancelPath('/nfts/emerald-ape-042')).toBe('/nfts/emerald-ape-042')
    expect(safeReturnTo('/checkout?step=review')).toBe('/checkout?step=review')
  })
})
