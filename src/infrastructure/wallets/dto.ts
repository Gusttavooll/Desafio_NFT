import type { Network, WalletKind, WalletType } from '@/domain/wallets'

// Contratos REST de Carteiras (docs/architecture.md).

export interface WalletDto {
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
  // Só para a secundária: usa os mesmos dados da principal.
  sameAsPrimary?: boolean
}

// GET /wallets
export interface WalletsResponse {
  primary: WalletDto | null
  secondary: WalletDto | null
}

// POST /wallets
export type CreateWalletBody = Omit<WalletDto, 'id'>

// PATCH /wallets/:id
export type UpdateWalletBody = Partial<Omit<WalletDto, 'id' | 'kind'>>
