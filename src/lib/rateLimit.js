// api/middleware/rateLimit.js
// Rate limiting por IP + user_id usando Supabase como store
// Uso: import { checkRateLimit } from './middleware/rateLimit.js'

const LIMITS = {
  '/api/calculate': { max: 10,  windowMin: 60  }, // 10 diagnósticos/hora
  '/api/chat':      { max: 30,  windowMin: 60  }, // 30 mensajes/hora
  '/api/alegra-connect': { max: 5, windowMin: 60 },
  '/api/siigo-connect':  { max: 5, windowMin: 60 },
  '/api/csv-import':     { max: 20, windowMin: 60 },
  default:          { max: 100, windowMin: 60  },
}

// IPs permitidas sin límite (tu IP fija, Vercel previews, etc.)
const WHITELIST_IPS = [
  '::1',        // localhost
  '127.0.0.1',
]

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    'unknown'
  )
}

function getWindowStart(windowMin) {
  const now = new Date()
  const ms = windowMin * 60 * 1000
  return new Date(Math.floor(now.getTime() / ms) * ms).toISOString()
}

export async function checkRateLimit(req, res, endpoint) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) return true // sin Supabase → no bloquear

  const ip = getClientIP(req)
  const limit = LIMITS[endpoint] || LIMITS.default

  // Whitelist: superadmins y localhost sin límite
  if (WHITELIST_IPS.includes(ip)) return true

  const windowStart = getWindowStart(limit.windowMin)
  const key = `ip:${ip}`

  try {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    }

    // Upsert: incrementar contador en la ventana actual
    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/rate_limits`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        key,
        endpoint,
        window_start: windowStart,
        count: 1,
      }),
    })

    if (!upsertRes.ok) {
      // Si ya existe, hacer UPDATE count++
      await fetch(
        `${supabaseUrl}/rest/v1/rate_limits?key=eq.${encodeURIComponent(key)}&endpoint=eq.${encodeURIComponent(endpoint)}&window_start=eq.${encodeURIComponent(windowStart)}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({ count: 999 }), // placeholder — usamos RPC abajo
        }
      )
    }

    // Leer el conteo actual
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/rate_limits?key=eq.${encodeURIComponent(key)}&endpoint=eq.${encodeURIComponent(endpoint)}&window_start=eq.${encodeURIComponent(windowStart)}&select=count`,
      { headers }
    )
    const countData = await countRes.json()
    const currentCount = countData?.[0]?.count || 0

    if (currentCount > limit.max) {
      res.setHeader('X-RateLimit-Limit', limit.max)
      res.setHeader('X-RateLimit-Remaining', 0)
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + limit.windowMin * 60 * 1000).toISOString())
      res.status(429).json({
        error: 'rate_limit_exceeded',
        message: `Límite de ${limit.max} requests por ${limit.windowMin} minutos alcanzado. Intenta más tarde.`,
        retry_after_minutes: limit.windowMin,
      })
      return false
    }

    res.setHeader('X-RateLimit-Limit', limit.max)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit.max - currentCount))
    return true

  } catch (err) {
    console.error('Rate limit check error:', err)
    return true // en caso de error → no bloquear
  }
}

// Verificar origen del request (solo desde tu dominio)
export function checkOrigin(req, res) {
  const origin = req.headers.origin || ''
  const referer = req.headers.referer || ''

  const ALLOWED_ORIGINS = [
    'https://ecometrix-app-one.vercel.app',
    'https://ecometrix.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ]

  const isAllowed =
    ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o)) ||
    !origin // requests server-to-server sin origin

  if (!isAllowed) {
    res.status(403).json({ error: 'forbidden', message: 'Origen no autorizado' })
    return false
  }

  return true
}
