import { QueryClient } from '@tanstack/react-query'

// Política de cache e retries ainda não definida (decisão pendente em docs/architecture.md).
export const queryClient = new QueryClient()
