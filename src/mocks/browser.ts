import { setupWorker } from 'msw/browser'
import { getSimulation, installMockControl } from './core'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// O controle dos mocks só existe quando a simulação está ativa (este módulo só é carregado com mocks ligados).
installMockControl(getSimulation())
