import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getSessionToken, onSessionEnded, useSession } from '@/application/account'
import { scopedQueryKey } from '@/application/shared'
import { getWallets, saveWallet } from '@/infrastructure/wallets'
import type { CreateWalletBody } from '@/infrastructure/wallets'
import type { ApiError } from '@/domain/shared'

export { validateWallet, type WalletFields, type WalletErrors } from '@/domain/wallets'
export { walletDraft } from '@/infrastructure/wallets'
export const walletQueryKeys = { all: (userId: string | null) => scopedQueryKey(userId, 'wallets') }
export function useWallets() {
  const session = useSession()
  return useQuery({ queryKey: walletQueryKeys.all(session.userId), queryFn: ({ signal }) => getWallets(signal), enabled: session.status === 'collector', retry: false })
}
export function useSaveWallet() {
  const session = useSession()
  const client = useQueryClient()
  return useMutation({ mutationFn: async ({ body, id }: { body: CreateWalletBody; id?: string }) => {
    const token = getSessionToken()
    if (!token) throw new Error('Entre novamente para salvar sua carteira.')
    const controller = new AbortController()
    const stop = onSessionEnded(() => controller.abort())
    try {
      const result = await saveWallet(body, id, controller.signal)
      if (controller.signal.aborted || getSessionToken() !== token) throw new Error('A sessão mudou. Revise os dados na conta atual.')
      return result
    } finally { stop() }
  }, retry: false, onSuccess: () => client.invalidateQueries({ queryKey: walletQueryKeys.all(session.userId) }) })
}
export function walletApiError(error: unknown): { message: string; fields: Record<string, string> } {
  if (isAxiosError<ApiError>(error)) return { message: error.response?.data.message ?? 'Não foi possível salvar. Seus dados foram preservados; tente novamente.', fields: Object.fromEntries(Object.entries(error.response?.data.details ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) }
  return { message: error instanceof Error ? error.message : 'Não foi possível carregar suas carteiras.', fields: {} }
}
