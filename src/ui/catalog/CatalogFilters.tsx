import { useState, type FormEvent } from 'react'
import { priceRangeError } from '@/application/catalog'
import type { CatalogSearch } from '@/domain/catalog'
import { Button, Input } from '@/ui/components'

export function CatalogTabs({ search, update }: { search: CatalogSearch; update: (patch: Partial<CatalogSearch>) => void }) {
  return <div className="market-actions" role="group" aria-label="Recorte do acervo">{[{ id: 'all', label: 'Todos' }, { id: 'new', label: 'Novos lançamentos' }, { id: 'trending', label: 'Em alta' }].map(tab => <button className="k-button" key={tab.id} type="button" aria-pressed={(search.tab ?? 'all') === tab.id} onClick={() => update({ tab: tab.id as CatalogSearch['tab'] })}>{tab.label}</button>)}</div>
}

export function CatalogFilters({ search, update, showTabs = true }: { search: CatalogSearch; update: (patch: Partial<CatalogSearch>) => void; showTabs?: boolean }) {
  const [error, setError] = useState<string | null>(null)
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const minPrice = String(form.get('min') ?? '').trim()
    const maxPrice = String(form.get('max') ?? '').trim()
    const next = priceRangeError(minPrice, maxPrice)
    setError(next)
    if (!next) update({ minPrice, maxPrice })
  }
  return <div className="catalog-extra-filters">
    {showTabs && <CatalogTabs search={search} update={update} />}
    <div className="catalog-range-row"><label className="market-field"><span>Rede</span><select aria-label="Filtrar rede" value={search.network ?? 'all'} onChange={event => update({ network: event.target.value as CatalogSearch['network'] })}><option value="all">Todas as redes</option><option value="ethereum">Ethereum</option><option value="polygon">Polygon</option><option value="solana">Solana</option></select></label>
    <form key={`${search.minPrice}-${search.maxPrice}`} onSubmit={apply} className="catalog-price-filter"><label className="market-field"><span>Mínimo ETH</span><Input name="min" inputMode="decimal" aria-label="Preço mínimo em ETH" defaultValue={search.minPrice ?? ''} placeholder="0.00" /></label><label className="market-field"><span>Máximo ETH</span><Input name="max" inputMode="decimal" aria-label="Preço máximo em ETH" defaultValue={search.maxPrice ?? ''} placeholder="10.00" /></label><Button type="submit" variant="outline">Aplicar preços</Button></form></div>
    {error && <p className="market-error" role="alert">{error}</p>}
    {(search.q || search.collection !== 'all' || search.network && search.network !== 'all' || search.minPrice || search.maxPrice || search.tab && search.tab !== 'all') && <button className="filter-reset" type="button" onClick={() => update({ q: '', collection: 'all', network: 'all', minPrice: '', maxPrice: '', tab: 'all' })}>Limpar todos os filtros</button>}
  </div>
}
