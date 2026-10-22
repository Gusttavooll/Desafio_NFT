import { isAxiosError } from 'axios'
import { httpClient } from '@/infrastructure/http/http-client'
import type { ApiError } from '@/domain/shared'
import type { ChangePasswordBody, CollectorDto, LoginBody, RegisterBody, SessionDto, UpdateProfileBody } from './dto'

export const loginRequest = async (body: LoginBody, signal?: AbortSignal) => (await httpClient.post<SessionDto>('/auth/login', body, { signal })).data
export const registerRequest = async (body: RegisterBody, signal?: AbortSignal) => (await httpClient.post<SessionDto>('/auth/register', body, { signal })).data
export const logoutRequest = async (token?: string | null) => { await httpClient.post('/auth/logout', undefined, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined) }
export const getProfile = async (signal?: AbortSignal) => (await httpClient.get<CollectorDto>('/me', { signal })).data
export const updateProfile = async (body: UpdateProfileBody, signal?: AbortSignal) => (await httpClient.patch<CollectorDto>('/me', body, { signal })).data
export const updateAvatar = async (avatarUrl: string | null, signal?: AbortSignal) => (await httpClient.put<CollectorDto>('/me/avatar', { avatarUrl }, { signal })).data
export const changePassword = async (body: ChangePasswordBody, signal?: AbortSignal) => { await httpClient.post('/me/password', body, { signal }) }
export function accountApiError(error: unknown): { message: string; fields: Record<string, string> } {
  if (isAxiosError<ApiError>(error) && error.response?.data?.message) return {
    message: error.response.data.message,
    fields: Object.fromEntries(Object.entries(error.response.data.details ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string')),
  }
  return { message: 'Não foi possível concluir. Verifique a conexão e tente novamente.', fields: {} }
}
