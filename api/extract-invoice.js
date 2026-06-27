import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  try {
    const { base64, mimeType } = req.body
    if (!base64) return res.status(400).json({ ok: false, error: 'No file provided' })
    const tipo = mimeType || 'image/jpeg'
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: tipo, data: base64 } },
          { type: 'text', text: 'Analiza esta factura de servicios publicos. Responde SOLO JSON sin markdown: {"proveedor":"","tipo_documento":"factura_electricidad|factura_gas|factura_combustible|otro","items":[{"descripcion":"","cantidad":0,"unidad":"kWh|m3|galones|litros","alcance_ghg":2,"categoria":"electricidad|gas_natural|gasolina|diesel|acpm","campo_cuestionario":"consumo_electricidad|consumo_gas_natural|consumo_gasolina|consumo_diesel|consumo_acpm|null"}],"resumen":"","confianza":"alta|media|baja"}' }
        ]
      }]
    })
    let clasificacion
    try { clasificacion = JSON.parse(claudeRes.content[0].text.trim()) }
    catch(e) { const m = claudeRes.content[0].text.match(/\{[\s\S]*\}/); clasificacion = m ? JSON.parse(m[0]) : null }
    if (!clasificacion) throw new Error('No se pudo interpretar respuesta')
    return res.status(200).json({ ok: true, clasificacion })
  } catch (err) {
    console.error('[extract-invoice]', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
}