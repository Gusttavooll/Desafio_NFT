// API pública: Carteiras. Outros contextos importam só daqui.
export type { Network, PrimaryWallet, Wallet, WalletKind, WalletType } from './wallet'
export { validateWallet, resolveSecondaryWallet, type WalletFields, type WalletErrors } from './validation'
