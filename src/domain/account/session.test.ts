import { describe, expect, it } from 'vitest'
import { sessionTransition, sessionUserId, type Collector, type SessionState } from './session'

function collector(id: string): Collector {
  return { id, displayName: `Colecionador ${id}`, username: id, avatarUrl: null }
}

const loading: SessionState = { status: 'loading' }
const guest: SessionState = { status: 'guest' }
const collectorA: SessionState = { status: 'collector', collector: collector('user-a') }
const collectorB: SessionState = { status: 'collector', collector: collector('user-b') }

describe('sessionUserId', () => {
  it('usa o id do colecionador', () => {
    expect(sessionUserId(collectorA)).toBe('user-a')
  })

  it('devolve null para o visitante', () => {
    expect(sessionUserId(guest)).toBeNull()
  })

  it('devolve null enquanto a sessão carrega', () => {
    expect(sessionUserId(loading)).toBeNull()
  })
})

describe('sessionTransition', () => {
  it('visitante que entra inicia a sessão', () => {
    expect(sessionTransition(guest, collectorA)).toBe('started')
  })

  it('sessão recuperada ao carregar também inicia a sessão', () => {
    expect(sessionTransition(loading, collectorA)).toBe('started')
  })

  it('colecionador que sai encerra a sessão', () => {
    expect(sessionTransition(collectorA, guest)).toBe('ended')
  })

  it('outro colecionador no mesmo navegador troca a sessão', () => {
    expect(sessionTransition(collectorA, collectorB)).toBe('switched')
  })

  it('o mesmo colecionador não muda a sessão', () => {
    expect(sessionTransition(collectorA, { status: 'collector', collector: collector('user-a') })).toBeNull()
  })

  it('carregar e virar visitante não muda a sessão', () => {
    expect(sessionTransition(loading, guest)).toBeNull()
  })

  it('visitante que continua visitante não muda a sessão', () => {
    expect(sessionTransition(guest, guest)).toBeNull()
  })
})
