import type { ReactNode } from 'react'
import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/ui/components'

export default function MobileCatalogFilterPanel({ children, contentId, onClose, restoreFocus }: { children: ReactNode; contentId: string; onClose: () => void; restoreFocus: () => void }) {
  return <Sheet open onOpenChange={open => { if (!open) onClose() }}><SheetContent id={contentId} onCloseAutoFocus={event => { event.preventDefault(); restoreFocus() }}><SheetHeader><SheetTitle>Filtros do acervo</SheetTitle><SheetDescription>Combine coleções, rede e faixa de preço. Suas escolhas ficam na URL.</SheetDescription></SheetHeader><div className="mobile-filter-body">{children}</div><div className="mobile-filter-actions"><Button type="button" onClick={onClose}>Ver resultados</Button></div></SheetContent></Sheet>
}
