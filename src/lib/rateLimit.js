// src/lib/rateLimit.js
// Rate limiting por IP (contador ATÓMICO en Supabase vía función increment_rate_limit) + verificación de origen.
// Requiere ejecutar antes rate_limit_setup.sql en Supabase. Si la función no existe, NO bloquea (fail-open).

const LIMITS = {
  '/api/calculate':       { max: 10, windowMin: 60 }, // 10 diagnósticos/hora
  '/api/chat':            { max: 30, windowMin: 60 }, // 30 mensajes/hora
  '/api/extract-invoice': { max: 15, windowMin: 60 }, // 15 facturas/hora (gasta créditos de IA)
  '/api/create-payment':  { max: 10, windowMin: 60 },
  '/api/alegra-connect':  { max: 5,  windowMin: 60 },
  '/api/siigo-connect':   { max: 5,  windowMin: 60 },
  '/api/csv-import':      { max: 20, windowMin: 60 },
  default:                { max: 100, windowMin: 60 },
}

const WHITELIST_IPS = ['::1', '127.0.0.1']

function getClientIP(req) {
  return (
    req.headers['x-vercel-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

function getWindowStart(windowMin) {
  const ms = windowMin * 60 * 1000
  return new Date(Math.floor(Date.now() / ms) * ms).toISOString()
}

export async function checkRateLimit(req, res, endpoint) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return true // sin Supabase → no bloquear

  const ip = getClientIP(req)
  const limit = LIMITS[endpoint] || LIMITS.default
  if (WHITELIST_IPS.includes(ip)) return true

  try {
    // Un solo paso atómico: inserta o suma 1 y devuelve el contador de la ventana actual
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_rate_limit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      body: JSON.stringify({ p_key: `ip:${ip}`, p_endpoint: endpoint, p_window: getWindowStart(limit.windowMin) }),
    })
    if (!r.ok) {
      console.error('Rate limit RPC error:', r.status, (await r.text()).slice(0, 200))
      return true // fail-open
    }
    const currentCount = Number(await r.json()) || 0

    if (currentCount > limit.max) {
      res.setHeader('X-RateLimit-Limit', limit.max)
      res.setHeader('X-RateLimit-Remaining', 0)
      res.setHeader('Retry-After', String(limit.windowMin * 60))
      res.status(429).json({
        error: 'rate_limit_exceeded',
        message: `Límite de ${limit.max} solicitudes por ${limit.windowMin} minutos alcanzado. Intenta más tarde.`,
        retry_after_minutes: limit.windowMin,
      })
      return false
    }
    res.setHeader('X-RateLimit-Limit', limit.max)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit.max - currentCount))
    return true
  } catch (err) {
    console.error('Rate limit check error:', err)
    return true // fail-open
  }
}

// ── Verificación de origen ────────────────────────────────────────────────────
// Coincidencia EXACTA del origen (antes startsWith permitía https://ecometrix.app.evil.com y bloqueaba www).
const ALLOWED_ORIGINS = [
  'https://www.ecometrix.app',
  'https://ecometrix.app',
  'https://ecometrix-app-one.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

function originOf(url) {
  try { return new URL(url).origin } catch { return '' }
}

export function checkOrigin(req, res) {
  const allowed = [...ALLOWED_ORIGINS, process.env.ALLOWED_ORIGIN].filter(Boolean)
  const origin = req.headers.origin
  const referer = req.headers.referer
  const candidate = origin ? originOf(origin) : referer ? originOf(referer) : null

  // Sin Origin ni Referer: llamadas servidor-a-servidor (el control real es auth + rate limit)
  if (candidate === null) return true

  if (!allowed.includes(candidate)) {
    res.status(403).json({ error: 'forbidden', message: 'Origen no autorizado' })
    return false
  }
  return true
}

// Verifica el JWT de Supabase (Authorization: Bearer <token>). Devuelve el usuario o responde 401.
export async function requireUser(req, res) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) {
    res.status(401).json({ error: 'unauthorized', message: 'Inicia sesión para usar esta función.' })
    return null
  }
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` },
    })
    if (!r.ok) throw new Error('invalid')
    const user = await r.json()
    if (!user?.id) throw new Error('invalid')
    return user
  } catch {
    res.status(401).json({ error: 'unauthorized', message: 'Sesión inválida o expirada.' })
    return null
  }
}
