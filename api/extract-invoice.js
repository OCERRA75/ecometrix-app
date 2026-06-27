// api/extract-invoice.js
// Usa Claude Vision directamente — sin AWS Textract
import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const { base64, mimeType } = req.body
    if (!base64) {
      return res.status(400).json({ ok: false, error: 'No file provided' })
    }

    // Validar tipo de archivo — Claude Vision acepta imágenes pero no PDF directamente
    // Para PDF convertimos a imagen en el cliente, aquí solo aceptamos imágenes
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const tipo = mimeType || 'image/jpeg'

    if (!tiposPermitidos.includes(tipo)) {
      return res.status(422).json({ ok: false, error: 'Solo se aceptan imágenes (JPG, PNG). Para PDFs, toma una captura de pantalla primero.' })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: tipo,
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Eres un experto en huella de carbono y GHG Protocol. Analiza esta factura o documento y extrae los datos relevantes para calcular emisiones de CO2.

Responde SOLO con JSON válido, sin markdown ni texto adicional:
{
  "proveedor": "nombre empresa emisora",
  "tipo_documento": "factura_gas|factura_electricidad|factura_combustible|factura_agua|ticket_transporte|otro",
  "fecha": "YYYY-MM o null",
  "items": [
    {
      "descripcion": "descripción del consumo",
      "cantidad": 0,
      "unidad": "kWh|m3|galones|litros|km|kg|null",
      "valor_cop": 0,
      "alcance_ghg": 1,
      "categoria": "electricidad|gas_natural|gasolina|diesel|acpm|gas_propano|transporte_carga|transporte_empleados|otro",
      "campo_cuestionario": "consumo_electricidad|consumo_gas_natural|consumo_gasolina|consumo_diesel|consumo_acpm|consumo_gas_propano|km_carga|km_empleados|null"
    }
  ],
  "resumen": "descripción breve en español de qué contiene y qué emisiones genera",
  "confianza": "alta|media|baja"
}`,
          },
        ],
      }],
    })

    const rawText = claudeRes.content[0].text.trim()
    let clasificacion
    try {
      clasificacion = JSON.parse(rawText)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) {
        clasificacion = JSON.parse(match[0])
      } else {
        throw new Error('No se pudo interpretar la respuesta de IA')
      }
    }

    return res.status(200).json({ ok: true, clasificacion })

  } catch (err) {
    console.error('[extract-invoice]', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
