import type { WalletDto } from '@/infrastructure/wallets'
import type { SimState, StoredCollector } from '../state'
import { createNftFixtures } from './nfts'

export { COLLECTIONS, createNftFixtures, formatMilliEth, NFT_IMAGE_VARIANTS, nftSlug } from './nfts'

// Credenciais fictícias documentadas no README. Só o hash fica nas Fixtures.
export const COLLECTOR_CREDENTIALS = [
  { email: 'ana@kronos.test', password: 'Colecionador#1' },
  { email: 'bruno@kronos.test', password: 'Colecionador#2' },
] as const

export const COLLECTORS: StoredCollector[] = [
  {
    id: 'collector-ana',
    displayName: 'Ana Prado',
    username: 'ana.prado',
    email: 'ana@kronos.test',
    ensName: 'ana.eth',
    salt: 'salt-ana-kronos',
    passwordHash: '84854703017c305c44e6ba95a4f2e9a103ff4c3968e202c585e43ce1d1402e14',
  },
  {
    id: 'collector-bruno',
    displayName: 'Bruno Leal',
    username: 'bruno.leal',
    email: 'bruno@kronos.test',
    salt: 'salt-bruno-kronos',
    passwordHash: '5d9210e8b82cf59efc797f99c63d105fd5b7b983f7ed6ff4f60e06d2893e3134',
  },
]

// Ana já tem Carteira principal; Bruno começa sem Carteiras (estado vazio e isolamento).
const ANA_PRIMARY_WALLET: WalletDto = {
  id: 'wallet-ana-primary',
  kind: 'primary',
  address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  network: 'ethereum',
  type: 'metamask',
  nickname: 'Principal',
  displayName: 'Ana Prado',
  username: 'ana.prado',
  email: 'ana@kronos.test',
  ensName: 'ana.eth',
}

export const COUPON_VALID = 'KRONOS10'
export const COUPON_EXPIRED = 'EXPIRADO5'

// Estado inicial conhecido; o reset sempre volta para ele.
export function createInitialState(): SimState {
  const nfts = createNftFixtures()
  return {
    nfts,
    collectors: COLLECTORS.map((c) => ({ ...c })),
    sessions: [],
    favorites: {},
    carts: {},
    wallets: { 'collector-ana': [{ ...ANA_PRIMARY_WALLET }] },
    orders: [],
    coupons: [
      { code: COUPON_VALID, percentOff: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
      { code: COUPON_EXPIRED, percentOff: 5, expiresAt: '2020-01-01T00:00:00.000Z' },
    ],
    // Uma Taxa de rede por Rede, em ETH.
    networkFees: { ethereum: '0.0021', polygon: '0.0004', solana: '0.0001' },
    versions: Object.fromEntries(nfts.map((n) => [`nft:${n.id}`, n.version])),
  }
}
