import { HttpResponse } from 'msw'
import { validateAvatar, validatePasswordChange, validateProfile, validateRegistration, type AccountFields } from '@/domain/account'
import type { CollectorDto, SessionDto } from '@/infrastructure/account'
import { forcedResponseFor, generateSalt, generateToken, hashPassword, requireSession, respondForced, respondWithError, verifyPassword, type Simulation, type StoredCollector } from '@/mocks/core'
import { sessionResponse } from './session-response'

function publicCollector(stored: StoredCollector): CollectorDto {
  const { id, displayName, username, email, ensName, avatarUrl } = stored
  return { id, displayName, username, email, ensName, avatarUrl: avatarUrl ?? null }
}
const invalid = (fields: AccountFields) => respondWithError(422, 'validation_error', 'Confira os campos destacados.', fields)
const text = (value: unknown) => typeof value === 'string' ? value : ''
async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try { const body: unknown = await request.json(); return body !== null && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null } catch { return null }
}
function duplicates(sim: Simulation, email: string, username: string, except?: string): AccountFields {
  const fields: AccountFields = {}
  for (const collector of sim.state().collectors) {
    if (collector.id === except) continue
    if (collector.email.toLowerCase() === email.toLowerCase()) fields.email = 'Este e-mail já está cadastrado.'
    if (collector.username.toLowerCase() === username.toLowerCase()) fields.username = 'Este nome de usuário já está em uso.'
  }
  return fields
}
function startSession(sim: Simulation, collector: StoredCollector, request: Request, status = 200) {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const oldToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  sim.update(state => {
    state.sessions = state.sessions.filter(session => session.token !== oldToken && Date.parse(session.expiresAt) > Date.now())
    state.sessions.push({ token, expiresAt, collectorId: collector.id })
  })
  // A reautenticação é a saída do cenário demonstrativo de expiração.
  if (sim.scenario() === 'session-expired') sim.setScenario('success')
  return HttpResponse.json({ token, expiresAt, collector: publicCollector(collector) } satisfies SessionDto, { status })
}
function validAvatarData(value: string): boolean {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match?.[1] || !match[2]) return false
  try {
    const bytes = atob(match[2])
    if (validateAvatar({ type: match[1], size: bytes.length })) return false
    if (match[1] === 'image/png') return bytes.startsWith('\x89PNG\r\n\x1a\n')
    if (match[1] === 'image/jpeg') return bytes.startsWith('\xff\xd8\xff')
    return bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP'
  } catch { return false }
}

export async function accountResponse(sim: Simulation, request: Request): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/^\/api/, '')
  const route = `${request.method} ${path}`
  if (route === 'GET /auth/session') return sessionResponse(sim, request)
  const config = sim.scenarioConfig()
  if (config.networkError) return HttpResponse.error()
  if (route === 'POST /auth/register' && sim.scenario() === 'register-conflict') return respondWithError(409, 'validation_error', 'E-mail ou usuário já cadastrado.', { email: 'Este e-mail já está cadastrado.', username: 'Este nome de usuário já está em uso.' })
  const forced = forcedResponseFor(config, route) ?? (config.forced['*']?.code === 'unavailable' ? config.forced['*'] : undefined)
  if (forced) return respondForced(forced)

  if (route === 'POST /auth/login' || route === 'POST /auth/register') {
    const body = await readBody(request)
    if (!body) return invalid({ email: 'Informe os dados da conta.' })
    const email = text(body.email).trim().toLowerCase()
    const password = text(body.password)
    if (route === 'POST /auth/login') {
      const collector = sim.state().collectors.find(entry => entry.email.toLowerCase() === email)
      if (!collector || !(await verifyPassword(password, collector.salt, collector.passwordHash))) return respondWithError(401, 'forbidden', 'E-mail ou senha incorretos.')
      return startSession(sim, collector, request)
    }
    const displayName = text(body.displayName).trim()
    const username = text(body.username).trim()
    const fields = validateRegistration({ displayName, username, email, password })
    if (Object.keys(fields).length) return invalid(fields)
    const conflicts = duplicates(sim, email, username)
    if (Object.keys(conflicts).length) return respondWithError(409, 'validation_error', 'Não foi possível criar a conta.', conflicts)
    const salt = generateSalt()
    const collector: StoredCollector = { id: `collector-${crypto.randomUUID()}`, displayName, username, email, avatarUrl: null, salt, passwordHash: await hashPassword(password, salt) }
    // O hash é assíncrono: revalida a unicidade imediatamente antes da escrita.
    const changed = duplicates(sim, email, username)
    if (Object.keys(changed).length) return respondWithError(409, 'validation_error', 'Não foi possível criar a conta.', changed)
    sim.update(state => { state.collectors.push(collector); state.wallets[collector.id] = []; state.favorites[collector.id] = []; state.carts[collector.id] = [] })
    return startSession(sim, collector, request, 201)
  }

  if (route === 'POST /auth/logout') {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    sim.update(state => { state.sessions = state.sessions.filter(session => session.token !== token) })
    return new HttpResponse(null, { status: 204 })
  }
  const auth = requireSession(sim, request)
  if (!auth.ok) return auth.response
  if (route === 'GET /me') return HttpResponse.json(publicCollector(auth.collector))
  const body = await readBody(request)
  if (!body) return invalid({ form: 'Envie dados válidos.' })

  if (route === 'PATCH /me') {
    const current = auth.collector
    const next = {
      displayName: body.displayName === undefined ? current.displayName : text(body.displayName).trim(),
      username: body.username === undefined ? current.username : text(body.username).trim(),
      email: body.email === undefined ? current.email : text(body.email).trim().toLowerCase(),
      ensName: body.ensName === undefined ? current.ensName : text(body.ensName).trim(),
    }
    const fields = validateProfile(next)
    if (Object.keys(fields).length) return invalid(fields)
    const conflicts = duplicates(sim, next.email, next.username, current.id)
    if (Object.keys(conflicts).length) return respondWithError(409, 'validation_error', 'Confira os campos destacados.', conflicts)
    sim.update(() => Object.assign(current, next))
    return HttpResponse.json(publicCollector(current))
  }
  if (route === 'PUT /me/avatar') {
    const avatarUrl = body.avatarUrl
    if (avatarUrl !== null && (typeof avatarUrl !== 'string' || !validAvatarData(avatarUrl))) return invalid({ avatar: 'Use uma imagem PNG, JPG ou WebP válida, de até 2 MB.' })
    sim.update(() => { auth.collector.avatarUrl = avatarUrl as string | null })
    return HttpResponse.json(publicCollector(auth.collector))
  }
  if (route === 'POST /me/password') {
    const currentPassword = text(body.currentPassword)
    const newPassword = text(body.newPassword)
    const fields = validatePasswordChange({ currentPassword, newPassword })
    if (Object.keys(fields).length) return invalid(fields)
    if (!(await verifyPassword(currentPassword, auth.collector.salt, auth.collector.passwordHash))) return invalid({ currentPassword: 'A senha atual está incorreta.' })
    const salt = generateSalt()
    const passwordHash = await hashPassword(newPassword, salt)
    sim.update(() => { auth.collector.salt = salt; auth.collector.passwordHash = passwordHash })
    return new HttpResponse(null, { status: 204 })
  }
  return respondWithError(404, 'not_found', 'Recurso de conta não encontrado.')
}
