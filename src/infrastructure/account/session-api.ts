import { isAxiosError, type AxiosInstance } from 'axios'
import type { Collector, SessionToken } from '@/domain/account'
import type { ApiError } from '@/domain/shared'
import type { CollectorDto, SessionDto } from './dto'

export type { CollectorDto, SessionDto } from './dto'

function toCollector(dto: CollectorDto): Collector {
  return { id: dto.id, displayName: dto.displayName, username: dto.username, avatarUrl: dto.avatarUrl ?? null }
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
