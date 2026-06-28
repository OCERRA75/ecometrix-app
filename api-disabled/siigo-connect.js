// api/siigo-connect.js
// M16 — Integración Siigo API
// Docs: https://developer.siigo.com/docs
// USE_MOCK = true hasta tener partner_id aprobado por Siigo

const USE_MOCK = true // Cambiar a false cuando Siigo apruebe el partner_id
const SIIGO_AUTH_URL = 'https://api.siigo.com/auth'
const SIIGO_BASE     = 'https://api.siigo.com'

const CATEGORY_MAP = {
  electricidad:    { value: 'electricidad',         alcance: 2, factor: 0.126 },
  energia:         { value: 'electricidad',         alcance: 2, factor: 0.126 },
  gas:             { value: 'gas_natural',          alcance: 1, factor: 5.49  },
  gasolina:        { value: 'combustible_gasolina', alcance: 1, factor: 8.78  },
  diesel:          { value: 'combustible_diesel',   alcance: 1, factor: 10.15 },
  acpm:            { value: 'combustible_diesel',   alcance: 1, factor: 10.15 },
  combustible:     { value: 'combustible_diesel',   alcance: 1, factor: 10.15 },
  transporte:      { value: 'transporte_terrestre', alcance: 3, factor: 0.12  },
  flete:           { value: 'transporte_terrestre', alcance: 3, factor: 0.12  },
  aereo:           { value: 'transporte_aereo',     alcance: 3, factor: 0.255 },
  agua:            { value: 'agua',                 alcance: 3, factor: 0.344 },
  acueducto:       { value: 'agua',                 alcance: 3, factor: 0.344 },
  residuo:         { value: 'residuos',             alcance: 3, factor: 0.5   },
  nomina:          { value: 'nomina',               alcance: 3, factor: 0.005 },
}

const COP_TO_USD = 4000

function clasificarGasto(descripcion = '') {
  const texto = descripcion.toLowerCase()
  for (const [keyword, mapping] of Object.entries(CATEGORY_MAP)) {
    if (texto.includes(keyword)) return mapping
  }
  return { value: 'compras_servicios', alcance: 3, factor: 0.15 }
}

// ── Mock data realista para empresa colombiana ────────────────────────────────
function getMockData() {
  const gastos = [
    { fecha: '2026-05-01', descripcion: 'Electricidad CODENSA mayo',   proveedor: 'CODENSA',      valor_cop: 1850000 },
    { fecha: '2026-05-05', descripcion: 'Gas natural VANTI',           proveedor: 'VANTI',        valor_cop: 420000  },
    { fecha: '2026-05-08', descripcion: 'Combustible ACPM flota',      proveedor: 'Terpel',       valor_cop: 980000  },
    { fecha: '2026-05-10', descripcion: 'Flete transporte Bogotá-Cali',proveedor: 'Envia',        valor_cop: 350000  },
    { fecha: '2026-05-12', descripcion: 'Agua Acueducto de Bogotá',    proveedor: 'EAAB',         valor_cop: 180000  },
    { fecha: '2026-05-15', descripcion: 'Electricidad CODENSA 2da qna',proveedor: 'CODENSA',      valor_cop: 1650000 },
    { fecha: '2026-05-18', descripcion: 'Gasolina vehículo gerencia',  proveedor: 'Biomax',       valor_cop: 250000  },
    { fecha: '2026-05-20', descripcion: 'Servicio residuos peligrosos',proveedor: 'Clean Colombia',valor_cop: 320000 },
    { fecha: '2026-05-22', descripcion: 'Nómina empleados mayo',       proveedor: 'RH Interno',   valor_cop: 8500000 },
    { fecha: '2026-05-25', descripcion: 'Compra materias primas',      proveedor: 'Proveedor SAS',valor_cop: 4200000 },
    { fecha: '2026-06-01', descripcion: 'Electricidad CODENSA junio',  proveedor: 'CODENSA',      valor_cop: 1920000 },
    { fecha: '2026-06-03', descripcion: 'Gas natural VANTI junio',     proveedor: 'VANTI',        valor_cop: 390000  },
    { fecha: '2026-06-07', descripcion: 'Combustible diesel flota',    proveedor: 'Primax',       valor_cop: 1100000 },
    { fecha: '2026-06-10', descripcion: 'Flete transporte nacional',   proveedor: 'Servientrega', valor_cop: 480000  },
    { fecha: '2026-06-15', descripcion: 'Agua y alcantarillado',       proveedor: 'EAAB',         valor_cop: 195000  },
  ].map(g => {
    const cat = clasificarGasto(g.descripcion)
    const valorUSD = g.valor_cop / COP_TO_USD
    return {
      ...g,
      categoria_ghg: cat.value,
      alcance: cat.alcance,
      kg_co2e: Math.round(valorUSD * cat.factor * 100) / 100,
    }
  })

  const categorias = {}
  gastos.forEach(g => {
    if (!categorias[g.categoria_ghg]) {
      categorias[g.categoria_ghg] = { categoria: g.categoria_ghg, alcance: g.alcance, kg_co2e: 0, valor_cop: 0, count: 0 }
    }
    categorias[g.categoria_ghg].kg_co2e   += g.kg_co2e
    categorias[g.categoria_ghg].valor_cop += g.valor_cop
    categorias[g.categoria_ghg].count++
  })

  return {
    empresa: 'Empresa Demo Siigo',
    periodo: { desde: '2026-04-01', hasta: '2026-06-30' },
    total_registros: gastos.length,
    total_cop: gastos.reduce((a, g) => a + g.valor_cop, 0),
    total_kg_co2e: Math.round(gastos.reduce((a, g) => a + g.kg_co2e, 0) * 100) / 100,
    categorias: Object.values(categorias).map(c => ({ ...c, kg_co2e: Math.round(c.kg_co2e * 100) / 100 })),
    gastos,
    source: 'siigo_mock',
    mock: true,
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, access_key, partner_id } = req.body

  if (!username || !access_key) {
    return res.status(400).json({ error: 'Usuario y Access Key son requeridos' })
  }

  // ── Modo mock ──────────────────────────────────────────────────────────────
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 1200)) // simula latencia API
    return res.status(200).json(getMockData())
  }

  // ── Modo real (activar cuando Siigo apruebe partner_id) ───────────────────
  try {
    const authRes = await fetch(SIIGO_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Partner-Id': partner_id || 'EcoMetriX',
      },
      body: JSON.stringify({ username, access_key }),
    })

    if (!authRes.ok) {
      return res.status(401).json({ error: 'Credenciales Siigo inválidas. Verifica tu usuario y Access Key.' })
    }

    const { access_token } = await authRes.json()
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'Partner-Id': partner_id || 'EcoMetriX',
    }

    const fechaHasta = new Date().toISOString().split('T')[0]
    const fechaDesde = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const purchasesRes = await fetch(
      `${SIIGO_BASE}/v1/document-types?type=FV&date_start=${fechaDesde}&date_end=${fechaHasta}&page=1&page_size=100`,
      { headers }
    )

    if (!purchasesRes.ok) {
      return res.status(500).json({ error: 'Error obteniendo documentos de Siigo' })
    }

    const purchases = await purchasesRes.json()
    const gastos = (purchases.results || []).flatMap(doc =>
      (doc.items || []).map(item => {
        const cat = clasificarGasto(item.description || doc.observations || '')
        const valor = parseFloat(item.total || 0)
        return {
          fecha: doc.date,
          descripcion: item.description || doc.observations || 'Gasto',
          proveedor: doc.customer?.branch_office || 'Sin proveedor',
          valor_cop: valor,
          categoria_ghg: cat.value,
          alcance: cat.alcance,
          kg_co2e: Math.round((valor / COP_TO_USD) * cat.factor * 100) / 100,
        }
      })
    )

    const categorias = {}
    gastos.forEach(g => {
      if (!categorias[g.categoria_ghg]) {
        categorias[g.categoria_ghg] = { categoria: g.categoria_ghg, alcance: g.alcance, kg_co2e: 0, valor_cop: 0, count: 0 }
      }
      categorias[g.categoria_ghg].kg_co2e   += g.kg_co2e
      categorias[g.categoria_ghg].valor_cop += g.valor_cop
      categorias[g.categoria_ghg].count++
    })

    return res.status(200).json({
      empresa: username,
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      total_registros: gastos.length,
      total_cop: Math.round(gastos.reduce((a, g) => a + g.valor_cop, 0)),
      total_kg_co2e: Math.round(gastos.reduce((a, g) => a + g.kg_co2e, 0) * 100) / 100,
      categorias: Object.values(categorias).map(c => ({ ...c, kg_co2e: Math.round(c.kg_co2e * 100) / 100 })),
      gastos: gastos.slice(0, 50),
      source: 'siigo',
    })

  } catch (err) {
    console.error('Siigo connect error:', err)
    return res.status(500).json({ error: `Error conectando con Siigo: ${err.message}` })
  }
}
