import type { EthAmount } from '@/domain/shared'
export function PriceTag({ value, previous }: { value: EthAmount; previous?: EthAmount }) {
  return <span className="price-tag">{previous && <del aria-label={`Preço anterior: ${previous} ETH`}>{previous} ETH</del>}<span>{value} <small>ETH</small></span></span>
}
