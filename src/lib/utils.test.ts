import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('classes com tokens Kronos', () => {
  it('permite substituir medidas e raios sem classes conflitantes', () => {
    expect(cn('min-h-button', 'min-h-0')).toBe('min-h-0')
    expect(cn('rounded-inner', 'rounded-none')).toBe('rounded-none')
    expect(cn('size-touch', 'size-8')).toBe('size-8')
  })

  it('resolve substituições responsivas preservando variantes diferentes', () => {
    expect(cn('md:rounded-inner', 'md:rounded-outer')).toBe('md:rounded-outer')
    expect(cn('h-touch', 'md:h-button')).toBe('h-touch md:h-button')
    expect(cn('px-gutter', false, 'px-4')).toBe('px-4')
  })
})
