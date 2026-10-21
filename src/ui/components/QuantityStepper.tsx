export function QuantityStepper({ value, max, onChange, disabled = false, label = 'Quantidade' }: { value: number; max: number; onChange: (quantity: number) => void; disabled?: boolean; label?: string }) {
  const unavailable = disabled || !Number.isSafeInteger(max) || max < 1 || !Number.isSafeInteger(value) || value < 1
  return <div className="quantity-stepper" role="group" aria-label={label}><button type="button" aria-label={`Diminuir ${label.toLowerCase()}`} disabled={unavailable || value <= 1} onClick={() => onChange(Math.min(value - 1, max))}>−</button><output aria-live="polite" aria-label={label}>{value}</output><button type="button" aria-label={`Aumentar ${label.toLowerCase()}`} disabled={unavailable || value >= max} onClick={() => onChange(value + 1)}>+</button></div>
}
