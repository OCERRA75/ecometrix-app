// api/alegra-connect.js
// M16 — Integración real con Alegra API v1
// Docs: https://developer.alegra.com/docs

const ALEGRA_BASE = 'https://api.alegra.com/api/v1'

// Mapa de categorías Alegra → GHG Protocol
const CATEGORY_MAP = {
  // Palabras clave en nombre/descripción → categoría GHG
  electricidad:    { value: 'electricidad',         alcance: 2, factor: 0.126 },
  energia:         { value: 'electricidad',         alcance: 2, factor: 0.126 },
  enel:            { value: 'electricidad',         alcance: 2, factor: 0.126 },
  codensa:         { value: 'electricidad',         alcance: 2, factor: 0.126 },
  epsa:            { value: 'electricidad',         alcance: 2, factor: 0.126 },
  gas:             { value: 'gas_natural',          alcance: 1, factor: 5.49  },
  vanti:           { value: 'gas_natural',          alcance: 1, factor: 5.49  },
  surtigas:        { value: 'gas_natural',          alcance: 1, factor: 5.49  },
  gasolina:        { value: 'combustible_gasolina', alcance: 1, factor: 8.78  },
  diesel:          { value: 'combustible_diesel',   alcance: 1, factor: 10.15 },
  acpm:            { value: 'combustible_diesel',   alcance: 1, factor: 10.15 },
  combustible:     { value: 'combustible_diesel',   alcance: 1, factor: 10.15 },
  transporte:      { value: 'transporte_terrestre', alcance: 3, factor: 0.12  },
  flete:           { value: 'transporte_terrestre', alcance: 3, factor: 0.12  },
  aereo:           { value: 'transporte_aereo',     alcance: 3, factor: 0.255 },
  vuelo:           { value: 'transporte_aereo',     alcance: 3, factor: 0.255 },
  residuo:         { value: 'residuos',             alcance: 3, factor: 0.5   },
  basura:          { value: 'residuos',             alcance: 3, factor: 0.5   },
  agua:            { value: 'agua',                 alcance: 3, factor: 0.344 },
  acueducto:       { value: 'agua',                 alcance: 3, factor: 0.344 },
  nomina:          { value: 'nomina',               alcance: 3, factor: 0.005 },
  salario:         { value: 'nomina',               alcance: 3, factor: 0.005 },
}

const COP_TO_USD = 4000

function clasificarGasto(descripcion = '', categoria = '') {
  const texto = `${descripcion} ${categoria}`.toLowerCase()
  for (const [keyword, mapping] of Object.entries(CATEGORY_MAP)) {
    if (texto.includes(keyword)) return mapping
  }
  // Default: compras de bienes/servicios (Alcance 3)
  return { value: 'compras_servicios', alcance: 3, factor: 0.15 }
}

function calcularCO2e(valorCOP, categoria) {
  const valorUSD = valorCOP / COP_TO_USD
  // Para electricidad/gas: factor por unidad física estimada desde COP
  // Para resto: factor spend-based (kg CO2e / USD)
  return Math.round(valorUSD * categoria.factor * 100) / 100
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, token } = req.body

  if (!email || !token) {
    return res.status(400).json({ error: 'Email y token son requeridos' })
  }

  try {
    // Auth: Basic base64(email:token)
    const credentials = Buffer.from(`${email}:${token}`).toString('base64')
    const headers = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    }

    // 1. Verificar credenciales con /company
    const companyRes = await fetch(`${ALEGRA_BASE}/company`, { headers })
    if (!companyRes.ok) {
      const err = await companyRes.json().catch(() => ({}))
      return res.status(401).json({
        error: err.message || 'Credenciales inválidas. Verifica tu email y token de Alegra.'
      })
    }
    const company = await companyRes.json()

    // 2. Obtener gastos/pagos últimos 3 meses
    const fechaHasta = new Date().toISOString().split('T')[0]
    const fechaDesde = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [billsRes, paymentsRes] = await Promise.all([
      fetch(`${ALEGRA_BASE}/bills?date-range-field=date&start-date=${fechaDesde}&end-date=${fechaHasta}&limit=100`, { headers }),
      fetch(`${ALEGRA_BASE}/payments?type=expense&date-range-field=date&start-date=${fechaDesde}&end-date=${fechaHasta}&limit=100`, { headers }),
    ])

    const bills    = billsRes.ok    ? await billsRes.json()    : []
    const payments = paymentsRes.ok ? await paymentsRes.json() : []

    // 3. Combinar y clasificar
    const gastos = []

    ;(Array.isArray(bills) ? bills : []).forEach(bill => {
      ;(bill.items || []).forEach(item => {
        const cat = clasificarGasto(item.name || '', bill.numberTemplate?.prefix || '')
        const valor = parseFloat(item.total || item.price || 0)
        if (valor > 0) {
          gastos.push({
            fecha: bill.date,
            descripcion: item.name || 'Gasto factura',
            proveedor: bill.vendor?.name || 'Sin proveedor',
            valor_cop: valor,
            categoria_ghg: cat.value,
            alcance: cat.alcance,
            kg_co2e: calcularCO2e(valor, cat),
          })
        }
      })
    })

    ;(Array.isArray(payments) ? payments : []).forEach(payment => {
      const cat = clasificarGasto(payment.observations || '', payment.account?.name || '')
      const valor = parseFloat(payment.amount || 0)
      if (valor > 0) {
        gastos.push({
          fecha: payment.date,
          descripcion: payment.observations || 'Pago de gasto',
          proveedor: payment.vendor?.name || 'Sin proveedor',
          valor_cop: valor,
          categoria_ghg: cat.value,
          alcance: cat.alcance,
          kg_co2e: calcularCO2e(valor, cat),
        })
      }
    })

    // 4. Agrupar por categoría para resumen
    const categorias = {}
    gastos.forEach(g => {
      if (!categorias[g.categoria_ghg]) {
        categorias[g.categoria_ghg] = { categoria: g.categoria_ghg, alcance: g.alcance, kg_co2e: 0, valor_cop: 0, count: 0 }
      }
      categorias[g.categoria_ghg].kg_co2e   += g.kg_co2e
      categorias[g.categoria_ghg].valor_cop += g.valor_cop
      categorias[g.categoria_ghg].count++
    })

    const total_kg_co2e = gastos.reduce((a, g) => a + g.kg_co2e, 0)
    const total_cop     = gastos.reduce((a, g) => a + g.valor_cop, 0)

    return res.status(200).json({
      empresa: company.name || company.companyName || email,
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      total_registros: gastos.length,
      total_cop: Math.round(total_cop),
      total_kg_co2e: Math.round(total_kg_co2e * 100) / 100,
      categorias: Object.values(categorias).map(c => ({
        ...c,
        kg_co2e: Math.round(c.kg_co2e * 100) / 100,
      })),
      gastos: gastos.slice(0, 50), // max 50 para UI
      source: 'alegra',
    })

  } catch (err) {
    console.error('Alegra connect error:', err)
    return res.status(500).json({ error: `Error conectando con Alegra: ${err.message}` })
  }
}
