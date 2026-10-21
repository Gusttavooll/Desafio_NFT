import { describe, expect, it } from 'vitest'
import { scopedQueryKey } from './query-keys'

describe('scopedQueryKey', () => {
  it('inclui o id do colecionador na chave', () => {
    expect(scopedQueryKey('user-1', 'cart')).toEqual(['user', 'user-1', 'cart'])
  })

  it('usa um escopo próprio para o visitante', () => {
    expect(scopedQueryKey(null, 'cart')).toEqual(['guest', 'cart'])
  })

  it('separa as chaves de colecionadores diferentes', () => {
    expect(scopedQueryKey('user-1', 'favorites')).not.toEqual(scopedQueryKey('user-2', 'favorites'))
  })

  it('preserva todos os parâmetros da consulta', () => {
    const params = { search: 'ape', page: 2 }
    expect(scopedQueryKey(null, 'catalog', params)).toEqual(['guest', 'catalog', params])
  })
})
