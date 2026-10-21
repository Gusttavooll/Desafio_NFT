// API pública: Pedidos. Outros contextos importam só daqui.
import { scopedQueryKey } from '@/application/shared'

export const orderQueryKeys = {
  detail: (userId: string | null, orderId: string) => scopedQueryKey(userId, 'orders', orderId),
}
