import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { toSessionToken, type SessionToken } from '@/domain/account'
import type { ApiError } from '@/domain/shared'
import { installSessionInterceptors } from './http-client'

type Reply = { status: number; data: unknown }

// Adapter falso: responde sem rede e registra o header de autorização de cada requisição.
function fakeApi(reply: (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>) {
  const authorizations: Array<string | undefined> = []
  const adapter: AxiosAdapter = async (config) => {
    authorizations.push(config.headers.get('Authorization')?.toString())
    const { status, data } = await reply(config)
    const response = { status, data, statusText: '', headers: {}, config }
    if (status >= 400) throw new AxiosError('falha', AxiosError.ERR_BAD_REQUEST, config, null, response)
    return response
  }
  return { client: axios.create({ adapter }), authorizations }
}

function apiError(code: ApiError['code']): ApiError {
  return { code, message: code }
}

function setup(reply: (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>, initialToken: SessionToken | null = null) {
  const api = fakeApi(reply)
  let token = initialToken
  const onSessionExpired = vi.fn()
  installSessionInterceptors(api.client, { getToken: () => token, onSessionExpired })
  return { ...api, onSessionExpired, setToken: (next: SessionToken | null) => (token = next) }
}

describe('installSessionInterceptors', () => {
  it('envia o token de Sessão em toda requisição', async () => {
    const { client, authorizations } = setup(() => ({ status: 200, data: {} }), toSessionToken('token-1'))
    await client.get('/nfts')
    await client.get('/cart')
    expect(authorizations).toEqual(['Bearer token-1', 'Bearer token-1'])
  })

  it('não envia autorização para o Visitante', async () => {
    const { client, authorizations } = setup(() => ({ status: 200, data: {} }))
    await client.get('/nfts')
    expect(authorizations).toEqual([undefined])
  })

  it('preserva o token explícito do logout mesmo se outra sessão começar antes do envio', async () => {
    const { client, authorizations, setToken } = setup(() => ({ status: 204, data: null }), toSessionToken('token-a'))
    const logout = client.post('/auth/logout', undefined, { headers: { Authorization: 'Bearer token-a' } })
    setToken(toSessionToken('token-b'))
    await logout
    await client.get('/me')
    expect(authorizations).toEqual(['Bearer token-a', 'Bearer token-b'])
  })

  it('avisa a aplicação quando a Sessão expira', async () => {
    const { client, onSessionExpired } = setup(
      () => ({ status: 401, data: apiError('session_expired') }),
      toSessionToken('token-1'),
    )
    await expect(client.get('/me')).rejects.toBeInstanceOf(AxiosError)
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('avisa uma única vez quando várias requisições expiram juntas', async () => {
    const { client, onSessionExpired } = setup(
      () => ({ status: 401, data: apiError('session_expired') }),
      toSessionToken('token-1'),
    )
    await Promise.allSettled([client.get('/me'), client.get('/cart'), client.get('/favorites')])
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('avisa de novo quando a Sessão seguinte também expira', async () => {
    const { client, onSessionExpired, setToken } = setup(
      () => ({ status: 401, data: apiError('session_expired') }),
      toSessionToken('token-1'),
    )
    await client.get('/me').catch(() => undefined)
    setToken(toSessionToken('token-2'))
    await client.get('/me').catch(() => undefined)
    expect(onSessionExpired).toHaveBeenCalledTimes(2)
  })

  it.each(['token-novo', null])('ignora 401 atrasado da sessão anterior quando o token atual é %s', async (nextToken) => {
    let started!: () => void
    let finish!: (reply: Reply) => void
    const dispatched = new Promise<void>(resolve => { started = resolve })
    const pending = new Promise<Reply>(resolve => { finish = resolve })
    const { client, authorizations, onSessionExpired, setToken } = setup(() => { started(); return pending }, toSessionToken('token-antigo'))
    const oldRequest = expect(client.get('/me')).rejects.toBeInstanceOf(AxiosError)
    await dispatched
    expect(authorizations).toEqual(['Bearer token-antigo'])
    setToken(nextToken === null ? null : toSessionToken(nextToken))
    finish({ status: 401, data: apiError('session_expired') })
    await oldRequest
    expect(onSessionExpired).not.toHaveBeenCalled()
    if (nextToken !== null) {
      await expect(client.get('/me')).rejects.toBeInstanceOf(AxiosError)
      expect(onSessionExpired).toHaveBeenCalledTimes(1)
    }
  })

  it.each([
    { status: 401, code: 'forbidden' as const },
    { status: 403, code: 'forbidden' as const },
    { status: 503, code: 'unavailable' as const },
  ])('não trata $status $code como expiração', async ({ status, code }) => {
    const { client, onSessionExpired } = setup(() => ({ status, data: apiError(code) }), toSessionToken('token-1'))
    await expect(client.get('/me')).rejects.toBeInstanceOf(AxiosError)
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('repassa o erro de expiração para quem fez a requisição', async () => {
    const { client } = setup(() => ({ status: 401, data: apiError('session_expired') }), toSessionToken('token-1'))
    const error = await client.get('/me').catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(AxiosError)
    expect((error as AxiosError<ApiError>).response?.data.code).toBe('session_expired')
  })
})
