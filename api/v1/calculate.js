// api/v1/calculate.js — Vercel Serverless Function
const FACTORES = {
  gasolina: 8.78, diesel: 10.15, acpm: 10.15, gas_natural: 5.49, carbon: 2.42,
  electricidad: {
    Colombia: 0.126, Mexico: 0.454, Argentina: 0.321, Chile: 0.287,
    Peru: 0.249, Ecuador: 0.272, Espana: 0.181, default: 0.35,
  },
  precio_kwh_cop: 650,
}

function calcularEmisiones(datos) {
  let alcance1 = 0, alcance2 = 0
  const detalles = []
  const { combustible, flota, electricidad, pais = 'Colombia' } = datos

  if (combustible?.tipo && combustible?.cantidad > 0) {
    const factorMap = {
      gasolina: FACTORES.gasolina, diesel: FACTORES.diesel,
      acpm: FACTORES.acpm, gas_natural: FACTORES.gas_natural, carbon: FACTORES.carbon,
    }
    const factor = factorMap[combustible.tipo] || FACTORES.diesel
    const emision = combustible.cantidad * factor
    alcance1 += emision
    detalles.push({ alcance: 1, categoria: 'Combustibles', kgCO2e: Math.round(emision), unidad: combustible.tipo })
  }
  if (flota?.galones > 0) {
    const emision = flota.galones * FACTORES.diesel
    alcance1 += emision
    detalles.push({ alcance: 1, categoria: 'Flota vehicular', kgCO2e: Math.round(emision), unidad: 'galones diesel' })
  }
  if (electricidad?.kwh > 0) {
    const factor = FACTORES.electricidad[pais] || FACTORES.electricidad.default
    const emision = electricidad.kwh * factor
    alcance2 += emision
    detalles.push({ alcance: 2, categoria: 'Electricidad', kgCO2e: Math.round(emision), factor_usado: factor, pais })
  } else if (electricidad?.cop > 0) {
    const kwh = electricidad.cop / FACTORES.precio_kwh_cop
    const factor = FACTORES.electricidad[pais] || FACTORES.electricidad.default
    const emision = kwh * factor
    alcance2 += emision
    detalles.push({ alcance: 2, categoria: 'Electricidad (estimada)', kgCO2e: Math.round(emision), kwh_estimado: Math.round(kwh) })
  }

  const totalKgMes = alcance1 + alcance2
  const totalTonAnio = Math.round((totalKgMes * 12) / 1000 * 10) / 10
  return {
    alcance1_kg_mes: Math.round(alcance1),
    alcance2_kg_mes: Math.round(alcance2),
    total_kg_mes: Math.round(totalKgMes),
    total_ton_anio: totalTonAnio,
    detalles,
    metodologia: 'GHG Protocol Corporate Standard + IPCC AR6',
    timestamp: new Date().toISOString(),
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const key = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
  if (!key || (!key.startsWith('ecm_') && !key.startsWith('sk-ecm-'))) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'API key requerida. Incluir header: X-API-Key: ecm_...',
      docs: 'https://ecometrix-app-one.vercel.app/developers',
    })
  }

  try {
    const { empresa, datos } = req.body
    if (!datos) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'El campo "datos" es requerido',
        ejemplo: {
          empresa: { nombre: 'Mi Empresa SAS', sector: 'Manufactura', pais: 'Colombia' },
          datos: {
            combustible: { tipo: 'diesel', cantidad: 200 },
            flota: { galones: 300 },
            electricidad: { kwh: 1500 },
          },
        },
      })
    }
    const resultado = calcularEmisiones({ ...datos, pais: empresa?.pais || 'Colombia' })
    return res.status(200).json({
      id: `ecm_api_${Date.now()}`,
      empresa: empresa || {},
      resultado,
      creditos_usados: 1,
    })
  } catch (err) {
    return res.status(400).json({ error: 'invalid_json', message: err.message })
  }
}
