import { expect, it } from 'vitest'
import { priceRangeError } from './filters'
it('valida a faixa com precisão de Wei e aceita limites vazios', () => {
  expect(priceRangeError('', '')).toBeNull()
  expect(priceRangeError('0.100000000000000002', '0.100000000000000001')).toContain('mínimo')
  expect(priceRangeError('0.1', '0.10')).toBeNull()
  expect(priceRangeError('-1', '2')).toContain('válido')
})
