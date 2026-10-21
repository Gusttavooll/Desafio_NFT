import { describe, expect, it } from 'vitest'
import { isEthAmount } from '@/domain/shared'
import { verifyPassword } from '../password'
import { COLLECTOR_CREDENTIALS, COLLECTORS, COUPON_EXPIRED, COUPON_VALID, createInitialState } from './index'

const state = createInitialState()
// Caminhos dos arquivos em public/nfts (sem carregar o conteúdo).
const imageFiles = new Set(Object.keys(import.meta.glob('/public/nfts/*.svg')))

describe('Fixtures do Catálogo', () => {
  it('têm pelo menos 24 NFTs, para gerar mais de uma página', () => {
    expect(state.nfts.length).toBeGreaterThanOrEqual(24)
  })

  it('têm ids de NFT e de Edição únicos', () => {
    const nftIds = state.nfts.map((n) => n.id)
    const editionIds = state.nfts.flatMap((n) => n.editions.map((e) => e.id))
    expect(new Set(nftIds).size).toBe(nftIds.length)
    expect(new Set(editionIds).size).toBe(editionIds.length)
  })

  it('usam Valor em ETH válido em todo preço', () => {
    for (const nft of state.nfts) {
      expect(isEthAmount(nft.price), `${nft.id} price`).toBe(true)
      if (nft.oldPrice) expect(isEthAmount(nft.oldPrice), `${nft.id} oldPrice`).toBe(true)
      for (const edition of nft.editions) expect(isEthAmount(edition.price), edition.id).toBe(true)
    }
    for (const fee of Object.values(state.networkFees)) expect(isEthAmount(fee)).toBe(true)
  })

  it('têm Disponibilidade inteira e não negativa em toda Edição', () => {
    for (const edition of state.nfts.flatMap((n) => n.editions)) {
      expect(Number.isInteger(edition.available), edition.id).toBe(true)
      expect(edition.available, edition.id).toBeGreaterThanOrEqual(0)
    }
  })

  it('variam coleções, redes e faixas de preço', () => {
    expect(new Set(state.nfts.map((n) => n.collectionId)).size).toBeGreaterThanOrEqual(5)
    expect([...new Set(state.nfts.map((n) => n.network))].sort()).toEqual(['ethereum', 'polygon', 'solana'])
    const prices = state.nfts.map((n) => Number(n.price))
    expect(Math.min(...prices)).toBeLessThan(0.1)
    expect(Math.max(...prices)).toBeGreaterThan(3)
  })

  it('incluem Destaques, preço antigo, Edição esgotada e NFT sem estoque', () => {
    expect(state.nfts.some((n) => n.featured)).toBe(true)
    expect(state.nfts.some((n) => n.oldPrice)).toBe(true)
    expect(state.nfts.some((n) => n.editions.some((e) => e.available === 0))).toBe(true)
    expect(state.nfts.some((n) => n.editions.every((e) => e.available === 0))).toBe(true)
  })

  it('oferecem várias Edições (1/1, 1/10, 1/50, aberta) em algum NFT', () => {
    const labels = new Set(state.nfts.flatMap((n) => n.editions.map((e) => e.label)))
    expect([...labels].sort()).toEqual(['1/1', '1/10', '1/50', 'Aberta'])
  })

  it('apontam para imagens que existem em public/', () => {
    for (const nft of state.nfts) {
      for (const url of [nft.imageUrl, ...nft.thumbnailUrls]) {
        expect(imageFiles.has(`/public${url}`), url).toBe(true)
      }
    }
  })

  it('começam todo recurso na Versão 1', () => {
    for (const nft of state.nfts) expect(state.versions[`nft:${nft.id}`]).toBe(1)
  })
})

describe('Fixtures de Colecionadores, Cupons e Taxas', () => {
  it('têm pelo menos dois Colecionadores com credenciais que batem com o hash', async () => {
    expect(COLLECTORS.length).toBeGreaterThanOrEqual(2)
    for (const { email, password } of COLLECTOR_CREDENTIALS) {
      const collector = COLLECTORS.find((c) => c.email === email)
      expect(collector, email).toBeDefined()
      expect(await verifyPassword(password, collector!.salt, collector!.passwordHash)).toBe(true)
    }
  })

  it('não guardam senha em claro', () => {
    for (const collector of COLLECTORS) {
      for (const { password } of COLLECTOR_CREDENTIALS) {
        expect(JSON.stringify(collector)).not.toContain(password)
      }
    }
  })

  it('têm um Cupom válido e um expirado', () => {
    const now = Date.now()
    const valid = state.coupons.find((c) => c.code === COUPON_VALID)
    const expired = state.coupons.find((c) => c.code === COUPON_EXPIRED)
    expect(Date.parse(valid!.expiresAt)).toBeGreaterThan(now)
    expect(Date.parse(expired!.expiresAt)).toBeLessThan(now)
  })

  it('têm uma Taxa de rede por Rede', () => {
    expect(Object.keys(state.networkFees).sort()).toEqual(['ethereum', 'polygon', 'solana'])
  })

  it('isolam Carteiras por Colecionador', () => {
    expect(state.wallets['collector-ana']?.map(wallet => wallet.kind).sort()).toEqual(['primary', 'secondary'])
    expect(state.wallets['collector-bruno']).toBeUndefined()
  })
})
