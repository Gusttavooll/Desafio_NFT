import type { Network } from '@/domain/wallets'
import type { EditionDto, NftDto } from '@/infrastructure/catalog'

// Fixtures do Catálogo: 26 NFTs com coleções, redes, faixas de preço e Edições variadas.
// Preços em milésimos de ETH (inteiros), convertidos para string decimal sem ponto flutuante.

export function formatMilliEth(milli: number): string {
  return `${Math.floor(milli / 1000)}.${String(milli % 1000).padStart(3, '0')}`
}

type StockProfile = 'full' | 'compact' | 'sold-out-one' | 'no-stock' | 'open'

// [rótulo, multiplicador do preço em décimos, Disponibilidade]
const PROFILES: Record<StockProfile, Array<[string, number, number]>> = {
  full: [['1/1', 30, 1], ['1/10', 15, 7], ['1/50', 11, 32], ['Aberta', 10, 120]],
  compact: [['1/10', 15, 3], ['Aberta', 10, 60]],
  'sold-out-one': [['1/1', 30, 0], ['1/50', 11, 12], ['Aberta', 10, 80]],
  'no-stock': [['1/1', 30, 0], ['1/10', 15, 0]],
  open: [['Aberta', 10, 200]],
}

interface NftSeed {
  title: string
  tokenId: string
  collection: string
  network: Network
  priceMilli: number
  oldPriceMilli?: number
  featured?: boolean
  trending?: boolean
  stock: StockProfile
}

export const COLLECTIONS: Record<string, string> = {
  'primatas-esmeralda': 'Primatas Esmeralda',
  nomades: 'Nômades',
  'vasos-neon': 'Vasos Neon',
  'jardim-cosmico': 'Jardim Cósmico',
  'baroes-de-marfim': 'Barões de Marfim',
  'batidas-douradas': 'Batidas Douradas',
}

const SEEDS: NftSeed[] = [
  { title: 'Emerald Ape', tokenId: '#042', collection: 'primatas-esmeralda', network: 'ethereum', priceMilli: 1850, oldPriceMilli: 2200, featured: true, trending: true, stock: 'full' },
  { title: 'Sage Nomad', tokenId: '#009', collection: 'nomades', network: 'polygon', priceMilli: 240, trending: true, stock: 'compact' },
  { title: 'Neon Vessel', tokenId: '#552', collection: 'vasos-neon', network: 'ethereum', priceMilli: 920, oldPriceMilli: 1100, stock: 'full' },
  { title: 'Cosmic Bloom', tokenId: '#118', collection: 'jardim-cosmico', network: 'solana', priceMilli: 60, stock: 'open' },
  { title: 'Violet Nomad', tokenId: '#314', collection: 'nomades', network: 'polygon', priceMilli: 310, stock: 'sold-out-one' },
  { title: 'Ivory Baron', tokenId: '#088', collection: 'baroes-de-marfim', network: 'ethereum', priceMilli: 3400, featured: true, stock: 'full' },
  { title: 'Golden Beat', tokenId: '#207', collection: 'batidas-douradas', network: 'solana', priceMilli: 150, trending: true, stock: 'compact' },
  { title: 'Golden Signal', tokenId: '#160', collection: 'batidas-douradas', network: 'polygon', priceMilli: 480, stock: 'sold-out-one' },
  { title: 'Emerald Ape', tokenId: '#043', collection: 'primatas-esmeralda', network: 'ethereum', priceMilli: 1700, stock: 'compact' },
  { title: 'Emerald Ape', tokenId: '#101', collection: 'primatas-esmeralda', network: 'polygon', priceMilli: 410, oldPriceMilli: 520, stock: 'open' },
  { title: 'Sage Nomad', tokenId: '#010', collection: 'nomades', network: 'solana', priceMilli: 95, stock: 'full' },
  { title: 'Sage Nomad', tokenId: '#233', collection: 'nomades', network: 'ethereum', priceMilli: 2750, featured: true, stock: 'no-stock' },
  { title: 'Neon Vessel', tokenId: '#553', collection: 'vasos-neon', network: 'polygon', priceMilli: 380, stock: 'compact' },
  { title: 'Neon Vessel', tokenId: '#700', collection: 'vasos-neon', network: 'solana', priceMilli: 45, trending: true, stock: 'open' },
  { title: 'Cosmic Bloom', tokenId: '#119', collection: 'jardim-cosmico', network: 'ethereum', priceMilli: 1280, stock: 'full' },
  { title: 'Cosmic Bloom', tokenId: '#305', collection: 'jardim-cosmico', network: 'polygon', priceMilli: 270, oldPriceMilli: 330, stock: 'sold-out-one' },
  { title: 'Violet Nomad', tokenId: '#315', collection: 'nomades', network: 'ethereum', priceMilli: 2100, stock: 'compact' },
  { title: 'Violet Nomad', tokenId: '#412', collection: 'nomades', network: 'solana', priceMilli: 80, stock: 'open' },
  { title: 'Ivory Baron', tokenId: '#089', collection: 'baroes-de-marfim', network: 'polygon', priceMilli: 640, stock: 'full' },
  { title: 'Ivory Baron', tokenId: '#190', collection: 'baroes-de-marfim', network: 'ethereum', priceMilli: 4950, oldPriceMilli: 5500, trending: true, stock: 'compact' },
  { title: 'Golden Beat', tokenId: '#208', collection: 'batidas-douradas', network: 'ethereum', priceMilli: 1320, stock: 'full' },
  { title: 'Golden Beat', tokenId: '#350', collection: 'batidas-douradas', network: 'polygon', priceMilli: 205, stock: 'open' },
  { title: 'Golden Signal', tokenId: '#161', collection: 'batidas-douradas', network: 'solana', priceMilli: 120, stock: 'sold-out-one' },
  { title: 'Golden Signal', tokenId: '#255', collection: 'batidas-douradas', network: 'ethereum', priceMilli: 2980, featured: true, stock: 'full' },
  { title: 'Emerald Ape', tokenId: '#310', collection: 'primatas-esmeralda', network: 'solana', priceMilli: 70, stock: 'compact' },
  { title: 'Neon Vessel', tokenId: '#901', collection: 'vasos-neon', network: 'ethereum', priceMilli: 1560, stock: 'full' },
]

const ATTRIBUTE_POOL: Record<string, string[]> = {
  Fundo: ['Cobalto', 'Grafite', 'Papel', 'Esmeralda'],
  Aura: ['Nenhuma', 'Fina', 'Intensa', 'Prismática'],
  Raridade: ['Comum', 'Incomum', 'Rara', 'Lendária'],
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function nftSlug(title: string, tokenId: string): string {
  return slugify(`${title} ${tokenId}`)
}

export const NFT_IMAGE_VARIANTS = ['a', 'b', 'c'] as const

// Determinístico: o mesmo índice sempre gera os mesmos dados.
function build(seed: NftSeed, index: number): NftDto {
  const slug = nftSlug(seed.title, seed.tokenId)
  const editions: EditionDto[] = PROFILES[seed.stock].map(([label, tenths, available]) => ({
    id: `${slug}:${label.replace('/', '-').toLowerCase()}`,
    label,
    price: formatMilliEth(Math.round((seed.priceMilli * tenths) / 10)),
    available,
    purchaseLimit: 10,
  }))
  const attributes = Object.entries(ATTRIBUTE_POOL).map(([trait, values], i) => ({
    trait,
    value: values[(index + i * 3) % values.length] ?? '',
  }))
  return {
    id: slug,
    tokenId: seed.tokenId,
    title: seed.title,
    collectionId: seed.collection,
    collectionName: COLLECTIONS[seed.collection] ?? seed.collection,
    network: seed.network,
    price: formatMilliEth(seed.priceMilli),
    ...(seed.oldPriceMilli ? { oldPrice: formatMilliEth(seed.oldPriceMilli) } : {}),
    featured: seed.featured ?? false,
    trending: seed.trending ?? false,
    // Mais recentes primeiro: índice menor = criado depois.
    createdAt: new Date(Date.UTC(2026, 9, 1) - index * 86_400_000).toISOString(),
    imageUrl: `/nfts/${slug}-a.svg`,
    thumbnailUrls: NFT_IMAGE_VARIANTS.map((v) => `/nfts/${slug}-${v}.svg`),
    description: `${seed.title} ${seed.tokenId} faz parte da coleção ${COLLECTIONS[seed.collection] ?? ''}, registrada na rede ${seed.network}. Cada obra é preservada como registro permanente.`,
    rating: 3.5 + ((index * 7) % 15) / 10,
    reviewCount: 4 + ((index * 11) % 60),
    attributes,
    editions,
    version: 1,
  }
}

export function createNftFixtures(): NftDto[] {
  return SEEDS.map(build)
}
