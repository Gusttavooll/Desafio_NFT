import { lazy, Suspense, useId, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/ui/components'

// O código do Sheet entra somente quando o visitante abre os filtros.
const FilterPanel = lazy(() => import('./MobileCatalogFilterPanel'))

export function MobileCatalogFilters({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const contentId = useId()
  return <div className="mobile-catalog-filters"><Button ref={trigger} type="button" variant="outline" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? contentId : undefined} onClick={() => setOpen(true)}>Abrir filtros</Button>
    {open && <Suspense fallback={<p role="status">Carregando filtros…</p>}><FilterPanel contentId={contentId} onClose={() => setOpen(false)} restoreFocus={() => trigger.current?.focus()}>{children}</FilterPanel></Suspense>}
  </div>
}
