import { describe, expect, it } from 'vitest'
import { buildDomainEvent, createVersionRegistry } from './events'

describe('createVersionRegistry', () => {
  it('começa a Versão de um recurso novo em 1', () => {
    const versions = createVersionRegistry()
    expect(versions.next('nft', 'nft-1')).toBe(1)
  })

  it('incrementa a Versão por recurso, sem misturar recursos', () => {
    const versions = createVersionRegistry()
    versions.next('nft', 'nft-1')
    versions.next('nft', 'nft-1')
    expect(versions.next('nft', 'nft-1')).toBe(3)
    expect(versions.next('nft', 'nft-2')).toBe(1)
    expect(versions.next('order', 'nft-1')).toBe(1)
  })

  it('devolve a Versão atual sem incrementar', () => {
    const versions = createVersionRegistry()
    expect(versions.current('order', 'o1')).toBe(0)
    versions.next('order', 'o1')
    expect(versions.current('order', 'o1')).toBe(1)
  })

  it('restaura as Versões de um snapshot', () => {
    const versions = createVersionRegistry({ 'nft:nft-1': 7 })
    expect(versions.next('nft', 'nft-1')).toBe(8)
    expect(versions.snapshot()).toEqual({ 'nft:nft-1': 8 })
  })
})

describe('buildDomainEvent', () => {
  it('monta o envelope { id, resource, resourceId, version, occurredAt, payload }', () => {
    const event = buildDomainEvent({
      resource: 'order',
      resourceId: 'o1',
      version: 2,
      payload: { status: 'confirmed' },
      now: new Date('2026-10-21T12:00:00.000Z'),
      id: 'evt-fixo',
    })
    expect(event).toEqual({
      id: 'evt-fixo',
      resource: 'order',
      resourceId: 'o1',
      version: 2,
      occurredAt: '2026-10-21T12:00:00.000Z',
      payload: { status: 'confirmed' },
    })
  })

  it('gera ids únicos quando o id não é informado', () => {
    const base = { resource: 'nft', resourceId: 'n1', version: 1, payload: {} } as const
    expect(buildDomainEvent(base).id).not.toBe(buildDomainEvent(base).id)
  })
})
