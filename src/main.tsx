import './index.css'
import './ui/layout/market.css'

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD })
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root não encontrado')

// Download the application and simulation together; requests start only after MSW is ready.
const [{ mountApp }] = await Promise.all([import('./app'), enableMocking()])
mountApp(rootElement)
