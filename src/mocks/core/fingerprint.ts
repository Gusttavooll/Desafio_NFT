// Impressão estável do conteúdo de um Pedido, usada na idempotência (mesma chave, mesmo conteúdo).
// Não é criptográfica: só detecta conteúdo diferente sob a mesma chave.
function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

// FNV-1a de 32 bits sobre a forma canônica.
export function contentFingerprint(value: unknown): string {
  const text = canonicalize(value)
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `${hash.toString(16).padStart(8, '0')}:${text.length}`
}
