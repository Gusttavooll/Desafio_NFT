// Contratos REST de Conta e Sessão (docs/architecture.md).

export interface CollectorDto {
  id: string
  displayName: string
  username: string
  email: string
  ensName?: string
  avatarUrl?: string | null
}

// POST /auth/register
export interface RegisterBody {
  displayName: string
  username: string
  email: string
  password: string
}

// POST /auth/login
export interface LoginBody {
  email: string
  password: string
}

// POST /auth/register, POST /auth/login e GET /auth/session
export interface SessionDto {
  // Token opaco; nunca contém a senha.
  token: string
  expiresAt: string
  collector: CollectorDto
}

// PATCH /me
export type UpdateProfileBody = Partial<Pick<CollectorDto, 'displayName' | 'username' | 'email' | 'ensName'>>

// POST /me/password
export interface ChangePasswordBody {
  currentPassword: string
  newPassword: string
}
