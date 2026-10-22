import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSessionToken, useSession } from '@/application/account'
import { scopedQueryKey } from '@/application/shared'
import { getFavorites, setFavorite } from '@/infrastructure/catalog'

export function useFavorites() {
  const session = useSession()
  const client = useQueryClient()
  const key = scopedQueryKey(session.userId, 'favorites')
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => getFavorites(signal), enabled: session.status === 'collector', retry: 1 })
  const mutation = useMutation({
    mutationFn: ({ nftId, selected, token }: { nftId: string; selected: boolean; token: ReturnType<typeof getSessionToken> }) => {
      if (!token || token !== getSessionToken()) throw new Error('A sessão mudou. Entre novamente.')
      return setFavorite(nftId, selected)
    },
    scope: { id: `favorites:${session.userId}` },
    onMutate: async ({ nftId, selected, token }) => {
      await client.cancelQueries({ queryKey: key })
      if (!token || token !== getSessionToken()) return
      const previous = client.getQueryData<string[]>(key)
      client.setQueryData<string[]>(key, current => selected ? [...new Set([...(current ?? []), nftId])] : (current ?? []).filter(id => id !== nftId))
      return { previous }
    },
    onError: (_error, variables, context) => { if (variables.token === getSessionToken()) client.setQueryData(key, context?.previous ?? []) },
    onSettled: (_data, _error, variables) => variables.token === getSessionToken() ? client.invalidateQueries({ queryKey: key }) : undefined,
  })
  return { ...query, nftIds: session.status === 'collector' ? query.data ?? [] : [], setFavorite: (input: { nftId: string; selected: boolean }) => mutation.mutateAsync({ ...input, token: getSessionToken() }), isPending: mutation.isPending, mutationError: mutation.error }
}
