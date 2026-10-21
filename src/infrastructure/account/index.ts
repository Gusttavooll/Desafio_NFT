// API pública: Conta e Sessão. Outros contextos importam só daqui.
export type {
  ChangePasswordBody,
  CollectorDto,
  LoginBody,
  RegisterBody,
  SessionDto,
  UpdateProfileBody,
} from './dto'
export { fetchSessionCollector } from './session-api'
export {
  createSessionTokenStorage,
  type KeyValueStorage,
  type SessionTokenStorage,
} from './session-token-storage'
export { accountApiError, changePassword, getProfile, loginRequest, logoutRequest, registerRequest, updateAvatar, updateProfile } from './account-api'
