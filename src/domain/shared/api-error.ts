// Envelope único de erro da API (docs/architecture.md, "Erros representados").
export type ApiErrorCode =
  | 'validation_error'
  | 'session_expired'
  | 'forbidden'
  | 'not_found'
  | 'availability_conflict'
  | 'price_changed'
  | 'idempotency_conflict'
  | 'unavailable'

export interface ApiError {
  code: ApiErrorCode
  message: string
  details?: Record<string, unknown>
}
