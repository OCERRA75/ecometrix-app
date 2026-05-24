// netlify/functions/api-v1.js
// REST API pública de EcoMetriX — autenticación por API key
// Rutas: GET /api/v1/health | GET /api/v1/factors | POST /api/v1/calculate | POST /api/v1/emissions

const FACTORES = {
  gasolina:    8.78,
  diesel:      10.15,
  acpm:        10.15,
  gas_natural: 5.49,
  carbon:      2.42,
  electricidad: {
    Colombia: 0.126, Mexico: 0.454, Argentina: 0.321, Chile: 0.287,
    Peru: 0.249, Ecuador: 0.272, Espana: 0.181, default: 0.35,
  },
  // Alcance 3 — factores adicionales
  refrigerantes: { R410A: 2088, R22: 1810, R134a: 1430, default: 1500 },
  residuos:      { general: 0.5, organico: 0.8, default: 0.5 },  // kg CO2e/kg
  viajes:        { aereo: 0.255, terrestre: 0.089, default: 0.15 }, // kg CO2e/km/pasajero
  precio_kwh_cop: 650,
}

// ── Cálculo legacy (usado por /calculate) ────────────────────────────────────
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

// ── Cálculo genérico para /emissions (array de fuentes) ─────────────────────
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
        let kwh = unidad === 'cop' ? cantidad / FACTORES.precio_kwh_cop : cantidad
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
      default:
        break
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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

function response(statusCode, body) {
  return { statusCode, headers: corsHeaders(), body: JSON.stringify(body) }
}

function validateApiKey(event) {
  const key = event.headers['x-api-key'] || event.headers['authorization']?.replace('Bearer ', '')
  if (!key) return false
  return key.startsWith('ecm_') || key.startsWith('sk-ecm-')
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' }
  }

  const path = event.path
    .replace('/.netlify/functions/api-v1', '')
    .replace('/api/v1', '') || '/'

  // ── GET /health ─────────────────────────────────────────────────────────────
  if (event.httpMethod === 'GET' && (path === '/health' || path === '/' || path === '')) {
    return response(200, {
      status: 'ok',
      version: '1.1.0',
      service: 'EcoMetriX API',
      endpoints: [
        'GET  /api/v1/health',
        'GET  /api/v1/factors',
        'POST /api/v1/calculate',
        'POST /api/v1/emissions',
      ],
      docs: 'https://ecometrix-co.netlify.app/developers',
      contact: 'oscar@ecometrix.co',
    })
  }

  // ── GET /factors ─────────────────────────────────────────────────────────────
  if (event.httpMethod === 'GET' && path === '/factors') {
    return response(200, {
      combustibles: {
        gasolina:    { factor: 8.78,  unidad: 'kg CO2e/galón', fuente: 'IPCC AR6' },
        diesel:      { factor: 10.15, unidad: 'kg CO2e/galón', fuente: 'IPCC AR6' },
        acpm:        { factor: 10.15, unidad: 'kg CO2e/galón', fuente: 'IPCC AR6' },
        gas_natural: { factor: 5.49,  unidad: 'kg CO2e/m³',    fuente: 'IPCC AR6' },
        carbon:      { factor: 2.42,  unidad: 'kg CO2e/kg',    fuente: 'IPCC AR6' },
      },
      electricidad: Object.entries(FACTORES.electricidad)
        .filter(([k]) => k !== 'default')
        .reduce((acc, [k, v]) => ({ ...acc, [k]: { factor: v, unidad: 'kg CO2e/kWh' } }), {}),
      refrigerantes: Object.entries(FACTORES.refrigerantes)
        .filter(([k]) => k !== 'default')
        .reduce((acc, [k, v]) => ({ ...acc, [k]: { gwp: v, unidad: 'kg CO2e/kg' } }), {}),
      actualizacion: '2024-01',
      metodologia: 'GHG Protocol Corporate Standard + IPCC AR6 Emission Factors',
    })
  }

  // ── Auth requerida desde aquí ─────────────────────────────────────────────
  if (!validateApiKey(event)) {
    return response(401, {
      error: 'unauthorized',
      message: 'API key requerida. Incluir header: X-API-Key: ecm_...',
      docs: 'https://ecometrix-co.netlify.app/developers',
    })
  }

  // ── POST /calculate ─────────────────────────────────────────────────────────
  if (event.httpMethod === 'POST' && path === '/calculate') {
    try {
      const body = JSON.parse(event.body || '{}')
      const { empresa, datos } = body
      if (!datos) {
        return response(400, {
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
      return response(200, {
        id: `ecm_api_${Date.now()}`,
        empresa: empresa || {},
        resultado,
        creditos_usados: 1,
      })
    } catch (err) {
      return response(400, { error: 'invalid_json', message: err.message })
    }
  }

  // ── POST /emissions — endpoint ERP ──────────────────────────────────────────
  if (event.httpMethod === 'POST' && path === '/emissions') {
    try {
      const body = JSON.parse(event.body || '{}')
      const { empresa, periodo, fuentes } = body

      // Validaciones
      if (!empresa?.nombre) {
        return response(400, {
          error: 'bad_request',
          message: 'empresa.nombre es requerido',
        })
      }
      if (!Array.isArray(fuentes) || fuentes.length === 0) {
        return response(400, {
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

      const resultado = calcularDesdeEmissions({
        fuentes,
        pais: empresa?.pais || 'Colombia',
      })

      const reportId = `ecm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

      // Fase 2: persistir en Supabase tabla emissions_import
      // await supabase.from('emissions_import').insert({ id: reportId, empresa, periodo, resultado })

      return response(200, {
        id: reportId,
        empresa,
        periodo: periodo || null,
        resultado,
        fuentes_procesadas: fuentes.length,
        creditos_usados: 1,
        // Fase 2: report_url: `https://ecometrix-co.netlify.app/reporte/${reportId}`
      })

    } catch (err) {
      return response(400, { error: 'invalid_json', message: err.message })
    }
  }

  // ── 404 ──────────────────────────────────────────────────────────────────────
  return response(404, {
    error: 'not_found',
    message: `Ruta no encontrada: ${event.httpMethod} ${path}`,
    endpoints_disponibles: ['GET /health', 'GET /factors', 'POST /calculate', 'POST /emissions'],
  })
}
