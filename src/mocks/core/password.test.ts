import { describe, expect, it } from 'vitest'
import { generateSalt, generateToken, hashPassword, verifyPassword } from './password'

describe('senha na simulação', () => {
  it('nunca devolve a senha em claro', async () => {
    const hash = await hashPassword('Segredo#123', 'sal-1')
    expect(hash).not.toContain('Segredo#123')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('gera o mesmo hash para a mesma senha e o mesmo salt', async () => {
    expect(await hashPassword('abc', 's')).toBe(await hashPassword('abc', 's'))
  })

  it('gera hashes diferentes para salts diferentes', async () => {
    expect(await hashPassword('abc', 's1')).not.toBe(await hashPassword('abc', 's2'))
  })

  it('verifica senha correta e rejeita a incorreta', async () => {
    const hash = await hashPassword('correta', 'sal')
    expect(await verifyPassword('correta', 'sal', hash)).toBe(true)
    expect(await verifyPassword('errada', 'sal', hash)).toBe(false)
  })

  it('gera tokens opacos e únicos, e salts únicos', () => {
    expect(generateToken()).toMatch(/^[0-9a-f]{64}$/)
    expect(generateToken()).not.toBe(generateToken())
    expect(generateSalt()).not.toBe(generateSalt())
  })
})
