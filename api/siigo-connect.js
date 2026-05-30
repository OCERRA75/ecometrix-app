// api/siigo-connect.js — Vercel Serverless Function
// M16 — Integración Siigo API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, access_key, partner_id = 'EcoMetriX' } = req.body

  if (!username || !access_key) {
    return res.status(400).json({ error: 'Se requieren usuario y access_key de Siigo' })
  }

  try {
    // 1. Autenticación Siigo
    const authRes = await fetch('https://api.siigo.com/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Partner-Id': partner_id,
      },
      body: JSON.stringify({ username, access_key }),
    })

    if (!authRes.ok) {
      const err = await authRes.json().catch(() => ({}))
      return res.status(401).json({ error: `Credenciales Siigo inválidas: ${err.Errors?.[0] || authRes.status}` })
    }

    const { access_token } = await authRes.json()

    // 2. Obtener facturas de compra (últimos 3 meses)
    const fechaFin = new Date().toISOString().split('T')[0]
    const fechaInicio = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const facturas = await fetchAllPages(
      `https://api.siigo.com/v1/purchase-invoices?created_start=${fechaInicio}&created_end=${fechaFin}&page_size=100`,
      access_token,
      partner_id
    )

    // 3. Obtener gastos / egresos
    const gastos = await fetchAllPages(
      `https://api.siigo.com/v1/expenses?created_start=${fechaInicio}&created_end=${fechaFin}&page_size=100`,
      access_token,
      partner_id
    ).catch(() => [])

    const allItems = [...facturas, ...gastos]

    // 4. Clasificar en categorías GHG
    const categorized = categorizarItems(allItems, 'siigo')

    return res.status(200).json({
      success: true,
      source: 'siigo',
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
    console.error('Siigo connect error:', err)
    return res.status(500).json({ error: err.message })
  }
}

async function fetchAllPages(url, token, partnerId) {
  const items = []
  let page = 1
  while (true) {
    const res = await fetch(`${url}&page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Partner-Id': partnerId,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) break
    const data = await res.json()
    const results = data.results || data.items || data || []
    if (!Array.isArray(results) || results.length === 0) break
    items.push(...results)
    if (!data.pagination?.hasNextPage && !data._links?.next) break
    page++
    if (page > 10) break // max 1000 items
  }
  return items
}

// ─── GHG CATEGORIZATION ───────────────────────────────────────────────────────
const KEYWORD_MAP = [
  { keywords: ['electricidad', 'energia electrica', 'enel', 'codensa', 'epsa', 'emcali', 'luz', 'kwh'], categoria: 'electricidad', alcance: 2 },
  { keywords: ['gas natural', 'gas domiciliario', 'vanti', 'gases del caribe', 'surtigas', 'gasnorte'], categoria: 'gas_natural', alcance: 1 },
  { keywords: ['diesel', 'acpm', 'combustible', 'gasolina', 'gasoil', 'petroleo'], categoria: 'combustible', alcance: 1 },
  { keywords: ['refrigerante', 'freon', 'hfc', 'aire acondicionado', 'hvac'], categoria: 'refrigerantes', alcance: 1 },
  { keywords: ['transporte aereo', 'aerolinea', 'avianca', 'latam', 'vuelo', 'tiquete aereo'], categoria: 'transporte_aereo', alcance: 3 },
  { keywords: ['transporte', 'flete', 'logistica', 'mensajeria', 'envio', 'despacho'], categoria: 'transporte_terrestre', alcance: 3 },
  { keywords: ['agua', 'acueducto', 'eaab', 'empresas publicas', 'alcantarillado'], categoria: 'agua', alcance: 3 },
  { keywords: ['residuos', 'basuras', 'recoleccion', 'aseo'], categoria: 'residuos', alcance: 3 },
  { keywords: ['nomina', 'salario', 'empleado', 'seguridad social', 'parafiscal'], categoria: 'nomina', alcance: 3 },
]

function categorizarItems(items, source) {
  return items.map(item => {
    const desc = (
      item.name || item.description || item.observations ||
      item.supplier?.name || item.account?.name || ''
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

    const valor = item.total || item.amount || item.value || 0

    return {
      id: item.id,
      fecha: item.date || item.created || item.issue_date,
      descripcion: item.name || item.description || item.observations || 'Sin descripción',
      categoria,
      alcance,
      valor_cop: typeof valor === 'object' ? (valor.total || 0) : valor,
      proveedor: item.supplier?.name || item.third_party?.name || '',
      source,
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
