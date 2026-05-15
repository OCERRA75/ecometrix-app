// netlify/functions/chat.js
// POST /api/chat — proxy hacia Claude API con contexto EcoMetriX

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'El asistente de IA no está disponible en este momento. Para consultas, escríbenos a oscar@ecometrix.co'
      })
    }
  }

  try {
    const { messages, system } = JSON.parse(event.body)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: system || 'Eres el asistente de EcoMetriX, experto en huella de carbono, GHG Protocol, ISO 14064 y CSRD. Responde en español, de forma clara y concisa.',
        messages: messages.slice(-8), // últimos 8 mensajes para contexto
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Claude API error:', data)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Error al procesar tu pregunta. Intenta de nuevo.' })
      }
    }

    const text = data.content?.[0]?.text || 'No pude generar una respuesta.'

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    }

  } catch (err) {
    console.error('Chat function error:', err)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Error de conexión. Intenta de nuevo en un momento.' })
    }
  }
}
