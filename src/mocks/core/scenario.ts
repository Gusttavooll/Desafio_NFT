// Cenários: configuração declarativa que se combina com as Fixtures, nunca as substitui.
export const SCENARIO_NAMES = [
  'success',
  'empty',
  'slow',
  'out-of-order',
  'network-error',
  'server-error',
  'session-expired',
  'register-conflict',
  'coupon-invalid',
  'coupon-expired',
  'price-changed',
  'edition-sold-out',
  'order-timeout',
  'payment-confirmed',
  'payment-rejected',
] as const

export type ScenarioName = (typeof SCENARIO_NAMES)[number]

export const DEFAULT_SCENARIO: ScenarioName = 'success'

export function isScenarioName(value: string | null | undefined): value is ScenarioName {
  return value !== null && value !== undefined && (SCENARIO_NAMES as readonly string[]).includes(value)
}

// URL (`?scenario=`), depois o Cenário persistido, depois `success`.
export function resolveScenario(input: { search: string; persisted: string | null }): ScenarioName {
  const fromUrl = new URLSearchParams(input.search).get('scenario')
  if (isScenarioName(fromUrl)) return fromUrl
  if (isScenarioName(input.persisted)) return input.persisted
  return DEFAULT_SCENARIO
}

export interface ForcedResponse {
  status: number
  code: string
  message: string
}

// Comportamento do Pedido depois de criado.
export interface OrderBehavior {
  outcome: 'confirmed' | 'rejected'
  // Atraso determinístico entre `pending` e o estado terminal.
  settleDelayMs: number
  // Cria o Pedido, mas a resposta nunca chega ao cliente.
  dropCreateResponse: boolean
}

export interface ScenarioConfig {
  // Latência por requisição; `jitter` soma de 0 a `jitter` ms de forma determinística por rota.
  latency: { baseMs: number; jitterMs: number }
  // Respostas forçadas por chave `MÉTODO /rota` (ex.: `POST /orders`).
  forced: Record<string, ForcedResponse>
  // A consulta antiga responde depois da nova.
  outOfOrder: boolean
  // O Catálogo responde sem resultados.
  emptyCatalog: boolean
  // A rede falha (erro de conexão, sem resposta HTTP).
  networkError: boolean
  order: OrderBehavior
}

const base: ScenarioConfig = {
  latency: { baseMs: 120, jitterMs: 0 },
  forced: {},
  outOfOrder: false,
  emptyCatalog: false,
  networkError: false,
  order: { outcome: 'confirmed', settleDelayMs: 1500, dropCreateResponse: false },
}

export const SCENARIOS: Record<ScenarioName, ScenarioConfig> = {
  success: base,
  empty: { ...base, emptyCatalog: true },
  slow: { ...base, latency: { baseMs: 1200, jitterMs: 1800 } },
  'out-of-order': { ...base, outOfOrder: true },
  'network-error': { ...base, networkError: true },
  'server-error': {
    ...base,
    forced: { '*': { status: 503, code: 'unavailable', message: 'Serviço indisponível. Tente novamente.' } },
  },
  'session-expired': {
    ...base,
    forced: { '*': { status: 401, code: 'session_expired', message: 'Sua sessão expirou. Entre novamente.' } },
  },
  'register-conflict': {
    ...base,
    forced: {
      'POST /auth/register': { status: 422, code: 'validation_error', message: 'E-mail ou usuário já cadastrado.' },
    },
  },
  'coupon-invalid': { ...base },
  'coupon-expired': { ...base },
  'price-changed': {
    ...base,
    forced: {
      'POST /orders': { status: 409, code: 'price_changed', message: 'O preço mudou. Revise a cotação.' },
    },
  },
  'edition-sold-out': {
    ...base,
    forced: {
      'POST /orders': { status: 409, code: 'availability_conflict', message: 'Uma edição ficou esgotada.' },
    },
  },
  'order-timeout': { ...base, order: { ...base.order, dropCreateResponse: true } },
  'payment-confirmed': { ...base, order: { ...base.order, outcome: 'confirmed' } },
  'payment-rejected': { ...base, order: { ...base.order, outcome: 'rejected' } },
}
