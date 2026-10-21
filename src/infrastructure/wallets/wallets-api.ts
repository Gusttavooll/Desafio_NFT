import { httpClient } from '@/infrastructure/http/http-client'
import type { CreateWalletBody, UpdateWalletBody, WalletDto, WalletsResponse } from './dto'

export async function getWallets(signal?: AbortSignal): Promise<WalletsResponse> { return (await httpClient.get<WalletsResponse>('/wallets', { signal })).data }
export async function saveWallet(body: CreateWalletBody, id?: string, signal?: AbortSignal): Promise<WalletDto> {
  if (id) return (await httpClient.patch<WalletDto>(`/wallets/${encodeURIComponent(id)}`, body satisfies UpdateWalletBody, { signal })).data
  return (await httpClient.post<WalletDto>('/wallets', body, { signal })).data
}
export function walletDraft(owner: string, kind: string, value?: CreateWalletBody | null): CreateWalletBody | null {
  try {
    const key = `kronos.wallet-draft:${owner}:${kind}`
    if (value === null) localStorage.removeItem(key)
    else if (value) localStorage.setItem(key, JSON.stringify(value))
    return JSON.parse(localStorage.getItem(key) ?? 'null') as CreateWalletBody | null
  } catch { return null }
}
