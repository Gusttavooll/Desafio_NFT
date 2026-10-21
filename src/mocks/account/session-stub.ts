import type { SessionDto } from '@/infrastructure/account'

// PROVISÓRIO até o mocks/core (estado simulado e fixtures) entrar no main.
// Para trocar: o handler de GET /auth/session passa a ler as Sessões do db do mocks/core
// e este arquivo é apagado. A assinatura do handler não muda.
export const stubSessions: Record<string, SessionDto> = {
  'stub-token-collector-1': {
    collector: { id: 'collector-1', displayName: 'Colecionador Um', username: 'colecionador1', avatarUrl: null },
  },
  'stub-token-collector-2': {
    collector: { id: 'collector-2', displayName: 'Colecionador Dois', username: 'colecionador2', avatarUrl: null },
  },
}
