import type { Network } from '@/domain/wallets'
import type { CollectorDto } from '@/infrastructure/account'
import type { NftDto } from '@/infrastructure/catalog'
import type { CartItemDto } from '@/infrastructure/cart'
import type { OrderDto } from '@/infrastructure/orders'
import type { WalletDto } from '@/infrastructure/wallets'
import type { ScenarioName } from './scenario'

// Estado simulado único: fonte de verdade de REST e de Eventos. Usa os mesmos DTOs dos contratos.

export interface StoredCollector extends CollectorDto {
  // Senha só como hash SHA-256 com salt por usuário.
  salt: string
  passwordHash: string
}

export interface StoredSession {
  token: string
  collectorId: string
  expiresAt: string
}

export interface StoredOrder {
  dto: OrderDto
  collectorId: string
  idempotencyKey: string
  // Impressão do conteúdo enviado, para detectar `idempotency_conflict`.
  fingerprint: string
  outcome: 'confirmed' | 'rejected'
  // Momento em que o Pedido pendente passa ao estado terminal.
  settleAt: string
}

export interface StoredCoupon {
  code: string
  percentOff: number
  expiresAt: string
}

export interface SimState {
  nfts: NftDto[]
  collectors: StoredCollector[]
  sessions: StoredSession[]
  // Chaves por id do Colecionador.
  favorites: Record<string, string[]>
  // Chave `guest` para o Carrinho de Visitante; senão, id do Colecionador.
  carts: Record<string, CartItemDto[]>
  wallets: Record<string, WalletDto[]>
  orders: StoredOrder[]
  coupons: StoredCoupon[]
  networkFees: Record<Network, string>
  // Versão por recurso (`nft:<id>`, `order:<id>`), a mesma dos eventos e da REST.
  versions: Record<string, number>
}

export interface PersistedSimulation {
  scenario: ScenarioName
  state: SimState
}
