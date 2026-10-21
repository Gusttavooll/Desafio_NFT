import { useState } from 'react'
import { Button, Input } from '@/ui/components'

export function CouponField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const [draft, setDraft] = useState(value)
  return <form className="market-stack" onSubmit={event => { event.preventDefault(); onChange(draft.trim().toUpperCase()) }}><label className="market-field">Cupom<Input aria-label="Cupom" value={draft} onChange={event => setDraft(event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'coupon-error' : undefined} /></label>{error && <p id="coupon-error" className="market-error" role="alert">{error}</p>}<div className="market-actions"><Button type="submit" variant="outline">Aplicar cupom</Button>{value && <Button type="button" variant="ghost" onClick={() => { setDraft(''); onChange('') }}>Remover cupom</Button>}</div></form>
}
