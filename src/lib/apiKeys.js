// src/lib/apiKeys.js — validación de API keys (hash SHA-256 en la tabla api_keys) + límite por llave y plan
import crypto from 'crypto'
import { checkRateLimit, getClientIP } from './rateLimit.js'

const DEMO_KEY = 'ecm_demo_key'
const LIMITE_DEMO = { max: 20, windowMin: 60 }
const LIMITE_FALLIDOS = { max: 30, windowMin: 60 }
const LIMITES_PLAN = { pro: { max: 100, windowMin: 60 }, enterprise: { max: 1000, windowMin: 60 } }

// Devuelve { demo:true } | { id, user_id, plan } o responde 401/429/503 y devuelve null
export async function autenticarApiKey(req, res, endpoint) {
  const key = String(req.headers['x-api-key'] || req.headers.authorization?.replace(/^Bearer\s+/i, '') || '').trim()
  const ip = getClientIP(req)

  const invalida = async () => {
    // Frena a quien prueba llaves al azar
    if (!(await checkRateLimit(req, res, '/api/v1/invalid-key', { identity: `ip:${ip}`, limit: LIMITE_FALLIDOS }))) return null
    res.status(401).json({ error: 'unauthorized', message: 'API key inválida o ausente. Incluir header: X-API-Key: ecm_...', docs: 'https://www.ecometrix.app/developers' })
    return null
  }
  if (!key.startsWith('ecm_') || key.length > 100) return invalida()

  if (key === DEMO_KEY) {
    return (await checkRateLimit(req, res, endpoint, { identity: `demo:${ip}`, limit: LIMITE_DEMO })) ? { demo: true } : null
  }

  const hash = crypto.createHash('sha256').update(key).digest('hex')
  let rows
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/api_keys?key_hash=eq.${hash}&revoked_at=is.null&select=id,user_id,plan&limit=1`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    })
    if (!r.ok) throw new Error(`status ${r.status}`)
    rows = await r.json()
  } catch (e) {
    console.error('api key lookup error:', e.message)
    res.status(503).json({ error: 'service_unavailable', message: 'Servicio no disponible temporalmente.' })
    return null // fail-closed: sin verificar la llave no se atiende
  }
  if (!Array.isArray(rows) || rows.length === 0) return invalida()

  const k = rows[0]
  const limit = LIMITES_PLAN[k.plan] || LIMITES_PLAN.pro
  return (await checkRateLimit(req, res, endpoint, { identity: `key:${k.id}`, limit })) ? k : null
}
