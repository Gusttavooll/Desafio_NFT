import { describe, expect, it } from 'vitest'
import { toSessionToken, type Session, type SessionToken } from '@/domain/account'
import type { SessionEnded } from '@/application/account'
import { bindConnectionToSession, type RealtimeConnection } from './session-socket-binding'

function session(id: string): Session {
  return {
    token: toSessionToken(`token-${id}`),
    collector: { id, displayName: id, username: id, avatarUrl: null },
  }
}

// Conexão falsa: registra a sequência de conexões e com qual identidade.
function fakeConnection() {
  const log: string[] = []
  const connection: RealtimeConnection = {
    connect: (token) => log.push(token ? `connect:${token}` : 'connect:guest'),
    disconnect: () => log.push('disconnect'),
  }
  return { connection, log }
}

function fakeSession(token: SessionToken | null = null) {
  const started = new Set<(session: Session) => void>()
  const ended = new Set<(event: SessionEnded) => void>()
  return {
    lifecycle: {
      getSessionToken: () => token,
      onSessionStarted: (listener: (session: Session) => void) => {
        started.add(listener)
        return () => void started.delete(listener)
      },
      onSessionEnded: (listener: (event: SessionEnded) => void) => {
        ended.add(listener)
        return () => void ended.delete(listener)
      },
    },
    start: (next: Session) => started.forEach((listener) => listener(next)),
    end: (event: SessionEnded) => ended.forEach((listener) => listener(event)),
  }
}

describe('bindConnectionToSession', () => {
  it('conecta como Visitante na inicialização', () => {
    const { connection, log } = fakeConnection()
    bindConnectionToSession(connection, fakeSession().lifecycle)
    expect(log).toEqual(['connect:guest'])
  })

  it('conecta com a identidade do Colecionador se a Sessão já existe', () => {
    const { connection, log } = fakeConnection()
    bindConnectionToSession(connection, fakeSession(toSessionToken('token-a')).lifecycle)
    expect(log).toEqual(['connect:token-a'])
  })

  it('refaz a conexão com a identidade do Colecionador ao iniciar a Sessão', () => {
    const { connection, log } = fakeConnection()
    const fake = fakeSession()
    bindConnectionToSession(connection, fake.lifecycle)

    fake.start(session('user-a'))

    expect(log).toEqual(['connect:guest', 'disconnect', 'connect:token-user-a'])
  })

  it('fecha a conexão do Colecionador no logout e volta a conectar como Visitante', () => {
    const { connection, log } = fakeConnection()
    const fake = fakeSession(toSessionToken('token-a'))
    bindConnectionToSession(connection, fake.lifecycle)

    fake.end({ transition: 'ended' })

    expect(log).toEqual(['connect:token-a', 'disconnect', 'connect:guest'])
  })

  it('na troca de Colecionador, nunca reconecta com a identidade anterior', () => {
    const { connection, log } = fakeConnection()
    const fake = fakeSession(toSessionToken('token-a'))
    bindConnectionToSession(connection, fake.lifecycle)

    fake.end({ transition: 'switched' })
    fake.start(session('user-b'))

    expect(log).toEqual(['connect:token-a', 'disconnect', 'disconnect', 'connect:token-user-b'])
  })

  it('ao desmontar, fecha a conexão e para de ouvir a Sessão', () => {
    const { connection, log } = fakeConnection()
    const fake = fakeSession()
    const unbind = bindConnectionToSession(connection, fake.lifecycle)

    unbind()
    fake.start(session('user-a'))

    expect(log).toEqual(['connect:guest', 'disconnect'])
  })
})
