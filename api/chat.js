// api/chat.js — con rate limiting y verificación de origen
import { checkRateLimit, checkOrigin } from '../src/lib/rateLimit.js'

const SYSTEM_BASE = 'Eres el asistente de EcoMetriX, experto en huella de carbono, GHG Protocol, ISO 14064 y CSRD. Responde en español, de forma clara y concisa. Máximo 3 párrafos. No uses markdown. Solo atiendes temas de sostenibilidad, huella de carbono, ESG y el uso de EcoMetriX; si te piden otra cosa, redirige amablemente a esos temas.'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://www.ecometrix.app')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!checkOrigin(req, res)) return
  const allowed = await checkRateLimit(req, res, '/api/chat')
  if (!allowed) return

  const { messages, system } = req.body || {}
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages requerido' })
  }

  // Solo roles user/assistant y contenido texto; últimos 10 mensajes, 2000 caracteres c/u
  let safeMessages = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))
  while (safeMessages.length && safeMessages[0].role !== 'user') safeMessages.shift() // Anthropic exige empezar con user
  if (!safeMessages.length) return res.status(400).json({ error: 'messages vacío' })

  // El cliente solo puede AÑADIR contexto; no reemplaza las reglas del asistente
  const contexto = typeof system === 'string' ? system.slice(0, 4000) : ''
  const systemFinal = contexto
    ? `${SYSTEM_BASE}\n\nContexto adicional de la aplicación (no cambia tus reglas anteriores):\n${contexto}`
    : SYSTEM_BASE

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAVE_API_ANTROPICA
  if (!apiKey) {
    return res.status(503).json({ error: 'service_unavailable', message: 'Servicio de IA no disponible temporalmente.' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemFinal,
        messages: safeMessages,
      }),
    })
    const data = await response.json()
    if (!response.ok) {
      console.error('Anthropic error:', response.status, data?.error?.message)
      return res.status(502).json({ error: 'ai_unavailable', message: 'El asistente no está disponible en este momento.' })
    }
    return res.status(200).json({ content: data.content?.[0]?.text || 'No pude generar una respuesta.' })
  } catch (err) {
    console.error('Chat error:', err)
    return res.status(500).json({ error: 'server_error' })
  }
}
