import { httpClient } from '@/infrastructure/http/http-client'
import type { FavoritesResponse } from './dto'
export async function getFavorites(signal?: AbortSignal) {
  return (await httpClient.get<FavoritesResponse>('/favorites', { signal })).data.nftIds
}
export async function setFavorite(nftId: string, selected: boolean) {
  const url = `/favorites/${encodeURIComponent(nftId)}`
  return (selected ? await httpClient.put<FavoritesResponse>(url) : await httpClient.delete<FavoritesResponse>(url)).data.nftIds
}
