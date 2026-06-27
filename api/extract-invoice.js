// api/extract-invoice.js
import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
  try {
    const { base64, mimeType } = req.body
    if (!base64) return res.status(400).json({ ok: false, error: 'No file provided' })

    const tipo = mimeType || 'image/jpeg'
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!tiposPermitidos.includes(tipo)) {
      return res.status(422).json({ ok: false, error: 'Solo se aceptan imagenes JPG o PNG.' })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: tipo, data: base64 } },
          { type: 'text', text: 'Eres experto en GHG Protocol. Analiza esta factura y extrae datos de emisiones CO2. Responde SOLO JSON valido sin markdown:\n{"proveedor":"","tipo_documento":"factura_electricidad|factura_gas|factura_combustible|otro","fecha":null,"items":[{"descripcion":"","cantidad":0,"unidad":"kWh|m3|galones|litros|km|kg","valor_cop":0,"alcance_ghg":1,"categoria":"electricidad|gas_natural|gasolina|diesel|acpm|gas_propano|otro","campo_cuestionario":"consumo_electricidad|consumo_gas_natural|consumo_gasolina|consumo_diesel|consumo_acpm|consumo_gas_propano|km_carga|km_empleados|null"}],"resumen":"","confianza":"alta|media|baja"}' }
        ]
      }]
    })

    const rawText = claudeRes.content[0].text.trim()
    let clasificacion
    try { clasificacion = JSON.parse(rawText) }
    catch { const m = rawText.match(/\{[\s\S]*\}/); if (m) clasificacion = JSON.parse(m[0]); else throw new Error('JSON invalido') }

    return res.status(200).json({ ok: true, clasificacion })
  } catch (err) {
    console.error('[extract-invoice]', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
