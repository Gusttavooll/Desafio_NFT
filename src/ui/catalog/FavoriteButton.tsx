import { Heart } from 'lucide-react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { safeReturnTo, useSession } from '@/application/account'
import { useFavorites } from '@/application/catalog'
import { Button } from '@/ui/components'

export function FavoriteButton({ nftId }: { nftId: string }) {
  const session = useSession()
  const favorites = useFavorites()
  const navigate = useNavigate()
  const returnTo = safeReturnTo(useRouterState({ select: state => state.location.href }))
  const selected = favorites.nftIds.includes(nftId)
  const toggle = () => {
    if (session.status !== 'collector') {
      void navigate({ to: '/login', search: { returnTo } })
      return
    }
    void favorites.setFavorite({ nftId, selected: !selected }).catch(() => undefined)
  }
  return <div className="favorite-control"><Button type="button" variant="outline" aria-label={selected ? 'Remover dos favoritos' : 'Favoritar obra'} aria-pressed={selected} disabled={favorites.isPending} onClick={toggle}><Heart size={18} fill={selected ? 'currentColor' : 'none'} aria-hidden="true" />{selected ? 'Salvo' : 'Favoritar'}</Button>{favorites.mutationError && <p role="alert" className="market-error">Não foi possível salvar o favorito. Tente novamente.</p>}</div>
}
