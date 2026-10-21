import { describe, expect, it } from 'vitest'
import { DEFAULT_SCENARIO, SCENARIO_NAMES, resolveScenario } from './scenario'

describe('resolveScenario', () => {
  it('usa o Cenário da URL quando ele existe', () => {
    expect(resolveScenario({ search: '?scenario=slow', persisted: 'empty' })).toBe('slow')
  })

  it('usa o Cenário persistido quando a URL não traz `scenario`', () => {
    expect(resolveScenario({ search: '?page=2', persisted: 'payment-rejected' })).toBe('payment-rejected')
  })

  it('usa `success` quando não há URL nem Cenário persistido', () => {
    expect(resolveScenario({ search: '', persisted: null })).toBe('success')
    expect(DEFAULT_SCENARIO).toBe('success')
  })

  it('ignora nome de Cenário desconhecido na URL e cai no persistido', () => {
    expect(resolveScenario({ search: '?scenario=nao-existe', persisted: 'empty' })).toBe('empty')
  })

  it('ignora Cenário persistido desconhecido', () => {
    expect(resolveScenario({ search: '', persisted: 'antigo' })).toBe('success')
  })

  it('expõe os 15 Cenários da spec de Simulação', () => {
    expect([...SCENARIO_NAMES].sort()).toEqual(
      [
        'success',
        'empty',
        'slow',
        'out-of-order',
        'network-error',
        'server-error',
        'session-expired',
        'register-conflict',
        'coupon-invalid',
        'coupon-expired',
        'price-changed',
        'edition-sold-out',
        'order-timeout',
        'payment-confirmed',
        'payment-rejected',
      ].sort(),
    )
  })
})
