export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  try {
    const { base64, mimeType } = req.body
    if (!base64) return res.status(400).json({ ok: false, error: 'No file provided' })
    const tipo = mimeType || 'image/jpeg'
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAVE_API_ANTROPICA

    const prompt = `Analiza esta factura o documento financiero. Puede ser de cualquier proveedor y cualquier rubro (servicios públicos, combustible, insumos, transporte, papelería, servicios profesionales, etc.). Responde SOLO JSON sin markdown, sin texto adicional, con esta forma exacta:

{
  "proveedor": "",
  "proveedor_nit": null,
  "tipo_documento": "factura|nota_credito|nota_debito|remision|otro",
  "numero_factura": null,
  "fecha_emision": null,
  "categoria_proveedor": "",
  "relevante_ghg": false,
  "items": [
    {
      "descripcion": "",
      "cantidad": 0,
      "unidad": null,
      "valor_unitario": null,
      "valor_total": 0,
      "alcance_ghg": null,
      "categoria": null,
      "campo_cuestionario": null
    }
  ],
  "totales": {
    "subtotal": null,
    "iva": null,
    "total": 0
  },
  "resumen": "",
  "confianza": "alta|media|baja"
}

Reglas:
- "relevante_ghg" = true solo si el proveedor es de electricidad, gas natural, gas propano, combustibles (gasolina/diesel/acpm), o transporte (carga o empleados) con consumo medible en km o combustible. En ese caso, para cada item relevante llena "alcance_ghg" (1|2|3), "categoria" (electricidad|gas_natural|gas_propano|gasolina|diesel|acpm|transporte_carga|transporte_empleados), y "campo_cuestionario" (consumo_electricidad|consumo_gas_natural|consumo_gas_propano|consumo_gasolina|consumo_diesel|consumo_acpm|km_carga|km_empleados), con "unidad" en kWh|m3|kg|galones|litros|km según corresponda.
- Si "relevante_ghg" es false, deja "alcance_ghg", "categoria" y "campo_cuestionario" en null, y usa "unidad" solo si aplica (o null).
- "categoria_proveedor" siempre se llena, sin importar si es relevante para GHG (ej: "electricidad", "combustible", "papelería", "transporte", "servicios profesionales", "insumos de oficina", "telecomunicaciones", "mantenimiento").
- Si un campo no aparece en el documento, usa null (nunca inventes datos).
- Valores numéricos sin símbolos de moneda ni separadores de miles.
- "confianza" = "baja" si el documento está borroso, incompleto, o hay ambigüedad real en los montos.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: tipo, data: base64 } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    const rawText = data.content[0].text.trim()
    let clasificacion
    try { clasificacion = JSON.parse(rawText) }
    catch(e) { const m = rawText.match(/\{[\s\S]*\}/); clasificacion = m ? JSON.parse(m[0]) : null }
    if (!clasificacion) throw new Error('No se pudo interpretar respuesta')
    return res.status(200).json({ ok: true, clasificacion })
  } catch (err) {
    console.error('[extract-invoice]', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
