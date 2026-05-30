// api/alegra-connect.js — Vercel Serverless Function
// M16 — Integración Alegra API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, token } = req.body

  if (!email || !token) {
    return res.status(400).json({ error: 'Se requieren email y token de Alegra' })
  }

  // Alegra usa Basic Auth: base64(email:token)
  const basicAuth = Buffer.from(`${email}:${token}`).toString('base64')
  const headers = {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type': 'application/json',
  }

  try {
    // Verificar credenciales
    const testRes = await fetch('https://api.alegra.com/api/v1/company', { headers })
    if (!testRes.ok) {
      return res.status(401).json({ error: 'Credenciales Alegra inválidas. Verifica tu email y token.' })
    }
    const company = await testRes.json()

    // Últimos 90 días
    const fechaFin = new Date().toISOString().split('T')[0]
    const fechaInicio = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Obtener gastos
    const gastosRes = await fetch(
      `https://api.alegra.com/api/v1/expenses?start=${fechaInicio}&end=${fechaFin}&limit=200`,
      { headers }
    )
    const gastos = gastosRes.ok ? await gastosRes.json() : []

    // Obtener facturas de compra
    const comprasRes = await fetch(
      `https://api.alegra.com/api/v1/bills?start=${fechaInicio}&end=${fechaFin}&limit=200`,
      { headers }
    )
    const compras = comprasRes.ok ? await comprasRes.json() : []

    const allItems = [
      ...(Array.isArray(gastos) ? gastos : []),
      ...(Array.isArray(compras) ? compras : []),
    ]

    const categorized = categorizarItemsAlegra(allItems)

    return res.status(200).json({
      success: true,
      source: 'alegra',
      empresa: company.name || company.companyName,
      periodo: { desde: fechaInicio, hasta: fechaFin },
      total_registros: allItems.length,
      alcance1_items: categorized.filter(c => c.alcance === 1).length,
      alcance2_items: categorized.filter(c => c.alcance === 2).length,
      alcance3_items: categorized.filter(c => c.alcance === 3).length,
      total_cop: categorized.reduce((a, c) => a + (c.valor_cop || 0), 0),
      resumen: agruparPorCategoria(categorized),
      items: categorized,
    })
  } catch (err) {
    console.error('Alegra connect error:', err)
    return res.status(500).json({ error: err.message })
  }
}

const KEYWORD_MAP = [
  { keywords: ['electricidad', 'energia', 'enel', 'codensa', 'epsa', 'luz', 'kwh', 'emcali'], categoria: 'electricidad', alcance: 2 },
  { keywords: ['gas natural', 'gas domiciliario', 'vanti', 'gases del caribe', 'surtigas'], categoria: 'gas_natural', alcance: 1 },
  { keywords: ['diesel', 'acpm', 'combustible', 'gasolina', 'gasoil'], categoria: 'combustible', alcance: 1 },
  { keywords: ['refrigerante', 'freon', 'hfc', 'aire acondicionado'], categoria: 'refrigerantes', alcance: 1 },
  { keywords: ['aerolinea', 'avianca', 'latam', 'vuelo', 'tiquete', 'aereo'], categoria: 'transporte_aereo', alcance: 3 },
  { keywords: ['transporte', 'flete', 'logistica', 'mensajeria', 'envio'], categoria: 'transporte_terrestre', alcance: 3 },
  { keywords: ['agua', 'acueducto', 'alcantarillado'], categoria: 'agua', alcance: 3 },
  { keywords: ['residuos', 'basuras', 'aseo', 'recoleccion'], categoria: 'residuos', alcance: 3 },
  { keywords: ['nomina', 'salario', 'empleado', 'seguridad social'], categoria: 'nomina', alcance: 3 },
]

function categorizarItemsAlegra(items) {
  return items.map(item => {
    const desc = (
      item.description || item.observations || item.name ||
      item.vendor?.name || item.contact?.name || ''
    ).toLowerCase()

    let categoria = 'compras_servicios'
    let alcance = 3

    for (const rule of KEYWORD_MAP) {
      if (rule.keywords.some(k => desc.includes(k))) {
        categoria = rule.categoria
        alcance = rule.alcance
        break
      }
    }

    // Alegra puede tener items[] con subtotales
    let valor = item.total || item.amount || 0
    if (item.items && Array.isArray(item.items)) {
      valor = item.items.reduce((a, i) => a + (i.total || i.price * i.quantity || 0), 0)
    }

    return {
      id: item.id,
      fecha: item.date || item.dueDate,
      descripcion: item.description || item.observations || 'Sin descripción',
      categoria,
      alcance,
      valor_cop: valor,
      proveedor: item.vendor?.name || item.contact?.name || '',
      source: 'alegra',
    }
  })
}

function agruparPorCategoria(items) {
  const grupos = {}
  items.forEach(item => {
    if (!grupos[item.categoria]) grupos[item.categoria] = { categoria: item.categoria, alcance: item.alcance, total_cop: 0, count: 0 }
    grupos[item.categoria].total_cop += item.valor_cop || 0
    grupos[item.categoria].count++
  })
  return Object.values(grupos).sort((a, b) => b.total_cop - a.total_cop)
}
