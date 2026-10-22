import { useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowDown, ArrowRight, ArrowUpRight, Search } from 'lucide-react'
import { useCatalog, useFeatured } from '@/application/catalog'
import { Button } from '@/ui/components'
import type { CatalogSearch } from '@/domain/catalog'
import { NftCard } from './NftCard'
import { CatalogFilters, CatalogTabs } from './CatalogFilters'
import { MobileCatalogFilters } from './MobileCatalogFilters'
import './catalog.css'
import './mobile-filters.css'

const mobileQuery = '(max-width: 640px)'
const isMobileViewport = () => window.matchMedia(mobileQuery).matches
const subscribeViewport = (listener: () => void) => {
  const media = window.matchMedia(mobileQuery)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

export function HomePage() {
  const mobile = useSyncExternalStore(subscribeViewport, isMobileViewport, () => false)
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const { data, isPending, isError, refetch, isFetching } = useCatalog(search)
  const update = (patch: Partial<CatalogSearch>, replace = false) => void navigate({ search: { ...search, ...patch, page: patch.page ?? 1 }, replace, resetScroll: false })
  const highlights = useFeatured()
  const [highlightIndex, setHighlightIndex] = useState(0)
  const highlightCount = highlights.data?.length ?? 0
  const position = Math.max(0, Math.min(highlightIndex, highlightCount - 1))
  const featured = highlights.data?.[position]
  const selectedCollections = search.collection === 'all' ? [] : search.collection.split(',')
  const toggleCollection = (id: string) => {
    const next = id === 'all' ? [] : selectedCollections.includes(id) ? selectedCollections.filter(value => value !== id) : [...selectedCollections, id]
    update({ collection: next.length ? next.sort().join(',') : 'all' })
  }
  const collectionControls = <><p className="eyebrow">COLEÇÕES</p><div className="collection-tabs" role="group" aria-label="Filtrar coleção">{[{ id: 'all', name: 'Todas as obras', count: (data?.collections ?? []).reduce((sum, item) => sum + item.count, 0) }, ...(data?.collections ?? [])].map((item, index) => <button key={item.id} onClick={() => toggleCollection(item.id)} aria-pressed={item.id === 'all' ? selectedCollections.length === 0 : selectedCollections.includes(item.id)}><span>{String(index + 1).padStart(2, '0')}</span>{item.name}<small className="collection-count" aria-label={`${item.count} obras`}>{item.count}</small><ArrowUpRight size={14} aria-hidden="true" /></button>)}</div></>
  return <>
    <section className="archive-hero" aria-labelledby="archive-title">
      <div className="hero-copy"><p className="eyebrow">VOL. 01 / UM ARQUIVO EM CONSTRUÇÃO</p><h1 id="archive-title">ARTE QUE<br />ATRAVESSA<br />O TEMPO.</h1><p className="hero-intro">Encontre a obra que faz você parar.<br />Explore formas, sistemas e novas maneiras de colecionar arte digital.</p><div className="hero-actions"><a className="k-button k-button-primary" href="#acervo">Explorar o acervo <ArrowDown size={18} aria-hidden="true" /></a><a className="hero-secondary" href="#sobre">O olhar do arquivo <ArrowUpRight size={16} aria-hidden="true" /></a></div><div className="hero-footnote"><span>01 — DESCOBRIR</span><span>02 — OBSERVAR</span><span>03 — COLECIONAR</span></div></div>
      <div className="hero-display"><div className="exhibit-label"><span>EM EXPOSIÇÃO</span><span>ESTUDO / 001</span></div>{featured ? <Link to="/nfts/$nftId" params={{ nftId: featured.id }} className="hero-art" aria-label={`Inspecionar destaque ${featured.title}`}><div className="art-frame"><img src={featured.image} width="1000" height="1000" alt={featured.title} fetchPriority="high" /></div><span className="art-corner" aria-hidden="true"><ArrowUpRight size={28} /></span></Link> : <div className="art-frame hero-placeholder" aria-label={highlights.isPending ? 'Carregando destaque' : 'Destaque indisponível'} /> }<div className="hero-caption"><div><span className="eyebrow">KRONOS / {featured?.collectionName ?? 'ACERVO'}</span><h2>{featured?.title ?? 'Estudo em exposição'}</h2></div><span className="edition-stamp">ARQUIVO<br />VOL. 01</span></div>{highlightCount > 1 && <div className="featured-controls" role="group" aria-label="Alternar destaques"><Button variant="outline" aria-label="Destaque anterior" onClick={() => setHighlightIndex((position + highlightCount - 1) % highlightCount)}>←</Button><span className="eyebrow" role="status" aria-live="polite">Destaque {position + 1} de {highlightCount}</span><Button variant="outline" aria-label="Próximo destaque" onClick={() => setHighlightIndex((position + 1) % highlightCount)}>→</Button></div>}{highlights.isError && <Button variant="outline" onClick={() => void highlights.refetch()}>Recarregar destaques</Button>}</div>
    </section>
    {import.meta.env.DEV && ['localhost', '127.0.0.1'].includes(window.location.hostname) && <div className="page-container"><p>Pagamento demonstrativo de R$ 10,00, sem cobrança real ou emissão de NFT.</p><a className="k-button" href="http://127.0.0.1:5201">Testar pagamento — Stripe sandbox <ArrowUpRight size={16} aria-hidden="true" /></a></div>}
    <div className="archive-index"><span>ARQUIVO DIGITAL INDEPENDENTE</span><span>FORMAS / CÓDIGO / PERCEPÇÃO</span><a href="#acervo">PERCORRA A COLEÇÃO <ArrowDown size={14} aria-hidden="true" /></a></div>
    <section id="acervo" className="collection-section" aria-labelledby="collection-title"><div className="collection-heading"><div><p className="eyebrow">ÍNDICE DE OBRAS / VOL. 01</p><h2 id="collection-title">O ACERVO.</h2></div><p>Olhe de perto.<br />Cada registro abre uma nova perspectiva.</p></div>
      <div className="collection-layout">{!mobile && <aside className="collection-sidebar">{collectionControls}<div className="catalog-note"><span className="eyebrow">NOTA DO ARQUIVO</span><p>Uma coleção demonstrativa para explorar a experiência KRONOS. Obras e valores não representam ofertas reais.</p></div></aside>}
      <div className="collection-results" aria-busy={isFetching}><div className="catalog-toolbar"><label className="catalog-search"><Search size={18} aria-hidden="true" /><input type="search" aria-label="Buscar obras" placeholder="Buscar por obra ou registro" value={search.q} onChange={event => update({ q: event.target.value }, true)} /></label><label className="catalog-sort"><span className="eyebrow">ORDENAR</span><select aria-label="Ordenar obras" value={search.sort} onChange={event => update({ sort: event.target.value as CatalogSearch['sort'] })}><option value="recent">Mais recentes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option><option value="trending">Em alta</option></select></label></div>
        {mobile ? <><div className="catalog-tabs"><CatalogTabs search={search} update={update} /></div><MobileCatalogFilters>{collectionControls}<CatalogFilters search={search} update={update} showTabs={false} /></MobileCatalogFilters></> : <CatalogFilters search={search} update={update} />}
        <p className="result-count eyebrow" aria-live="polite">{isPending ? 'CONSULTANDO O ACERVO…' : isError ? 'ACERVO INDISPONÍVEL' : `${data.total.toString().padStart(2, '0')} OBRAS ENCONTRADAS / EDIÇÃO DE DEMONSTRAÇÃO`}</p>
        {isPending ? <div className="nft-grid" aria-busy="true">{[1, 2, 3].map(id => <div key={id} className="catalog-skeleton" />)}</div> : isError ? <div className="catalog-empty" role="alert"><h3>Não foi possível abrir o acervo.</h3><p>Tente novamente em instantes.</p><button className="k-button" onClick={() => void refetch()}>Tentar novamente</button></div> : data.total === 0 ? <div className="catalog-empty"><h3>Nenhuma obra encontrada.</h3><p>Experimente outra busca ou volte à coleção completa.</p><button className="k-button" onClick={() => update({ q: '', collection: 'all', network: 'all', minPrice: '', maxPrice: '', tab: 'all' })}>Limpar filtros</button></div> : <><div className="nft-grid">{data.nfts.map(nft => <NftCard key={nft.id} nft={nft} />)}</div><div className="catalog-pagination"><button className="k-button" disabled={isFetching || data.page <= 1} onClick={() => update({ page: data.page - 1 })}>Anterior</button><span className="eyebrow">{data.page.toString().padStart(2, '0')} / {data.pages.toString().padStart(2, '0')}</span><button className="k-button" disabled={isFetching || data.page >= data.pages} onClick={() => update({ page: data.page + 1 })}>Próxima <ArrowRight size={16} aria-hidden="true" /></button></div></>}
      </div></div>
    </section>
    <section className="archive-statement" id="sobre"><div><span className="eyebrow">O OLHAR DO ARQUIVO / 001</span><h2>MENOS RUÍDO.<br />MAIS OBRA.</h2></div><div><p>A arte vem antes do número. O KRONOS foi pensado para dar espaço à imagem, tempo à descoberta e clareza à escolha.</p><p>Explore a coleção, conheça cada registro e encontre o que merece ficar.</p><a href="#acervo" className="statement-link">Voltar às obras <ArrowUpRight size={22} aria-hidden="true" /></a></div></section>
  </>
}
