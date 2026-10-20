import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root não encontrado')

createRoot(rootElement).render(
  <StrictMode>
    <h1>Desafio NFT</h1>
  </StrictMode>,
)
