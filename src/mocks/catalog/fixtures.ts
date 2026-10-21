import { parseEthAmount } from '@/domain/shared'
import type { Nft } from '@/domain/catalog'

// Obras demonstrativas reutilizadas do estudo local KRONOS; não são NFTs à venda.
export const nfts: Nft[] = [
  { id: 'k-001', title: 'Phase shift 001', image: '/assets/art-001.jpg', collection: 'generative', standard: 'ERC-721', price: parseEthAmount('0.420000000000000001'), description: 'Linhas em tensão. Um campo de movimento suspenso entre ordem e acaso.' },
  { id: 'k-002', title: 'Chromatic interval', image: '/assets/art-002.jpg', collection: 'geometry', standard: 'ERC-1155', price: parseEthAmount('0.18'), description: 'Cor e geometria em um estudo sobre ritmo, repetição e percepção.' },
  { id: 'k-003', title: 'Silent structure', image: '/assets/art-003.jpg', collection: 'geometry', standard: 'ERC-721', price: parseEthAmount('0.32'), description: 'O espaço entre as formas também faz parte da composição.' },
  { id: 'k-004', title: 'Field notes 004', image: '/assets/art-004.jpg', collection: 'generative', standard: 'ERC-1155', price: parseEthAmount('0.09'), description: 'Uma anotação visual sobre sistemas que nunca se repetem exatamente.' },
  { id: 'k-005', title: 'Temporal residue', image: '/assets/art-005.jpg', collection: 'generative', standard: 'ERC-721', price: parseEthAmount('0.56'), description: 'Marcas, camadas e vestígios de um tempo construído pela imagem.' },
  { id: 'k-006', title: 'Spatial echo', image: '/assets/art-006.jpg', collection: 'geometry', standard: 'ERC-1155', price: parseEthAmount('0.24'), description: 'Planos em diálogo. Uma arquitetura que existe apenas no olhar.' },
]
