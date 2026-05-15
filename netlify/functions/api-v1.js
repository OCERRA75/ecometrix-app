// netlify/functions/api-v1.js
// REST API pública de EcoMetriX — autenticación por API key
// Rutas: GET /api/v1/health | POST /api/v1/calculate | GET /api/v1/factors

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
    const factorMap = { gasolina: FACTORES.gasolina, diesel: FACTORES.diesel, acpm: FACTORES.acpm, gas_natural: FACTORES.gas_natural, carbon: FACTORES.carbon }
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
  // En producción: verificar contra Supabase tabla api_keys
  // Por ahora: cualquier key con formato correcto
  const key = event.headers['x-api-key'] || event.headers['authorization']?.replace('Bearer ', '')
  if (!key) return false
  // Demo: aceptar keys que empiecen con 'ecm_'
  return key.startsWith('ecm_') || key.startsWith('sk-ecm-')
}

export const handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' }
  }

  const path = event.path.replace('/.netlify/functions/api-v1', '').replace('/api/v1', '') || '/'

  // ── GET /health — sin auth ──────────────────────────────────────────────────
  if (event.httpMethod === 'GET' && (path === '/health' || path === '/' || path === '')) {
    return response(200, {
      status: 'ok',
      version: '1.0.0',
      service: 'EcoMetriX API',
      endpoints: [
        'GET  /api/v1/health',
        'GET  /api/v1/factors',
        'POST /api/v1/calculate',
      ],
      docs: 'https://ecometrix-co.netlify.app/developers',
      contact: 'oscar@ecometrix.co',
    })
  }

  // ── GET /factors — sin auth ─────────────────────────────────────────────────
  if (event.httpMethod === 'GET' && path === '/factors') {
    return response(200, {
      combustibles: {
        gasolina:   { factor: 8.78,  unidad: 'kg CO2e/galón', fuente: 'IPCC AR6' },
        diesel:     { factor: 10.15, unidad: 'kg CO2e/galón', fuente: 'IPCC AR6' },
        acpm:       { factor: 10.15, unidad: 'kg CO2e/galón', fuente: 'IPCC AR6' },
        gas_natural:{ factor: 5.49,  unidad: 'kg CO2e/m³',    fuente: 'IPCC AR6' },
        carbon:     { factor: 2.42,  unidad: 'kg CO2e/kg',    fuente: 'IPCC AR6' },
      },
      electricidad: Object.entries(FACTORES.electricidad)
        .filter(([k]) => k !== 'default')
        .reduce((acc, [k, v]) => ({ ...acc, [k]: { factor: v, unidad: 'kg CO2e/kWh' } }), {}),
      actualizacion: '2024-01',
      metodologia: 'GHG Protocol Corporate Standard + IPCC AR6 Emission Factors',
    })
  }

  // ── Rutas que requieren auth ────────────────────────────────────────────────
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
            }
          }
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

  return response(404, {
    error: 'not_found',
    message: `Ruta no encontrada: ${event.httpMethod} ${path}`,
    endpoints_disponibles: ['GET /health', 'GET /factors', 'POST /calculate'],
  })
}
