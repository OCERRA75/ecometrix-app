// api/chat.js — Vercel Serverless Function (fetch directo, sin SDK)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages, system } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages requerido' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAVE_API_ANTROPICA

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: system || 'Eres el asistente de EcoMetriX, experto en huella de carbono, GHG Protocol, ISO 14064 y CSRD. Responde en español, de forma clara y concisa. No uses markdown.',
        messages,
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
