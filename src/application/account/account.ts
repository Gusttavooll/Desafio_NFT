import { useMutation, useQuery } from '@tanstack/react-query'
import { toSessionToken } from '@/domain/account'
import { scopedQueryKey } from '@/application/shared'
import { queryClient } from '@/application/query-client'
import { changePassword, getProfile, loginRequest, logoutRequest, registerRequest, updateAvatar, updateProfile, type CollectorDto, type LoginBody, type RegisterBody, type SessionDto } from '@/infrastructure/account'
import { getSessionStore } from './session'
import { useSession } from './use-session'
import { createAuthenticationFlow, executeOwnedRequest, sameAccountSession, type AccountSessionIdentity } from './request-guards'

const authentication = createAuthenticationFlow()
export function captureAccountSession(): AccountSessionIdentity {
  const store = getSessionStore()
  const state = store.getState()
  return { owner: state.status === 'collector' ? state.collector.id : null, token: store.getToken() }
}
export function isCurrentAccountSession(identity: AccountSessionIdentity) { return sameAccountSession(identity, captureAccountSession()) }

function acceptSession(dto: SessionDto) {
  getSessionStore().startSession({ token: toSessionToken(dto.token), collector: { id: dto.collector.id, displayName: dto.collector.displayName, username: dto.collector.username, avatarUrl: dto.collector.avatarUrl ?? null } })
  queryClient.setQueryData(scopedQueryKey(dto.collector.id, 'profile'), dto.collector)
  return dto.collector
}
export async function login(body: LoginBody, signal?: AbortSignal) { return authentication.run(requestSignal => loginRequest(body, requestSignal), acceptSession, signal) }
export async function register(body: RegisterBody, signal?: AbortSignal) { return authentication.run(requestSignal => registerRequest(body, requestSignal), acceptSession, signal) }
export async function logout() {
  authentication.cancel()
  const store = getSessionStore()
  const token = store.getToken()
  store.endSession()
  await logoutRequest(token)
}
export function useProfile() {
  const session = useSession()
  return useQuery({ queryKey: scopedQueryKey(session.userId, 'profile'), queryFn: ({ signal }) => getProfile(signal), enabled: session.status === 'collector', retry: false })
}
function acceptProfile(profile: CollectorDto, identity: AccountSessionIdentity) {
  const store = getSessionStore()
  const state = store.getState()
  const token = store.getToken()
  if (state.status !== 'collector' || state.collector.id !== profile.id || !token || !isCurrentAccountSession(identity)) return
  store.startSession({ token, collector: { id: profile.id, displayName: profile.displayName, username: profile.username, avatarUrl: profile.avatarUrl ?? null } })
  queryClient.setQueryData(scopedQueryKey(profile.id, 'profile'), profile)
}
function useOwnedMutation<TBody, TResult>(request: (body: TBody, signal: AbortSignal) => Promise<TResult>, accept?: (result: TResult, identity: AccountSessionIdentity) => void) {
  const mutation = useMutation({
    gcTime: 0,
    mutationFn: ({ body, identity }: { body: TBody; identity: AccountSessionIdentity }) => executeOwnedRequest(identity, captureAccountSession, getSessionStore().subscribe, signal => request(body, signal)),
    onSuccess: (result, { identity }) => { if (isCurrentAccountSession(identity)) accept?.(result, identity) },
  })
  return { ...mutation,
    mutateAsync: (body: TBody) => mutation.mutateAsync({ body, identity: captureAccountSession() }),
    mutate: (body: TBody) => mutation.mutate({ body, identity: captureAccountSession() }),
  }
}
export function useUpdateProfile() { return useOwnedMutation(updateProfile, acceptProfile) }
export function useUpdateAvatar() { return useOwnedMutation(updateAvatar, acceptProfile) }
export function useChangePassword() { return useOwnedMutation(changePassword) }
