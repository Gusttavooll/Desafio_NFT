import { describe, expect, it } from 'vitest'
import { isEthAmount, parseEthAmount } from './eth-amount'

describe('EthAmount', () => {
  it.each(['0', '1', '0.5', '12.000000000000000001', '0.000000000000000001'])(
    'aceita string decimal válida: %s',
    (value) => {
      expect(isEthAmount(value)).toBe(true)
      expect(parseEthAmount(value)).toBe(value)
    },
  )

  it.each(['', '-1', '1.', '.5', '1e18', '1,5', ' 1', 'abc', '0.0000000000000000001'])(
    'rejeita valor fora do formato: "%s"',
    (value) => {
      expect(isEthAmount(value)).toBe(false)
      expect(() => parseEthAmount(value)).toThrow()
    },
  )
})
