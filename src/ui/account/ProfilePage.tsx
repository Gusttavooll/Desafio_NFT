import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from '@tanstack/react-router'
import { logout, useChangePassword, useProfile, useSession, useUpdateAvatar, useUpdateProfile, validateAvatar, validatePasswordChange, validateProfile, accountApiError, captureAccountSession, isCurrentAccountSession, type AccountFields, type CollectorProfile } from '@/application/account'
import { AccountLayout } from '@/ui/layout'
import { Button, Input, PasswordInput, Skeleton } from '@/ui/components'

function readAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Imagem inválida'))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

function ProfileForm({ profile }: { profile: CollectorProfile }) {
  const [values, setValues] = useState({ displayName: profile.displayName, username: profile.username, email: profile.email, ensName: profile.ensName ?? '' })
  const [fields, setFields] = useState<AccountFields>({})
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [avatarSaved, setAvatarSaved] = useState('')
  const [readingAvatar, setReadingAvatar] = useState(false)
  const mutation = useUpdateProfile()
  const avatar = useUpdateAvatar()
  async function submit(event: FormEvent) {
    event.preventDefault()
    const errors = validateProfile(values)
    setFields(errors); setMessage(''); setSaved(false)
    if (Object.keys(errors).length || mutation.isPending) return
    try { await mutation.mutateAsync(values); setSaved(true) } catch (error) { const result = accountApiError(error); setFields(result.fields); setMessage(result.message) }
  }
  async function upload(file?: File) {
    if (!file) return
    const identity = captureAccountSession()
    if (identity.owner !== profile.id || !identity.token) return
    setAvatarSaved('')
    const error = validateAvatar(file)
    setAvatarError(error ?? '')
    if (error) return
    setReadingAvatar(true)
    try {
      const image = await readAvatar(file)
      if (!isCurrentAccountSession(identity)) return
      await avatar.mutateAsync(image)
      if (isCurrentAccountSession(identity)) setAvatarSaved('Avatar atualizado.')
    } catch (failure) { if (isCurrentAccountSession(identity)) { const result = accountApiError(failure); setAvatarError(result.fields.avatar ?? result.message) } } finally { setReadingAvatar(false) }
  }
  async function removeAvatar() {
    setAvatarError(''); setAvatarSaved('')
    try { await avatar.mutateAsync(null); setAvatarSaved('Avatar removido.') } catch (error) { setAvatarError(accountApiError(error).message) }
  }
  const field = (name: keyof typeof values, label: string) => <div className="market-field"><label htmlFor={`profile-${name}`}>{label}</label><Input id={`profile-${name}`} type={name === 'email' ? 'email' : 'text'} value={values[name]} onChange={event => { setValues(current => ({ ...current, [name]: event.target.value })); setFields(current => ({ ...current, [name]: '' })); setSaved(false) }} disabled={mutation.isPending} aria-invalid={!!fields[name]} aria-describedby={fields[name] ? `profile-${name}-error` : undefined} />{fields[name] && <span id={`profile-${name}-error`} className="market-error">{fields[name]}</span>}</div>
  return <>
    <section className="market-panel market-stack" aria-labelledby="profile-avatar-title"><div><p className="eyebrow">01 // IDENTIDADE</p><h2 id="profile-avatar-title" className="text-3xl">Seu avatar</h2></div><div className="market-row">{profile.avatarUrl ? <img src={profile.avatarUrl} alt={`Avatar de ${profile.displayName}`} width="96" height="96" className="size-24 border border-ink object-cover" /> : <div className="size-24 border border-ink flex items-center justify-center font-display text-3xl" aria-label="Sem avatar">{profile.displayName.slice(0, 2).toUpperCase()}</div>}<div className="market-stack"><label className="market-field" htmlFor="profile-avatar">Alterar avatar<Input id="profile-avatar" type="file" accept="image/png,image/jpeg,image/webp" disabled={avatar.isPending || readingAvatar} onChange={event => { void upload(event.target.files?.[0]); event.target.value = '' }} aria-describedby="avatar-help avatar-error" /></label><p id="avatar-help" className="market-muted">PNG, JPG ou WebP. Até 2 MB.</p><Button variant="outline" disabled={!profile.avatarUrl || avatar.isPending || readingAvatar} onClick={() => void removeAvatar()}>Remover avatar</Button></div></div>{avatarError && <p id="avatar-error" role="alert" className="market-error">{avatarError}</p>}{avatarSaved && <p role="status" className="market-message">{avatarSaved}</p>}</section>
    <form className="market-panel market-stack" onSubmit={event => void submit(event)} noValidate><div><p className="eyebrow">02 // DADOS DO COLECIONADOR</p><h2 className="text-3xl">Dados do perfil</h2></div><div className="market-fields">{field('displayName', 'Nome de exibição')}{field('username', 'Nome de usuário')}{field('email', 'E-mail')}{field('ensName', 'Nome ENS (opcional)')}</div><p className="market-muted">Endereço e apelido das carteiras podem ser alterados em <Link to="/wallets" className="underline">Carteiras</Link>.</p>{message && <p role="alert" className="market-error">{message}</p>}{saved && <p role="status" className="market-message">Perfil salvo.</p>}<div className="market-actions"><Button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending}>{mutation.isPending ? 'Salvando…' : 'Salvar perfil'}</Button></div></form>
  </>
}

function PasswordForm() {
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmation: '' })
  const [fields, setFields] = useState<AccountFields>({})
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const mutation = useChangePassword()
  async function submit(event: FormEvent) {
    event.preventDefault()
    const errors = validatePasswordChange(values)
    setFields(errors); setMessage(''); setSaved(false)
    if (Object.keys(errors).length || mutation.isPending) return
    try { await mutation.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword }); setValues({ currentPassword: '', newPassword: '', confirmation: '' }); setSaved(true) } catch (error) { const result = accountApiError(error); setFields(result.fields); setMessage(result.message) } finally { mutation.reset() }
  }
  return <form className="market-panel market-stack" onSubmit={event => void submit(event)} noValidate><div><p className="eyebrow">03 // ACESSO</p><h2 className="text-3xl">Alterar senha</h2></div><div className="market-fields">{([{ name: 'currentPassword', label: 'Senha atual' }, { name: 'newPassword', label: 'Nova senha' }, { name: 'confirmation', label: 'Confirmar nova senha' }] as const).map(({ name, label }) => <div key={name} className="market-field"><label htmlFor={`profile-${name}`}>{label}</label><PasswordInput id={`profile-${name}`} value={values[name]} autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'} onChange={event => { setValues(current => ({ ...current, [name]: event.target.value })); setFields(current => ({ ...current, [name]: '' })); setSaved(false) }} disabled={mutation.isPending} aria-invalid={!!fields[name]} aria-describedby={fields[name] ? `profile-${name}-error` : undefined} />{fields[name] && <span id={`profile-${name}-error`} className="market-error">{fields[name]}</span>}</div>)}</div><p className="market-muted">Use entre 8 e 128 caracteres. Prefira uma senha fictícia para esta demonstração.</p>{message && <p role="alert" className="market-error">{message}</p>}{saved && <p role="status" className="market-message">Senha alterada.</p>}<div className="market-actions"><Button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending}>{mutation.isPending ? 'Salvando…' : 'Salvar nova senha'}</Button></div></form>
}

function ProfileContent() {
  const profile = useProfile()
  if (profile.isPending) return <div className="market-stack" role="status"><p>Carregando perfil…</p><Skeleton className="h-24" /></div>
  if (profile.error) return <div className="market-panel market-stack"><p role="alert" className="market-error">{accountApiError(profile.error).message}</p><Button onClick={() => void profile.refetch()}>Tentar novamente</Button></div>
  return <div className="market-stack"><ProfileForm profile={profile.data} /><PasswordForm /></div>
}
export function ProfilePage() {
  const session = useSession()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)
  async function leave() { setLeaving(true); try { await logout() } catch { /* A sessão local já foi encerrada, mesmo sem rede. */ } finally { await navigate({ to: '/', replace: true }) } }
  if (session.status === 'loading') return <div className="market-page" role="status">Recuperando sessão…</div>
  if (session.status !== 'collector') return <Navigate to="/login" search={{ returnTo: '/profile' }} />
  return <AccountLayout><header className="market-header"><div><p className="eyebrow">CONTA // SEU ARQUIVO</p><h1 className="market-title">Meu perfil</h1><p>Gerencie seus dados e o acesso à sua coleção.</p></div><Button variant="outline" onClick={() => void leave()} disabled={leaving}>Sair da conta</Button></header><ProfileContent key={session.userId} /></AccountLayout>
}
