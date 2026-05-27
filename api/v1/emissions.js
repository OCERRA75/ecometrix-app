// api/v1/emissions.js — Vercel Serverless Function
const FACTORES = {
  gasolina: 8.78, diesel: 10.15, acpm: 10.15, gas_natural: 5.49, carbon: 2.42,
  electricidad: {
    Colombia: 0.126, Mexico: 0.454, Argentina: 0.321, Chile: 0.287,
    Peru: 0.249, Ecuador: 0.272, Espana: 0.181, default: 0.35,
  },
  refrigerantes: { R410A: 2088, R22: 1810, R134a: 1430, default: 1500 },
  residuos:      { general: 0.5, organico: 0.8, default: 0.5 },
  viajes:        { aereo: 0.255, terrestre: 0.089, default: 0.15 },
  precio_kwh_cop: 650,
}

function calcularDesdeEmissions({ fuentes = [], pais = 'Colombia' }) {
  let alcance1 = 0, alcance2 = 0, alcance3 = 0
  const detalles = []

  for (const fuente of fuentes) {
    const { tipo, subtipo, cantidad = 0, unidad } = fuente
    if (!cantidad || cantidad <= 0) continue

    switch (tipo) {
      case 'combustible': {
        const factorMap = {
          gasolina: FACTORES.gasolina, diesel: FACTORES.diesel,
          acpm: FACTORES.acpm, gas_natural: FACTORES.gas_natural, carbon: FACTORES.carbon,
        }
        const factor = factorMap[subtipo] || FACTORES.diesel
        const emision = cantidad * factor
        alcance1 += emision
        detalles.push({ alcance: 1, categoria: `Combustible (${subtipo || 'diesel'})`, kgCO2e: Math.round(emision), cantidad: `${cantidad} ${unidad || 'galones'}` })
        break
      }
      case 'flota': {
        const factor = subtipo === 'gasolina' ? FACTORES.gasolina : FACTORES.diesel
        const emision = cantidad * factor
        alcance1 += emision
        detalles.push({ alcance: 1, categoria: `Flota (${subtipo || 'diesel'})`, kgCO2e: Math.round(emision), cantidad: `${cantidad} galones` })
        break
      }
      case 'electricidad': {
        const kwh = unidad === 'cop' ? cantidad / FACTORES.precio_kwh_cop : cantidad
        const factor = FACTORES.electricidad[pais] || FACTORES.electricidad.default
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
        const factor = FACTORES.residuos[subtipo] || FACTORES.residuos.default
        const emision = cantidad * factor
        alcance3 += emision
        detalles.push({ alcance: 3, categoria: `Residuos (${subtipo || 'general'})`, kgCO2e: Math.round(emision), cantidad: `${cantidad} kg` })
        break
      }
      case 'viajes': {
        const factor = FACTORES.viajes[subtipo] || FACTORES.viajes.default
        const emision = cantidad * factor
        alcance3 += emision
        detalles.push({ alcance: 3, categoria: `Viajes (${subtipo || 'general'})`, kgCO2e: Math.round(emision), cantidad: `${cantidad} km` })
        break
      }
    }
  }

  const totalKgMes = alcance1 + alcance2 + alcance3
  const totalTonAnio = Math.round((totalKgMes * 12) / 1000 * 10) / 10
  const nivelImpacto = totalTonAnio < 20 ? 'Bajo' : totalTonAnio < 100 ? 'Moderado' : 'Alto'

  return {
    alcance1_kg_mes: Math.round(alcance1),
    alcance2_kg_mes: Math.round(alcance2),
    alcance3_kg_mes: Math.round(alcance3),
    total_kg_mes: Math.round(totalKgMes),
    total_ton_anio: totalTonAnio,
    nivel_impacto: nivelImpacto,
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
    const { empresa, periodo, fuentes } = req.body

    if (!empresa?.nombre) {
      return res.status(400).json({ error: 'bad_request', message: 'empresa.nombre es requerido' })
    }
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
            { tipo: 'flota', subtipo: 'diesel', cantidad: 300, unidad: 'galones' },
            { tipo: 'refrigerantes', subtipo: 'R410A', cantidad: 2, unidad: 'kg' },
            { tipo: 'residuos', subtipo: 'general', cantidad: 50, unidad: 'kg' },
            { tipo: 'viajes', subtipo: 'aereo', cantidad: 5000, unidad: 'km' },
          ],
        },
      })
    }

    const resultado = calcularDesdeEmissions({ fuentes, pais: empresa?.pais || 'Colombia' })
    const reportId = `ecm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    return res.status(200).json({
      id: reportId,
      empresa,
      periodo: periodo || null,
      resultado,
      fuentes_procesadas: fuentes.length,
      creditos_usados: 1,
      report_url: `https://ecometrix-app-one.vercel.app/reporte/${reportId}`,
    })
  } catch (err) {
    return res.status(400).json({ error: 'invalid_json', message: err.message })
  }
}
