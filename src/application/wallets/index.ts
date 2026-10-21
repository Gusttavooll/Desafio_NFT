// API pública: Carteiras. Outros contextos importam só daqui.
import { scopedQueryKey } from '@/application/shared'

export const walletQueryKeys = {
  all: (userId: string | null) => scopedQueryKey(userId, 'wallets'),
}
