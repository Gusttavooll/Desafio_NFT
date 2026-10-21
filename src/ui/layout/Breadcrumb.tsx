import { Link } from '@tanstack/react-router'
export function Breadcrumb({ current }: { current: string }) {
  return <nav aria-label="Localização" className="breadcrumb"><Link to="/">Acervo</Link><span aria-hidden="true">/</span><span aria-current="page">{current}</span></nav>
}
