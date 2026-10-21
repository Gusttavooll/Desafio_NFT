// Token opaco que identifica a Sessão na API. Formato: ver docs/architecture.md, item 5 (ADR pendente).
export type SessionToken = string & { readonly __brand: 'SessionToken' }

// Dados básicos do Colecionador, suficientes para o header e para as query keys.
export interface Collector {
  id: string
  displayName: string
  username: string
  avatarUrl: string | null
}

// Autenticação ativa do Colecionador.
export interface Session {
  token: SessionToken
  collector: Collector
}

export interface SessionLoading {
  status: 'loading'
}

// Usuário sem Sessão.
export interface Guest {
  status: 'guest'
}

export interface CollectorSession {
  status: 'collector'
  collector: Collector
}

export type SessionState = SessionLoading | Guest | CollectorSession

export type SessionTransition = 'started' | 'ended' | 'switched'

export function toSessionToken(value: string): SessionToken {
  if (value.trim() === '') throw new Error('Token de Sessão vazio')
  return value as SessionToken
}

// Id usado em `scopedQueryKey`: null para o Visitante e enquanto a Sessão carrega.
export function sessionUserId(state: SessionState): string | null {
  return state.status === 'collector' ? state.collector.id : null
}

// Classifica a mudança de identidade entre dois estados; null quando ela não muda.
export function sessionTransition(previous: SessionState, next: SessionState): SessionTransition | null {
  const previousId = sessionUserId(previous)
  const nextId = sessionUserId(next)
  if (previousId === nextId) return null
  if (previousId === null) return 'started'
  if (nextId === null) return 'ended'
  return 'switched'
}
