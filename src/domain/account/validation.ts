export type AccountFields = Record<string, string>
export interface ProfileInput { displayName: string; username: string; email: string; ensName?: string }
export interface RegistrationInput extends ProfileInput { password: string; confirmation?: string }

export function validateProfile(input: ProfileInput): AccountFields {
  const errors: AccountFields = {}
  if (input.displayName.trim().length < 2 || input.displayName.trim().length > 80) errors.displayName = 'Informe um nome de exibição de 2 a 80 caracteres.'
  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(input.username.trim())) errors.username = 'Use de 3 a 30 letras, números, pontos, hífens ou sublinhados.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) || input.email.length > 254) errors.email = 'Informe um e-mail válido.'
  if (input.ensName && (input.ensName.length > 80 || !/^[a-zA-Z0-9.-]+\.eth$/.test(input.ensName.trim()))) errors.ensName = 'Informe um nome ENS terminado em .eth ou deixe vazio.'
  return errors
}

export function passwordError(password: string): string | null {
  return password.length < 8 || password.length > 128 ? 'Use uma senha com 8 a 128 caracteres.' : null
}

export function validateRegistration(input: RegistrationInput): AccountFields {
  const errors = validateProfile(input)
  const password = passwordError(input.password)
  if (password) errors.password = password
  if (input.confirmation !== undefined && input.confirmation !== input.password) errors.confirmation = 'As senhas não coincidem.'
  return errors
}

export function validatePasswordChange(input: { currentPassword: string; newPassword: string; confirmation?: string }): AccountFields {
  const errors: AccountFields = {}
  if (!input.currentPassword) errors.currentPassword = 'Informe a senha atual.'
  const password = passwordError(input.newPassword)
  if (password) errors.newPassword = password
  if (input.confirmation !== undefined && input.confirmation !== input.newPassword) errors.confirmation = 'As senhas não coincidem.'
  return errors
}

export function validateAvatar(file: { type: string; size: number }): string | null {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return 'Use uma imagem PNG, JPG ou WebP.'
  if (file.size < 1 || file.size > 2 * 1024 * 1024) return 'A imagem deve ter no máximo 2 MB.'
  return null
}

// Só navegação interna; rejeita barras/controles também quando percent-encoded.
export function safeReturnTo(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.length > 2048) return fallback
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('//') || decoded.includes('\\') || [...decoded].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return fallback
    const parsed = new URL(value, 'https://kronos.local')
    if (parsed.origin !== 'https://kronos.local' || ['/login', '/register'].includes(parsed.pathname.replace(/\/$/, ''))) return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch { return fallback }
}

// Cancelamento volta a uma página pública; o destino privado continua reservado
// para o login bem-sucedido, sem reabrir o modal por causa da guarda da rota.
export function safeAuthCancelPath(value: unknown): string {
  const returnTo = safeReturnTo(value)
  const pathname = decodeURIComponent(new URL(returnTo, 'https://kronos.local').pathname).replace(/\/+$/, '')
  return pathname === '/profile' || pathname === '/wallets' || pathname === '/checkout' || pathname.startsWith('/checkout/') ? '/' : returnTo
}
