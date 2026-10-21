import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Breadcrumb } from './Breadcrumb'

export function AccountLayout({ children }: { children: ReactNode }) {
  return <div className="page-container"><Breadcrumb current="Minha conta" /><div className="account-layout"><aside><p className="eyebrow">ÁREA DO COLECIONADOR</p><h2>MINHA CONTA</h2><nav aria-label="Minha conta"><Link to="/profile">Meu perfil</Link><Link to="/wallets">Carteiras</Link></nav></aside><section aria-label="Dados da conta">{children}</section></div></div>
}
