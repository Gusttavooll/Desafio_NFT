import { describe, expect, it } from 'vitest'
import { createSimulation } from '@/mocks/core'
import { catalogResponse, nftResponse } from './catalog-response'

const simulation = () => createSimulation({ storage: null, search: '' })
const request = (query = '') => new Request(`http://localhost/api/nfts${query}`)

describe('Catálogo integrado à simulação', () => {
  it('entrega o contrato paginado e as coleções do estado compartilhado', async () => {
    const sim = simulation()
    const body = await catalogResponse(sim, request('?page=2&pageSize=3')).json()
    expect(body).toMatchObject({ page: 2, pageSize: 3, total: sim.state().nfts.length })
    expect(body.items).toHaveLength(3)
    expect(body.collections.reduce((sum: number, item: { count: number }) => sum + item.count, 0)).toBe(body.total)
    expect(body).not.toHaveProperty('nfts')
  })

  it('combina busca e coleção sem alterar os dados compartilhados', async () => {
    const sim = simulation()
    const before = JSON.stringify(sim.state().nfts)
    const body = await catalogResponse(sim, request('?search=Emerald&collectionId=primatas-esmeralda&sort=price-asc')).json()
    expect(body.total).toBe(4)
    expect(body.items[0].id).toBe('emerald-ape-310')
    expect(JSON.stringify(sim.state().nfts)).toBe(before)
  })

  it('ordena preços sem perder casas decimais e reflete atualizações do core', async () => {
    const sim = simulation()
    sim.update(state => { state.nfts = state.nfts.slice(0, 2); state.nfts[0]!.price = '0.420000000000000002'; state.nfts[1]!.price = '0.420000000000000001' })
    const body = await catalogResponse(sim, request('?sort=price-asc')).json()
    expect(body.items[0].price).toBe('0.420000000000000001')
    expect(body.items[1].price).toBe('0.420000000000000002')
  })

  it('limita paginação inválida e trata catálogo vazio', async () => {
    const sim = simulation()
    const body = await catalogResponse(sim, request('?page=-9&pageSize=999999')).json()
    expect(body).toMatchObject({ page: 1, pageSize: 100 })
    sim.setScenario('empty')
    expect(await catalogResponse(sim, request()).json()).toMatchObject({ items: [], total: 0, page: 1 })
  })

  it('preserva edições, versão e valores no detalhe; retorna 404 quando ausente', async () => {
    const sim = simulation()
    const nft = sim.state().nfts[0]!
    expect(await nftResponse(sim, nft.id).json()).toEqual(nft)
    expect(nftResponse(sim, 'inexistente').status).toBe(404)
  })

  it('respeita os cenários de falha também no detalhe', () => {
    const sim = simulation()
    sim.setScenario('server-error')
    expect(catalogResponse(sim, request()).status).toBe(503)
    expect(nftResponse(sim, sim.state().nfts[0]!.id).status).toBe(503)
    sim.setScenario('network-error')
    expect(catalogResponse(sim, request()).type).toBe('error')
  })
})
