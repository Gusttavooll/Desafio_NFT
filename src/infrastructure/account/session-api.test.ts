import axios, { AxiosError, type AxiosAdapter } from 'axios'
import { describe, expect, it } from 'vitest'
import { toSessionToken } from '@/domain/account'
import { fetchSessionCollector, type SessionDto } from './session-api'

function fakeClient(status: number, data: unknown) {
  const requests: Array<{ url?: string; authorization?: string }> = []
  const adapter: AxiosAdapter = async (config) => {
    requests.push({ url: config.url, authorization: config.headers.get('Authorization')?.toString() })
    const response = { status, data, statusText: '', headers: {}, config }
    if (status >= 400) throw new AxiosError('falha', AxiosError.ERR_BAD_REQUEST, config, null, response)
    return response
  }
  return { client: axios.create({ adapter }), requests }
}

const dto: SessionDto = {
  collector: { id: 'user-a', displayName: 'Ana', username: 'ana', avatarUrl: null },
}

describe('fetchSessionCollector', () => {
  it('consulta GET /auth/session com o token e devolve o Colecionador', async () => {
    const { client, requests } = fakeClient(200, dto)

    const collector = await fetchSessionCollector(client, toSessionToken('token-a'))

    expect(collector).toEqual(dto.collector)
    expect(requests).toEqual([{ url: '/auth/session', authorization: 'Bearer token-a' }])
  })

  it('devolve null quando a Sessão expirou', async () => {
    const { client } = fakeClient(401, { code: 'session_expired', message: 'Sessão expirada' })
    expect(await fetchSessionCollector(client, toSessionToken('token-a'))).toBeNull()
  })

  it('propaga falhas transitórias', async () => {
    const { client } = fakeClient(503, { code: 'unavailable', message: 'Tente novamente' })
    await expect(fetchSessionCollector(client, toSessionToken('token-a'))).rejects.toBeInstanceOf(AxiosError)
  })
})
