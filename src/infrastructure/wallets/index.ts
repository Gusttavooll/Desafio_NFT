// API pública: Carteiras. Outros contextos importam só daqui.
export type { CreateWalletBody, UpdateWalletBody, WalletDto, WalletsResponse } from './dto'
export { getWallets, saveWallet, walletDraft } from './wallets-api'
