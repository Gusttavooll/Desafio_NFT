import { isEthAmount } from '@/domain/shared'
const wei = (value: string) => { const [whole, decimal = ''] = value.split('.'); return BigInt(whole!) * 10n ** 18n + BigInt(decimal.padEnd(18, '0')) }
export function priceRangeError(min: string, max: string): string | null {
  if ((min && !isEthAmount(min)) || (max && !isEthAmount(max))) return 'Informe um preço válido em ETH, com até 18 casas decimais.'
  if (min && max && wei(min) > wei(max)) return 'O preço mínimo deve ser menor ou igual ao máximo.'
  return null
}
