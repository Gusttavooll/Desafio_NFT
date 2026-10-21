import { isAxiosError, type AxiosInstance } from 'axios'
import type { Collector, SessionToken } from '@/domain/account'
import type { ApiError } from '@/domain/shared'

// Contrato de GET /auth/session (docs/architecture.md). Provisório até os contratos da Fase 0.
export interface CollectorDto {
  id: string
  displayName: string
  username: string
  avatarUrl: string | null
}

export interface SessionDto {
  collector: CollectorDto
}

function toCollector(dto: CollectorDto): Collector {
  return { id: dto.id, displayName: dto.displayName, username: dto.username, avatarUrl: dto.avatarUrl }
}

// O token vai explícito porque, ao recuperar a Sessão, ela ainda não foi iniciada no cliente.
export async function fetchSessionCollector(client: AxiosInstance, token: SessionToken): Promise<Collector | null> {
  try {
    const { data } = await client.get<SessionDto>('/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return toCollector(data.collector)
  } catch (error) {
    if (isAxiosError<ApiError>(error) && error.response?.status === 401) return null
    throw error
  }
}
