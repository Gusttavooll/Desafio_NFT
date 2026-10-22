// API pública: Conta e Sessão. Outros contextos importam só daqui.
export {
  sessionTransition,
  sessionUserId,
  toSessionToken,
  type Collector,
  type CollectorSession,
  type Guest,
  type Session,
  type SessionLoading,
  type SessionState,
  type SessionToken,
  type SessionTransition,
} from './session'
export { safeReturnTo, safeAuthCancelPath, validateAvatar, validatePasswordChange, validateProfile, validateRegistration, passwordError, type AccountFields, type ProfileInput, type RegistrationInput } from './validation'
