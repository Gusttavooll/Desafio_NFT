// Valor em ETH como string decimal, nunca `number`, para não perder precisão.
// A aritmética depende da biblioteca de decimais (decisão pendente em docs/architecture.md).
export type EthAmount = string & { readonly __brand: 'EthAmount' }

// Não negativo, sem notação científica, até 18 casas decimais (wei).
const ETH_AMOUNT_PATTERN = /^\d+(\.\d{1,18})?$/

export function isEthAmount(value: string): value is EthAmount {
  return ETH_AMOUNT_PATTERN.test(value)
}

export function parseEthAmount(value: string): EthAmount {
  if (!isEthAmount(value)) throw new Error(`Valor em ETH inválido: "${value}"`)
  return value
}
