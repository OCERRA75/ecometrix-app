// api/extract-invoice.js
import Anthropic from '@anthropic-ai/sdk'
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const { base64 } = req.body
    if (!base64) {
      return res.status(400).json({ ok: false, error: 'No file provided' })
    }

    // 1. Extraer texto con AWS Textract
    const textract = new TextractClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })

    const buffer = Buffer.from(base64, 'base64')

    const textractRes = await textract.send(
      new DetectDocumentTextCommand({ Document: { Bytes: buffer } })
    )

    const textoExtraido = textractRes.Blocks
      .filter(b => b.BlockType === 'LINE')
      .map(b => b.Text)
      .join('\n')

    if (!textoExtraido || textoExtraido.trim().length < 20) {
      return res.status(422).json({ ok: false, error: 'No se pudo extraer texto del documento. Verifica que la imagen sea legible.' })
    }

    // 2. Clasificar con Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Eres un experto en huella de carbono corporativa y GHG Protocol.
Analiza este texto extraído de una factura empresarial y extrae datos para calcular emisiones CO2.

TEXTO:
${textoExtraido.substring(0, 3000)}

Responde SOLO JSON válido, sin markdown ni texto extra:
{
  "proveedor": "nombre empresa emisora",
  "tipo_documento": "factura_gas|factura_electricidad|factura_combustible|otro",
  "fecha": "YYYY-MM o null",
  "items": [
    {
      "descripcion": "descripción",
      "cantidad": 0,
      "unidad": "kWh|m3|galones|litros|km|kg|null",
      "valor_cop": 0,
      "alcance_ghg": 1,
      "categoria": "electricidad|gas_natural|gasolina|diesel|acpm|gas_propano|transporte_carga|transporte_empleados|otro",
      "campo_cuestionario": "consumo_electricidad|consumo_gas_natural|consumo_gasolina|consumo_diesel|consumo_acpm|consumo_gas_propano|km_carga|km_empleados|null"
    }
  ],
  "resumen": "descripción breve en español",
  "confianza": "alta|media|baja"
}`,
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
        throw new Error('Claude no devolvió JSON válido')
      }
    }

    return res.status(200).json({ ok: true, clasificacion })

  } catch (err) {
    console.error('[extract-invoice]', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
