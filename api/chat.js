// api/chat.js — con rate limiting y verificación de origen
import { checkRateLimit, checkOrigin } from './middleware/rateLimit.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://ecometrix-app-one.vercel.app')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ── Verificar origen ──────────────────────────────────────────────────────
  if (!checkOrigin(req, res)) return

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const allowed = await checkRateLimit(req, res, '/api/chat')
  if (!allowed) return

  const { messages, system } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages requerido' })
  }

  // Limitar longitud del historial para no gastar tokens
  const MAX_MESSAGES = 10
  const trimmedMessages = messages.slice(-MAX_MESSAGES)

  // Limitar longitud de cada mensaje
  const MAX_CHARS = 2000
  const safeMessages = trimmedMessages.map(m => ({
    role: m.role,
    content: typeof m.content === 'string'
      ? m.content.slice(0, MAX_CHARS)
      : m.content,
  }))

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAVE_API_ANTROPICA

  if (!apiKey) {
    return res.status(503).json({ error: 'service_unavailable', message: 'Servicio de IA no disponible temporalmente.' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Haiku: más barato para chat
        max_tokens: 512, // reducido de 1024
        system: system || 'Eres el asistente de EcoMetriX, experto en huella de carbono, GHG Protocol, ISO 14064 y CSRD. Responde en español, de forma clara y concisa. Máximo 3 párrafos. No uses markdown.',
        messages: safeMessages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Anthropic error:', data)
      return res.status(500).json({ error: 'anthropic_error', message: data.error?.message })
    }

    const content = data.content?.[0]?.text || 'No pude generar una respuesta.'
    return res.status(200).json({ content })
  } catch (err) {
    console.error('Chat error:', err)
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}
