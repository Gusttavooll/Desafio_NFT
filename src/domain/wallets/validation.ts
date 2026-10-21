import type { Wallet } from './wallet'

export type WalletFields = Omit<Wallet, 'id'>
export type WalletErrors = Partial<Record<keyof WalletFields, string>>
export function validateWallet(wallet: WalletFields): WalletErrors {
  const errors: WalletErrors = {}
  if (typeof wallet.displayName !== 'string' || !wallet.displayName.trim()) errors.displayName = 'Informe o nome de exibição.'
  if (typeof wallet.nickname !== 'string' || !wallet.nickname.trim()) errors.nickname = 'Informe um apelido para a carteira.'
  if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(wallet.username ?? '')) errors.username = 'Use de 3 a 40 letras, números, pontos ou traços.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wallet.email ?? '')) errors.email = 'Informe um e-mail válido.'
  if (wallet.ensName && !/^[a-zA-Z0-9-]+\.eth$/.test(wallet.ensName)) errors.ensName = 'O nome ENS deve terminar em .eth.'
  if (!['ethereum', 'polygon', 'solana'].includes(wallet.network)) errors.network = 'Escolha uma rede válida.'
  if (!['metamask', 'walletconnect', 'coinbase', 'ledger'].includes(wallet.type)) errors.type = 'Escolha um tipo de carteira válido.'
  const validAddress = wallet.network === 'solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet.address ?? '') : /^0x[0-9a-fA-F]{40}$/.test(wallet.address ?? '')
  if (!validAddress) errors.address = wallet.network === 'solana' ? 'Use um endereço Solana de 32 a 44 caracteres Base58.' : 'Use 0x seguido de 40 caracteres hexadecimais.'
  if (!['primary', 'secondary'].includes(wallet.kind)) errors.kind = 'Escolha principal ou secundária.'
  return errors
}

export function resolveSecondaryWallet(primary: Wallet | null, secondary: Wallet | null): Wallet | null {
  if (!secondary?.sameAsPrimary) return secondary
  if (!primary) return null
  return { ...primary, id: secondary.id, kind: 'secondary', sameAsPrimary: true }
}
