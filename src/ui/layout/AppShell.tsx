import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowUpRight, Grid2X2, ShoppingBag, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession } from '@/application/account'
import './layout.css'

export function AppShell({ children, cartCount }: { children: ReactNode; cartCount?: number }) {
  const pathname = useRouterState({ select: state => state.location.pathname })
  const session = useSession()
  return <>
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <div className="utility-bar"><span>ARTE DIGITAL / ACERVO CONTEMPORÂNEO</span><span>EDIÇÃO DE DEMONSTRAÇÃO — 2026</span></div>
    <header className="masthead">
      <Link to="/" className="brand" aria-label="Kronos Archive, início"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M40 4H4V60H60V24M24 16V48M48 16L24 36L48 48" /></svg><span>KRONOS<small>// ARCHIVE</small></span></Link>
      <nav aria-label="Navegação principal"><Link to="/" activeOptions={{ exact: true }}>Acervo</Link><Link to="/cart">Carrinho{cartCount !== undefined && <span className="count">{cartCount}</span>}</Link></nav>
      {session.status === 'loading' ? <button className="k-button" disabled aria-busy="true">Carregando conta…</button> : <Link to={session.status === 'collector' ? '/profile' : '/login'} className="k-button">{session.status === 'collector' ? 'Minha conta' : 'Entrar'} <ArrowUpRight size={18} aria-hidden="true" /></Link>}
    </header>
    <main id="main-content" tabIndex={-1}>{children}</main>
    <footer className="site-footer"><div className="footer-top"><span className="brand">KRONOS // ARCHIVE</span><p>Um lugar para descobrir.<br />Um acervo para construir.</p><a className="k-button" href="#main-content">Voltar ao topo ↑</a></div><div className="footer-bottom"><span>© 2026 KRONOS / PROJETO DEMONSTRATIVO</span><span>ARTE EM PRIMEIRO PLANO.</span></div></footer>
    <nav className="mobile-tab-bar" aria-label="Navegação mobile">{[{ to: '/', text: 'Acervo', Icon: Grid2X2 }, { to: '/cart', text: 'Carrinho', Icon: ShoppingBag }, { to: '/profile', text: 'Conta', Icon: UserRound }].map(({ to, text, Icon }) => <Link key={to} to={to} aria-current={pathname === to ? 'page' : undefined}><Icon size={20} aria-hidden="true" />{text}</Link>)}</nav>
  </>
}
