import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { login, register, safeReturnTo, safeAuthCancelPath, validateRegistration, accountApiError, type AccountFields } from '@/application/account'
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, PasswordInput } from '@/ui/components'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const search = useSearch({ strict: false }) as { returnTo?: string; expired?: boolean }
  const returnTo = safeReturnTo(search.returnTo)
  const navigate = useNavigate()
  const firstInput = useRef<HTMLInputElement>(null)
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => pending.current?.abort(), [])
  const [values, setValues] = useState({ displayName: '', username: '', email: '', password: '', confirmation: '' })
  const [fields, setFields] = useState<AccountFields>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const creating = mode === 'register'
  const update = (name: keyof typeof values, value: string) => { setValues(current => ({ ...current, [name]: value })); setFields(current => ({ ...current, [name]: '' })); setError('') }
  const close = () => { pending.current?.abort(); void navigate({ href: safeAuthCancelPath(returnTo) }) }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const errors = creating ? validateRegistration(values) : { ...(!values.email.trim() ? { email: 'Informe seu e-mail.' } : {}), ...(!values.password ? { password: 'Informe sua senha.' } : {}) }
    setFields(errors)
    setError('')
    if (Object.keys(errors).length) return
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    setBusy(true)
    try {
      if (creating) await register({ displayName: values.displayName, username: values.username, email: values.email, password: values.password }, controller.signal)
      else await login({ email: values.email, password: values.password }, controller.signal)
      if (controller.signal.aborted || pending.current !== controller) return
      setValues(current => ({ ...current, password: '', confirmation: '' }))
      await navigate({ href: returnTo, replace: true })
    } catch (failure) { if (!controller.signal.aborted && pending.current === controller) { const result = accountApiError(failure); setFields(result.fields); setError(result.message) } }
    finally { if (!controller.signal.aborted && pending.current === controller) setBusy(false) }
  }
  const field = (name: keyof typeof values, label: string, password = false) => <div className="market-field"><label htmlFor={`auth-${name}`}>{label}</label>{password ? <PasswordInput id={`auth-${name}`} value={values[name]} onChange={event => update(name, event.target.value)} autoComplete={creating ? 'new-password' : 'current-password'} disabled={busy} aria-invalid={!!fields[name]} aria-describedby={fields[name] ? `auth-${name}-error` : undefined} /> : <Input ref={name === (creating ? 'displayName' : 'email') ? firstInput : undefined} id={`auth-${name}`} type={name === 'email' ? 'email' : 'text'} value={values[name]} onChange={event => update(name, event.target.value)} autoComplete={name === 'email' ? 'email' : name === 'displayName' ? 'name' : 'username'} disabled={busy} aria-invalid={!!fields[name]} aria-describedby={fields[name] ? `auth-${name}-error` : undefined} />}{fields[name] && <span className="market-error" id={`auth-${name}-error`}>{fields[name]}</span>}</div>
  return <>
    <div className="page-container market-page market-auth" aria-hidden="true"><p className="eyebrow">KRONOS // CONTA DO COLECIONADOR</p><p className="market-title">Sua coleção<br />continua aqui.</p></div>
    <Dialog open onOpenChange={open => { if (!open) close() }}><DialogContent onOpenAutoFocus={event => { event.preventDefault(); firstInput.current?.focus() }} onCloseAutoFocus={event => { event.preventDefault(); document.querySelector<HTMLElement>('.masthead .k-button')?.focus() }}>
      <DialogHeader><p className="eyebrow">CONTA // ACESSO AO ARQUIVO</p><DialogTitle>{creating ? 'Crie seu perfil.' : 'Entre na sua coleção.'}</DialogTitle><DialogDescription>{creating ? 'Crie uma conta fictícia para explorar o marketplace demonstrativo.' : 'Use sua conta demonstrativa para continuar de onde parou.'}</DialogDescription></DialogHeader>
      <nav className="market-actions" aria-label="Acesso à conta"><Link to="/login" search={{ returnTo }} onClick={() => { pending.current?.abort(); setBusy(false) }} className={!creating ? 'font-semibold underline' : 'market-muted'} aria-current={!creating ? 'page' : undefined}>Entrar</Link><Link to="/register" search={{ returnTo }} onClick={() => { pending.current?.abort(); setBusy(false) }} className={creating ? 'font-semibold underline' : 'market-muted'} aria-current={creating ? 'page' : undefined}>Criar conta</Link></nav>
      {search.expired && <p className="market-message" role="status">Sua sessão expirou. Entre novamente para retomar o que estava fazendo.</p>}
      <form className="market-stack" onSubmit={event => void submit(event)} noValidate>
        {creating && <>{field('displayName', 'Nome de exibição')}{field('username', 'Nome de usuário')}</>}
        {field('email', 'E-mail')}{field('password', 'Senha', true)}{creating && <>{field('confirmation', 'Confirmar senha', true)}<p className="market-muted">A senha deve ter entre 8 e 128 caracteres.</p></>}
        {error && <p className="market-error" role="alert">{error}</p>}
        <Button type="submit" disabled={busy} aria-busy={busy}>{busy ? 'Aguarde…' : creating ? 'Criar perfil' : 'Entrar'}</Button>
        {!creating && <Button type="button" variant="link" disabled>Esqueceu a senha? Indisponível nesta demonstração.</Button>}
      </form>
      <div className="market-stack"><p className="market-muted">Acesso social fora do escopo desta demonstração.</p><div className="market-actions"><Button variant="outline" disabled>Google indisponível</Button><Button variant="outline" disabled>Facebook indisponível</Button></div><details className="market-muted"><summary>Contas fictícias para testar</summary><p>Ana: ana@kronos.test · Colecionador#1</p><p>Bruno: bruno@kronos.test · Colecionador#2</p></details></div>
    </DialogContent></Dialog>
  </>
}
