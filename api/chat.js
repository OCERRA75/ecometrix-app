// api/chat.js — Vercel Serverless Function
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: system || 'Eres el asistente de EcoMetriX, experto en huella de carbono, GHG Protocol, ISO 14064 y CSRD. Responde en español, de forma clara y concisa. No uses markdown.',
      messages,
    })

    const content = response.content[0]?.text || 'No pude generar una respuesta.'
    return res.status(200).json({ content })
  } catch (err) {
    console.error('Chat error:', err)
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}
