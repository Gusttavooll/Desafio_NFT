export interface AccountSessionIdentity { owner: string | null; token: string | null }
export function sameAccountSession(expected: AccountSessionIdentity, current: AccountSessionIdentity) {
  return expected.owner !== null && expected.token !== null && expected.owner === current.owner && expected.token === current.token
}
const sessionChanged = () => new Error('A sessão mudou. Refaça a operação na conta atual.')

// A identidade é capturada antes de qualquer preparação assíncrona e preservada até a resposta.
export async function executeOwnedRequest<T>(identity: AccountSessionIdentity, read: () => AccountSessionIdentity, subscribe: (listener: () => void) => () => void, request: (signal: AbortSignal) => Promise<T>): Promise<T> {
  if (!sameAccountSession(identity, read())) throw sessionChanged()
  const controller = new AbortController()
  const unsubscribe = subscribe(() => { if (!sameAccountSession(identity, read())) controller.abort() })
  try {
    const result = await request(controller.signal)
    if (controller.signal.aborted || !sameAccountSession(identity, read())) throw sessionChanged()
    return result
  } catch (error) {
    if (controller.signal.aborted) throw sessionChanged()
    throw error
  } finally { unsubscribe() }
}

export function createAuthenticationFlow() {
  let generation = 0
  let active: AbortController | undefined
  const cancel = () => { generation++; active?.abort(); active = undefined }
  return {
    cancel,
    async run<T, TResult>(request: (signal: AbortSignal) => Promise<T>, accept: (value: T) => TResult, signal?: AbortSignal): Promise<TResult> {
      cancel()
      const current = generation
      const controller = new AbortController()
      active = controller
      const abort = () => controller.abort()
      signal?.addEventListener('abort', abort, { once: true })
      try {
        if (signal?.aborted) controller.abort()
        if (controller.signal.aborted) throw new Error('Autenticação cancelada.')
        const result = await request(controller.signal)
        if (current !== generation || controller.signal.aborted) throw new Error('Autenticação cancelada.')
        return accept(result)
      } finally {
        signal?.removeEventListener('abort', abort)
        if (active === controller) active = undefined
      }
    },
  }
}
