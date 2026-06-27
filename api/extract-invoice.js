// api/extract-invoice.js
// Extrae datos de facturas PDF con AWS Textract + Claude
// y los clasifica según GHG Protocol (Alcance 1, 2, 3)

import Anthropic from '@anthropic-ai/sdk'
import {
  TextractClient,
  DetectDocumentTextCommand,
} from '@aws-sdk/client-textract'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const textract = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { base64, mimeType } = req.body
    if (!base64) return res.status(400).json({ error: 'No file provided' })

    // 1. Extraer texto con Textract
    const buffer = Buffer.from(base64, 'base64')
    const textractRes = await textract.send(
      new DetectDocumentTextCommand({
        Document: { Bytes: buffer },
      })
    )

    const textoExtraido = textractRes.Blocks
      .filter(b => b.BlockType === 'LINE')
      .map(b => b.Text)
      .join('\n')

    if (!textoExtraido || textoExtraido.trim().length < 20) {
      return res.status(422).json({ error: 'No se pudo extraer texto del documento' })
    }

    // 2. Clasificar con Claude
    const prompt = `Eres un experto en huella de carbono corporativa y GHG Protocol. 
Analiza el siguiente texto extraído de una factura o documento empresarial y extrae los datos relevantes para calcular emisiones de CO2.

TEXTO DE LA FACTURA:
${textoExtraido}

Responde SOLO con un JSON válido (sin markdown, sin texto adicional) con esta estructura exacta:
{
  "proveedor": "nombre del proveedor o empresa emisora",
  "tipo_documento": "factura_gas | factura_electricidad | factura_combustible | factura_agua | ticket_transporte | otro",
  "fecha": "YYYY-MM o null",
  "items": [
    {
      "descripcion": "descripción del item",
      "cantidad": número o null,
      "unidad": "kWh | m3 | galones | litros | km | ton | kg | null",
      "valor_cop": número o null,
      "alcance_ghg": 1 | 2 | 3,
      "categoria": "electricidad | gas_natural | gasolina | diesel | acpm | gas_propano | agua | transporte_carga | transporte_empleados | residuos | otro",
      "campo_cuestionario": "consumo_electricidad | consumo_gas_natural | consumo_gasolina | consumo_diesel | consumo_acpm | consumo_gas_propano | km_carga | km_empleados | null"
    }
  ],
  "resumen": "descripción breve en español de qué contiene la factura y qué emisiones genera",
  "confianza": "alta | media | baja"
}`

    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = claudeRes.content[0].text.trim()
    let clasificacion
    try {
      clasificacion = JSON.parse(rawText)
    } catch {
      // Intentar extraer JSON si Claude agregó texto extra
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) clasificacion = JSON.parse(match[0])
      else throw new Error('Respuesta de Claude no es JSON válido')
    }

    return res.status(200).json({
      ok: true,
      texto_extraido: textoExtraido.substring(0, 500), // preview
      clasificacion,
    })
  } catch (err) {
    console.error('extract-invoice error:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
