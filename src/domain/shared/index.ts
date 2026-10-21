// API pública: Shared kernel. Outros contextos importam só daqui.
export type { ApiError, ApiErrorCode } from './api-error'
export { isDomainEventApplicable, type DomainEvent, type DomainEventResource, type DomainEventState } from './domain-event'
export { isEthAmount, parseEthAmount, type EthAmount } from './eth-amount'
