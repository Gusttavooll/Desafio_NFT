// API pública: Conta e Sessão. Outros contextos importam só daqui.
export { getSessionToken, onSessionEnded, onSessionExpired, onSessionStarted } from './session'
export type { SessionEnded } from './session-store'
export { useSession, type UseSessionResult } from './use-session'
export { login, logout, register, useProfile, useUpdateProfile, useUpdateAvatar, useChangePassword, captureAccountSession, isCurrentAccountSession } from './account'
export { safeReturnTo, safeAuthCancelPath, validateAvatar, validatePasswordChange, validateProfile, validateRegistration, type AccountFields } from '@/domain/account'
export { accountApiError, type CollectorDto as CollectorProfile } from '@/infrastructure/account'
