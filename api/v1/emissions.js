// api/v1/emissions.js
import { FACTORES, num } from '../../src/lib/factoresEmision.js'
import { checkRateLimit } from '../../src/lib/rateLimit.js'

const MAX_FUENTES = 100

function calcularDesdeEmissions({ fuentes = [], pais = 'Colombia' }) {
  let alcance1 = 0, alcance2 = 0, alcance3 = 0
  const detalles = []
  const paisKey = typeof pais === 'string' ? pais : 'Colombia'

  for (const fuente of fuentes.slice(0, MAX_FUENTES)) {
    if (!fuente || typeof fuente !== 'object') continue
    const { tipo, unidad } = fuente
    const subtipo = typeof fuente.subtipo === 'string' ? fuente.subtipo : undefined
    const cantidad = num(fuente.cantidad)
    if (cantidad <= 0) continue

    switch (tipo) {
      case 'combustible': {
        const factorMap = { gasolina: FACTORES.gasolina, diesel: FACTORES.diesel, acpm: FACTORES.acpm, gas_natural: FACTORES.gas_natural, carbon: FACTORES.carbon }
        const emision = cantidad * (factorMap[subtipo] || FACTORES.diesel)
        alcance1 += emision
        detalles.push({ alcance: 1, categoria: `Combustible (${subtipo || 'diesel'})`, kgCO2e: Math.round(emision), cantidad: `${cantidad} ${unidad || 'galones'}` })
        break
      }
      case 'flota': {
        const emision = cantidad * (subtipo === 'gasolina' ? FACTORES.gasolina : FACTORES.diesel)
        alcance1 += emision
        detalles.push({ alcance: 1, categoria: `Flota (${subtipo || 'diesel'})`, kgCO2e: Math.round(emision), cantidad: `${cantidad} galones` })
        break
      }
      case 'electricidad': {
        const kwh = String(unidad || '').toLowerCase() === 'cop' ? cantidad / FACTORES.precio_kwh_cop : cantidad
        const factor = FACTORES.electricidad[paisKey] || FACTORES.electricidad.default
        const emision = kwh * factor
        alcance2 += emision
        detalles.push({ alcance: 2, categoria: 'Electricidad', kgCO2e: Math.round(emision), cantidad: `${Math.round(kwh)} kWh`, factor_usado: factor })
        break
      }
      case 'refrigerantes': {
        const gwp = FACTORES.refrigerantes[subtipo] || FACTORES.refrigerantes.default
        const emision = cantidad * gwp
        alcance1 += emision
        detalles.push({ alcance: 1, categoria: `Refrigerante (${subtipo || 'genérico'})`, kgCO2e: Math.round(emision), cantidad: `${cantidad} kg`, gwp })
        break
      }
      case 'residuos': {
        const emision = cantidad * (FACTORES.residuos[subtipo] || FACTORES.residuos.default)
        alcance3 += emision
        detalles.push({ alcance: 3, categoria: `Residuos (${subtipo || 'general'})`, kgCO2e: Math.round(emision), cantidad: `${cantidad} kg` })
        break
      }
      case 'viajes': {
        const emision = cantidad * (FACTORES.viajes[subtipo] || FACTORES.viajes.default)
        alcance3 += emision
        detalles.push({ alcance: 3, categoria: `Viajes (${subtipo || 'general'})`, kgCO2e: Math.round(emision), cantidad: `${cantidad} km` })
        break
      }
    }
  }

  const totalKgMes = alcance1 + alcance2 + alcance3
  const totalTonAnio = Math.round((totalKgMes * 12) / 1000 * 10) / 10
  return {
    alcance1_kg_mes: Math.round(alcance1),
    alcance2_kg_mes: Math.round(alcance2),
    alcance3_kg_mes: Math.round(alcance3),
    total_kg_mes: Math.round(totalKgMes),
    total_ton_anio: totalTonAnio,
    nivel_impacto: totalTonAnio < 20 ? 'Bajo' : totalTonAnio < 100 ? 'Moderado' : 'Alto',
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

  if (!(await checkRateLimit(req, res, '/api/v1/emissions'))) return

  const key = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
  if (!key || (!key.startsWith('ecm_') && !key.startsWith('sk-ecm-'))) {
    return res.status(401).json({ error: 'unauthorized', message: 'API key requerida. Incluir header: X-API-Key: ecm_...', docs: 'https://www.ecometrix.app/developers' })
  }

  try {
    const { empresa, periodo, fuentes } = req.body || {}
    if (!empresa?.nombre) return res.status(400).json({ error: 'bad_request', message: 'empresa.nombre es requerido' })
    if (!Array.isArray(fuentes) || fuentes.length === 0) {
      return res.status(400).json({
        error: 'bad_request',
        message: '"fuentes" debe ser un array con al menos un elemento',
        tipos_validos: ['combustible', 'flota', 'electricidad', 'refrigerantes', 'residuos', 'viajes'],
        ejemplo: {
          empresa: { nombre: 'Textiles del Norte SAS', nit: '900123456-1', sector: 'Manufactura', pais: 'Colombia' },
          periodo: { mes: 5, anio: 2026 },
          fuentes: [
            { tipo: 'combustible', subtipo: 'diesel', cantidad: 200, unidad: 'galones' },
            { tipo: 'electricidad', cantidad: 1500, unidad: 'kwh' },
            { tipo: 'refrigerantes', subtipo: 'R410A', cantidad: 2, unidad: 'kg' },
          ],
        },
      })
    }
    const resultado = calcularDesdeEmissions({ fuentes, pais: empresa?.pais || 'Colombia' })
    return res.status(200).json({
      id: `ecm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      empresa, periodo: periodo || null, resultado,
      fuentes_procesadas: Math.min(fuentes.length, MAX_FUENTES),
      creditos_usados: 1,
    })
  } catch (err) {
    console.error('v1/emissions error:', err.message)
    return res.status(400).json({ error: 'invalid_request', message: 'Solicitud inválida' })
  }
}
