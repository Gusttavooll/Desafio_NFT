import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from '@tanstack/react-router'
import { useProfile, useSession } from '@/application/account'
import { useSaveWallet, useWallets, validateWallet, walletApiError, walletDraft, type WalletErrors, type WalletFields } from '@/application/wallets'
import type { Network, Wallet, WalletType } from '@/domain/wallets'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@/ui/components'
import { AccountLayout } from '@/ui/layout'

const networks: Array<{ value: Network; label: string }> = [{ value: 'ethereum', label: 'Ethereum' }, { value: 'polygon', label: 'Polygon' }, { value: 'solana', label: 'Solana' }]
const types: Array<{ value: WalletType; label: string }> = [{ value: 'metamask', label: 'MetaMask' }, { value: 'coinbase', label: 'Coinbase Wallet' }, { value: 'walletconnect', label: 'WalletConnect' }, { value: 'ledger', label: 'Ledger' }]
function WalletForm({ owner, kind, wallet, primary, defaults }: { owner: string; kind: 'primary' | 'secondary'; wallet: Wallet | null; primary: Wallet | null; defaults: Pick<WalletFields, 'displayName' | 'username' | 'email' | 'ensName'> }) {
  const [values, setValues] = useState<WalletFields>(() => walletDraft(owner, kind) ?? wallet ?? { ...defaults, kind, nickname: kind === 'primary' ? 'Principal' : 'Secundária', network: 'ethereum', type: 'metamask', address: '', sameAsPrimary: false })
  const [errors, setErrors] = useState<WalletErrors>({})
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const mutation = useSaveWallet()
  const linked = kind === 'secondary' && values.sameAsPrimary
  const visible = linked && primary ? { ...primary, kind, sameAsPrimary: true } : values
  const update = (patch: Partial<WalletFields>) => { const next = { ...values, ...patch }; setValues(next); walletDraft(owner, kind, next); setSaved(false) }
  useEffect(() => { if (Object.keys(errors).length) document.querySelector<HTMLInputElement>(`#wallet-${kind} [aria-invalid="true"]`)?.focus() }, [errors, kind])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (mutation.isPending) return
    const validation = validateWallet(visible)
    setErrors(validation); setMessage(''); setSaved(false)
    if (Object.keys(validation).length) return
    try { await mutation.mutateAsync({ body: visible, id: wallet?.id }); walletDraft(owner, kind, null); setSaved(true) }
    catch (failure) { const problem = walletApiError(failure); setMessage(problem.message); setErrors(problem.fields) }
  }
  const textField = (name: 'displayName' | 'username' | 'nickname' | 'email' | 'ensName' | 'address', label: string, optional = false) => <label className="market-field" htmlFor={`${kind}-${name}`}>{label}{!optional && ' *'}<Input id={`${kind}-${name}`} name={name} type={name === 'email' ? 'email' : 'text'} value={visible[name] ?? ''} disabled={!!linked || mutation.isPending} onChange={event => update({ [name]: event.target.value })} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${kind}-${name}-error` : undefined} autoComplete={name === 'email' ? 'email' : 'off'} />{errors[name] && <span id={`${kind}-${name}-error`} className="market-error">{errors[name]}</span>}</label>
  return <form id={`wallet-${kind}`} className="market-panel market-stack" onSubmit={submit} noValidate>
    <div><p className="eyebrow">{kind === 'primary' ? '01 // PADRÃO NO PAGAMENTO' : '02 // ALTERNATIVA'}</p><h2 className="text-3xl">Carteira {kind === 'primary' ? 'principal' : 'secundária'}</h2></div>
    {kind === 'secondary' && <label className="market-row"><input type="checkbox" checked={!!values.sameAsPrimary} disabled={!primary || mutation.isPending} onChange={event => update({ sameAsPrimary: event.target.checked })} />Igual à carteira principal</label>}
    <div className="market-fields">{textField('displayName', 'Nome de exibição')}{textField('username', 'Nome do perfil')}{textField('nickname', 'Apelido')}{textField('email', 'E-mail')}</div>
    <div className="market-fields"><label className="market-field">Rede *<Select value={visible.network} onValueChange={network => update({ network: network as Network })} disabled={!!linked || mutation.isPending}><SelectTrigger aria-label={`Rede da carteira ${kind === 'primary' ? 'principal' : 'secundária'}`}><SelectValue /></SelectTrigger><SelectContent>{networks.map(network => <SelectItem key={network.value} value={network.value}>{network.label}</SelectItem>)}</SelectContent></Select></label>
    <label className="market-field">Tipo de carteira *<Select value={visible.type} onValueChange={type => update({ type: type as WalletType })} disabled={!!linked || mutation.isPending}><SelectTrigger aria-label={`Tipo da carteira ${kind === 'primary' ? 'principal' : 'secundária'}`}><SelectValue /></SelectTrigger><SelectContent>{types.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></label></div>
    {textField('address', 'Endereço da carteira')}{textField('ensName', 'Nome ENS', true)}
    {message && <p className="market-error" role="alert">{message}</p>}{saved && <p className="market-message" role="status">Carteira salva. Já está disponível no pagamento.</p>}
    <Button type="submit" aria-busy={mutation.isPending} disabled={mutation.isPending}>{mutation.isPending ? 'Salvando carteira…' : `Salvar carteira ${kind === 'primary' ? 'principal' : 'secundária'}`}</Button>
  </form>
}
function WalletsContent({ owner }: { owner: string }) {
  const wallets = useWallets()
  const profile = useProfile()
  const [adding, setAdding] = useState(false)
  if (wallets.isPending || profile.isPending) return <div className="market-stack" role="status"><p>Carregando carteiras…</p><Skeleton className="h-24" /></div>
  if (wallets.error || profile.error) return <div className="market-panel market-stack"><p role="alert" className="market-error">{walletApiError(wallets.error ?? profile.error).message}</p><Button onClick={() => { void wallets.refetch(); void profile.refetch() }}>Tentar novamente</Button></div>
  if (!wallets.data || !profile.data) return null
  return <div className="market-stack"><WalletForm owner={owner} kind="primary" wallet={wallets.data.primary} primary={wallets.data.primary} defaults={profile.data} />
    {wallets.data.secondary || adding ? <WalletForm owner={owner} kind="secondary" wallet={wallets.data.secondary} primary={wallets.data.primary} defaults={profile.data} /> : <section className="market-panel market-stack"><h2 className="text-3xl">Carteira secundária</h2><p>Você ainda não adicionou uma carteira secundária.</p><Button variant="outline" onClick={() => setAdding(true)}>Adicionar carteira secundária</Button></section>}
    <Button asChild variant="outline"><Link to="/checkout">Voltar ao pagamento</Link></Button></div>
}
export function WalletsPage() {
  const session = useSession()
  if (session.status === 'loading') return <div className="market-page" role="status">Recuperando sessão…</div>
  if (session.status !== 'collector') return <Navigate to="/login" search={{ returnTo: '/wallets' }} />
  return <AccountLayout><header className="market-header"><div><p className="eyebrow">CONTA // CONEXÕES SIMULADAS</p><h1 className="market-title">Suas carteiras.</h1><p>Cadastre a principal e uma alternativa para usar no pagamento. Nenhuma extensão ou carteira real será conectada.</p></div></header><WalletsContent key={session.userId} owner={session.userId!} /></AccountLayout>
}
