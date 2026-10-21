import { useId, useRef } from 'react'
import { useRelated } from '@/application/catalog'
import { Button } from '@/ui/components'
import { NftCard } from './NftCard'
import './catalog.css'

export function NftCarousel({ collection, excludeId }: { collection: string; excludeId?: string }) {
  const related = useRelated(collection, excludeId)
  const track = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const trackId = useId()
  if (!related.isPending && !related.isError && related.data?.length === 0) return null
  return <section className="related-carousel" aria-labelledby={titleId} aria-roledescription="carrossel"><header className="market-row"><h2 id={titleId}>Colecionadores também viram</h2>{(related.data?.length ?? 0) > 1 && <div className="market-actions"><Button variant="outline" aria-label="Obras relacionadas anteriores" aria-controls={trackId} onClick={() => track.current?.scrollBy({ left: -track.current.clientWidth })}>←</Button><Button variant="outline" aria-label="Próximas obras relacionadas" aria-controls={trackId} onClick={() => track.current?.scrollBy({ left: track.current.clientWidth })}>→</Button></div>}</header>{related.isPending ? <p role="status">Carregando obras relacionadas…</p> : related.isError ? <div className="market-error" role="alert"><p>Não foi possível abrir outras obras.</p><Button variant="outline" onClick={() => void related.refetch()}>Tentar carregar obras relacionadas</Button></div> : <div className="related-track" ref={track} id={trackId}>{related.data?.map(nft => <NftCard key={nft.id} nft={nft} />)}</div>}</section>
}
