// Senha da simulação: SHA-256 com salt por usuário (Web Crypto), nunca em claro.
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', data)))
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  return (await hashPassword(password, salt)) === expectedHash
}

function randomHex(byteLength: number): string {
  return toHex(crypto.getRandomValues(new Uint8Array(byteLength)))
}

// Token de Sessão opaco e aleatório.
export const generateToken = () => randomHex(32)

export const generateSalt = () => randomHex(16)
