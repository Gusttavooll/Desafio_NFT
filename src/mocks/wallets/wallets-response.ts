import { HttpResponse } from 'msw'
import { resolveSecondaryWallet, validateWallet } from '@/domain/wallets'
import type { CreateWalletBody, UpdateWalletBody, WalletDto } from '@/infrastructure/wallets'
import { forcedResponseFor, requireSession, respondForced, respondWithError, type Simulation } from '@/mocks/core'

export async function walletsResponse(sim: Simulation, request: Request, id?: string): Promise<Response> {
  if (sim.scenarioConfig().networkError) return HttpResponse.error()
  const forced = forcedResponseFor(sim.scenarioConfig(), `${request.method} /wallets${id ? '/:id' : ''}`)
  if (forced) return respondForced(forced)
  const session = requireSession(sim, request)
  if (!session.ok) return session.response
  const collectorId = session.collector.id
  const wallets = sim.state().wallets[collectorId] ?? []
  const primary = wallets.find(wallet => wallet.kind === 'primary') ?? null
  const secondary = resolveSecondaryWallet(primary, wallets.find(wallet => wallet.kind === 'secondary') ?? null)
  if (request.method === 'GET') return HttpResponse.json({ primary, secondary })
  let body: CreateWalletBody | UpdateWalletBody
  try { body = await request.json() as CreateWalletBody | UpdateWalletBody } catch { return respondWithError(422, 'validation_error', 'Dados da carteira inválidos.') }
  if (!body || typeof body !== 'object') return respondWithError(422, 'validation_error', 'Dados da carteira inválidos.')
  const previous = id ? wallets.find(wallet => wallet.id === id) : undefined
  if (id && !previous) return respondWithError(404, 'not_found', 'Carteira não encontrada.')
  const kind = previous?.kind ?? (body as CreateWalletBody).kind
  if (!id && wallets.some(wallet => wallet.kind === kind)) return respondWithError(422, 'validation_error', 'Já existe uma carteira deste tipo. Edite a carteira cadastrada.', { kind: 'Uma carteira por tipo.' })
  if (body.sameAsPrimary && kind === 'secondary' && !primary) return respondWithError(422, 'validation_error', 'Cadastre primeiro a carteira principal.', { sameAsPrimary: 'A carteira principal ainda não existe.' })
  const next = { ...previous, ...body, id: previous?.id ?? `wallet-${crypto.randomUUID()}`, kind } as WalletDto
  const resolved = next.sameAsPrimary && kind === 'secondary' ? resolveSecondaryWallet(primary, next)! : next
  const errors = validateWallet(resolved)
  if (Object.keys(errors).length) return respondWithError(422, 'validation_error', 'Confira os campos da carteira.', errors)
  const saved: WalletDto = { ...resolved, nickname: resolved.nickname.trim(), displayName: resolved.displayName.trim(), username: resolved.username.trim(), email: resolved.email.trim(), ensName: resolved.ensName?.trim() }
  sim.update(state => { state.wallets[collectorId] = [...wallets.filter(wallet => wallet.id !== saved.id), saved] })
  return HttpResponse.json(saved, { status: id ? 200 : 201 })
}
