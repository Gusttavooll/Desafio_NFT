// Rede blockchain simulada escolhida no pagamento e usada nas Fixtures.
export type Network = 'ethereum' | 'polygon' | 'solana'

export type WalletKind = 'primary' | 'secondary'

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'ledger'

export interface Wallet {
  id: string
  kind: WalletKind
  address: string
  network: Network
  type: WalletType
  nickname: string
  displayName: string
  username: string
  email: string
  ensName?: string
  sameAsPrimary?: boolean
}

// Carteira padrão do Colecionador no Checkout.
export type PrimaryWallet = Wallet & { kind: 'primary' }
