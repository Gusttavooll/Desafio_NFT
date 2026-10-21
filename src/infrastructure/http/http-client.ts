import axios, { isAxiosError, type AxiosError, type AxiosInstance } from 'axios'
import type { SessionToken } from '@/domain/account'
import type { ApiError } from '@/domain/shared'

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

export interface SessionInterceptorOptions {
  getToken: () => SessionToken | null
  // Chamado uma vez por token quando a API responde 401 `session_expired`.
  onSessionExpired: () => void
}

const BEARER_PREFIX = 'Bearer '

function isSessionExpired(error: unknown): error is AxiosError<ApiError> {
  if (!isAxiosError<ApiError>(error)) return false
  return error.response?.status === 401 && error.response.data?.code === 'session_expired'
}

// Envia o token de Sessão em toda requisição e avisa a aplicação quando ele expira.
// Recebe as dependências por parâmetro porque infrastructure não conhece a camada application.
export function installSessionInterceptors(client: AxiosInstance, options: SessionInterceptorOptions): () => void {
  // Requisições concorrentes que expiram com o mesmo token geram um único aviso.
  let lastExpiredAuthorization: string | null = null

  const requestId = client.interceptors.request.use((config) => {
    const token = options.getToken()
    if (token) config.headers.set('Authorization', `${BEARER_PREFIX}${token}`)
    return config
  })

  const responseId = client.interceptors.response.use(undefined, (error: unknown) => {
    if (isSessionExpired(error)) {
      const authorization = error.config?.headers.get('Authorization')?.toString() ?? null
      if (authorization !== null && authorization !== lastExpiredAuthorization) {
        lastExpiredAuthorization = authorization
        options.onSessionExpired()
      }
    }
    return Promise.reject(error)
  })

  return () => {
    client.interceptors.request.eject(requestId)
    client.interceptors.response.eject(responseId)
  }
}
