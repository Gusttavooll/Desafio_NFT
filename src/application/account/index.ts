// API pública: Conta e Sessão. Outros contextos importam só daqui.
export { getSessionToken, onSessionEnded, onSessionExpired, onSessionStarted } from './session'
export type { SessionEnded } from './session-store'
export { useSession, type UseSessionResult } from './use-session'
