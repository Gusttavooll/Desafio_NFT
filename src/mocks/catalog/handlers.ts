import type { RequestHandler, WebSocketHandler } from 'msw'
import { http, HttpResponse, delay } from 'msw'
import { nfts } from './fixtures'

// Handlers do contexto Catálogo (NFT, Edição, Favorito, Disponibilidade).
export const catalogHandlers: Array<RequestHandler | WebSocketHandler> = [
  http.get('/api/nfts', async ({ request }) => {
    await delay(180)
    const params = new URL(request.url).searchParams
    const q = (params.get('q') || '').toLocaleLowerCase('pt-BR')
    const collection = params.get('collection') || 'all'
    const filtered = nfts.filter(nft => (collection === 'all' || nft.collection === collection) && `${nft.title} ${nft.id}`.toLocaleLowerCase('pt-BR').includes(q))
    if (params.get('sort') === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title))
    const pages = Math.max(1, Math.ceil(filtered.length / 3))
    const requested = Number(params.get('page') || 1)
    const page = Number.isSafeInteger(requested) ? Math.min(pages, Math.max(1, requested)) : 1
    return HttpResponse.json({ nfts: filtered.slice((page - 1) * 3, page * 3), featured: nfts[0], total: filtered.length, page, pages })
  }),
  http.get('/api/nfts/:id', ({ params }) => {
    const nft = nfts.find(item => item.id === params.id)
    return nft ? HttpResponse.json({ nft }) : HttpResponse.json({ code: 'not_found', message: 'Obra não encontrada.' }, { status: 404 })
  }),
]
