// api/v1/calculate.js
import { FACTORES, num } from '../../src/lib/factoresEmision.js'
import { checkRateLimit } from '../../src/lib/rateLimit.js'

function calcularEmisiones(datos) {
  let alcance1 = 0, alcance2 = 0
  const detalles = []
  const { combustible, flota, electricidad, pais = 'Colombia' } = datos
  const paisKey = typeof pais === 'string' ? pais : 'Colombia'

  const cantComb = num(combustible?.cantidad)
  if (combustible?.tipo && cantComb > 0) {
    const factorMap = { gasolina: FACTORES.gasolina, diesel: FACTORES.diesel, acpm: FACTORES.acpm, gas_natural: FACTORES.gas_natural, carbon: FACTORES.carbon }
    const factor = factorMap[combustible.tipo] || FACTORES.diesel
    const emision = cantComb * factor
    alcance1 += emision
    detalles.push({ alcance: 1, categoria: 'Combustibles', kgCO2e: Math.round(emision), unidad: String(combustible.tipo).slice(0, 30) })
  }
  const gal = num(flota?.galones)
  if (gal > 0) {
    const emision = gal * FACTORES.diesel
    alcance1 += emision
    detalles.push({ alcance: 1, categoria: 'Flota vehicular', kgCO2e: Math.round(emision), unidad: 'galones diesel' })
  }
  const factorElec = FACTORES.electricidad[paisKey] || FACTORES.electricidad.default
  const kwhIn = num(electricidad?.kwh), copIn = num(electricidad?.cop)
  if (kwhIn > 0) {
    const emision = kwhIn * factorElec
    alcance2 += emision
    detalles.push({ alcance: 2, categoria: 'Electricidad', kgCO2e: Math.round(emision), factor_usado: factorElec, pais: paisKey })
  } else if (copIn > 0) {
    const kwh = copIn / FACTORES.precio_kwh_cop
    const emision = kwh * factorElec
    alcance2 += emision
    detalles.push({ alcance: 2, categoria: 'Electricidad (estimada)', kgCO2e: Math.round(emision), kwh_estimado: Math.round(kwh) })
  }

  const totalKgMes = alcance1 + alcance2
  return {
    alcance1_kg_mes: Math.round(alcance1),
    alcance2_kg_mes: Math.round(alcance2),
    total_kg_mes: Math.round(totalKgMes),
    total_ton_anio: Math.round((totalKgMes * 12) / 1000 * 10) / 10,
    detalles,
    metodologia: 'GHG Protocol Corporate Standard',
    timestamp: new Date().toISOString(),
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!(await checkRateLimit(req, res, '/api/v1/calculate'))) return

  const key = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
  if (!key || (!key.startsWith('ecm_') && !key.startsWith('sk-ecm-'))) {
    return res.status(401).json({ error: 'unauthorized', message: 'API key requerida. Incluir header: X-API-Key: ecm_...', docs: 'https://www.ecometrix.app/developers' })
  }

  try {
    const { empresa, datos } = req.body || {}
    if (!datos || typeof datos !== 'object') {
      return res.status(400).json({
        error: 'bad_request',
        message: 'El campo "datos" es requerido',
        ejemplo: {
          empresa: { nombre: 'Mi Empresa SAS', sector: 'Manufactura', pais: 'Colombia' },
          datos: { combustible: { tipo: 'diesel', cantidad: 200 }, flota: { galones: 300 }, electricidad: { kwh: 1500 } },
        },
      })
    }
    const resultado = calcularEmisiones({ ...datos, pais: empresa?.pais || 'Colombia' })
    return res.status(200).json({ id: `ecm_api_${Date.now()}`, empresa: empresa || {}, resultado, creditos_usados: 1 })
  } catch (err) {
    console.error('v1/calculate error:', err.message)
    return res.status(400).json({ error: 'invalid_request', message: 'Solicitud inválida' })
  }
}
