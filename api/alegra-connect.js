// api/alegra-connect.js — Integración con Alegra API v1 (origen estricto, rate limit, sesión obligatoria)
import { checkRateLimit, checkOrigin, requireUser } from '../src/lib/rateLimit.js'
import { CATEGORIAS, calcularCO2e } from '../src/lib/factoresEmision.js'
import { clasificarGasto } from '../src/lib/clasificadorGastos.js'

const ALEGRA_BASE = 'https://api.alegra.com/api/v1'

function procesar(gastos, cat, base) {
  const c = cat
  const { kg, metodo, requiereCantidad } = calcularCO2e({ valorCOP: base.valor_cop, categoria: c })
  gastos.push({
    ...base,
    categoria_ghg: c,
    alcance: CATEGORIAS[c]?.alcance || 3,
    kg_co2e: kg,
    metodo,
    requiere_cantidad: requiereCantidad,
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://www.ecometrix.app')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!checkOrigin(req, res)) return
  if (!(await checkRateLimit(req, res, '/api/alegra-connect'))) return
  if (!(await requireUser(req, res))) return

  const { email, token } = req.body || {}
  if (typeof email !== 'string' || typeof token !== 'string' || !email || !token || email.length > 200 || token.length > 200) {
    return res.status(400).json({ error: 'Email y token son requeridos' })
  }

  try {
    const credentials = Buffer.from(`${email}:${token}`).toString('base64')
    const headers = { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' }

    const companyRes = await fetch(`${ALEGRA_BASE}/company`, { headers })
    if (!companyRes.ok) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu email y token de Alegra.' })
    }
    const company = await companyRes.json()

    const fechaHasta = new Date().toISOString().split('T')[0]
    const fechaDesde = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [billsRes, paymentsRes] = await Promise.all([
      fetch(`${ALEGRA_BASE}/bills?date-range-field=date&start-date=${fechaDesde}&end-date=${fechaHasta}&limit=100`, { headers }),
      fetch(`${ALEGRA_BASE}/payments?type=expense&date-range-field=date&start-date=${fechaDesde}&end-date=${fechaHasta}&limit=100`, { headers }),
    ])
    const bills    = billsRes.ok    ? await billsRes.json()    : []
    const payments = paymentsRes.ok ? await paymentsRes.json() : []

    const gastos = []
    ;(Array.isArray(bills) ? bills : []).forEach(bill => {
      ;(bill.items || []).forEach(item => {
        const valor = parseFloat(item.total || item.price || 0)
        if (valor > 0) {
          procesar(gastos, clasificarGasto(item.name, bill.numberTemplate?.prefix), {
            fecha: bill.date, descripcion: item.name || 'Gasto factura',
            proveedor: bill.vendor?.name || 'Sin proveedor', valor_cop: valor,
          })
        }
      })
    })
    ;(Array.isArray(payments) ? payments : []).forEach(payment => {
      const valor = parseFloat(payment.amount || 0)
      if (valor > 0) {
        procesar(gastos, clasificarGasto(payment.observations, payment.account?.name), {
          fecha: payment.date, descripcion: payment.observations || 'Pago de gasto',
          proveedor: payment.vendor?.name || 'Sin proveedor', valor_cop: valor,
        })
      }
    })

    const categorias = {}
    gastos.forEach(g => {
      const c = (categorias[g.categoria_ghg] ||= { categoria: g.categoria_ghg, alcance: g.alcance, kg_co2e: 0, valor_cop: 0, count: 0, requiere_cantidad: false })
      c.kg_co2e += g.kg_co2e; c.valor_cop += g.valor_cop; c.count++
      if (g.requiere_cantidad) c.requiere_cantidad = true
    })

    return res.status(200).json({
      empresa: company.name || company.companyName || email,
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      total_registros: gastos.length,
      total_cop: Math.round(gastos.reduce((a, g) => a + g.valor_cop, 0)),
      total_kg_co2e: Math.round(gastos.reduce((a, g) => a + g.kg_co2e, 0) * 100) / 100,
      categorias: Object.values(categorias).map(c => ({ ...c, kg_co2e: Math.round(c.kg_co2e * 100) / 100 })),
      gastos: gastos.slice(0, 50),
      source: 'alegra',
    })
  } catch (err) {
    console.error('Alegra connect error:', err.message)
    return res.status(502).json({ error: 'No se pudo conectar con Alegra. Intenta de nuevo.' })
  }
}
