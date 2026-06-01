// netlify/functions/calculate.js
const FACTORES = {
  gasolina: 8.78, diesel: 10.15, acpm: 10.15, gas_natural: 5.49, carbon: 2.42,
  electricidad: { Colombia: 0.126, Mexico: 0.454, Argentina: 0.321, Chile: 0.287, Peru: 0.249, Ecuador: 0.272, Espana: 0.181, default: 0.35 },
  precio_kwh_cop: 650,
  alcance3: {
    'Materias primas / insumos físicos': 0.85, 'Servicios profesionales / digitales': 0.15,
    'Equipos y maquinaria': 0.45, 'Alimentos / productos perecederos': 1.20,
    'Materiales de construcción': 0.95, 'Tecnología / hardware': 0.35, 'Mixto': 0.55, default: 0.55,
  },
  transporte_upstream: {
    'Proveedores locales (< 100 km)': 0.05, 'Proveedores nacionales (100 – 1000 km)': 0.12,
    'Importaciones regionales (LATAM)': 0.18, 'Importaciones intercontinentales': 0.35, 'Mixto local e internacional': 0.20,
  },
  viajes: {
    'No hay viajes de negocio': 0, 'Ocasional (< 5 viajes/año por empresa)': 250,
    'Frecuente (5 – 20 viajes/año)': 1500, 'Muy frecuente (> 20 viajes/año)': 5000, 'Viajes internacionales frecuentes': 12000,
  },
}

const COP_TO_USD = 4000

function calcularEmisiones(empresa, respuestas) {
  let alcance1 = 0, alcance2 = 0, alcance3 = 0
  const detalles = [], detallesA3 = []

  // ── ALCANCE 1 ──────────────────────────────────────────────────────────────
  const tipoComb = respuestas['a1_combustible_tipo']
  const cantComb = parseFloat(respuestas['a1_combustible_cantidad']) || 0
  if (tipoComb && tipoComb !== 'No usamos combustibles' && cantComb > 0) {
    let factor = FACTORES.diesel
    if (tipoComb === 'Gas natural') factor = FACTORES.gas_natural
    else if (tipoComb === 'Gasolina') factor = FACTORES.gasolina
    else if (tipoComb === 'Carbón') factor = FACTORES.carbon
    const emision = cantComb * factor
    alcance1 += emision
    detalles.push({ categoria: 'Combustibles estacionarios', kgCO2e: emision, fuente: tipoComb, cantidad: `${cantComb} unidades/mes` })
  }

  const flota = respuestas['a1_flota_cantidad']
  const galFlota = parseFloat(respuestas['a1_flota_combustible']) || 0
  if (flota && flota !== 'Ninguno') {
    let galEstimado = galFlota
    if (!galEstimado) {
      const mapFlota = { '1 – 5 vehículos': 3, '6 – 20 vehículos': 13, '21 – 50 vehículos': 35, 'Más de 50 vehículos': 75 }
      galEstimado = (mapFlota[flota] || 3) * 60
    }
    const emision = galEstimado * FACTORES.diesel
    alcance1 += emision
    detalles.push({ categoria: 'Flota vehicular', kgCO2e: emision, fuente: 'ACPM/Diésel', cantidad: `${galEstimado} gal/mes` })
  }

  const generador = respuestas['a1_generador']
  if (generador && generador.includes('Sí')) {
    let galGen = generador.includes('frecuente') ? 150 : generador.includes('principal') ? 600 : 30
    const emision = galGen * FACTORES.diesel
    alcance1 += emision
    detalles.push({ categoria: 'Generador eléctrico', kgCO2e: emision, fuente: 'Diésel', cantidad: `~${galGen} gal/mes estimado` })
  }

  const refrig = respuestas['a1_refrigerantes']
  if (refrig && refrig !== 'No tenemos') {
    const mapR = { '1 – 5 equipos': 50, '6 – 20 equipos': 150, 'Más de 20 equipos': 400, 'Sistema industrial de refrigeración': 1200 }
    const emision = mapR[refrig] || 50
    alcance1 += emision
    detalles.push({ categoria: 'Gases refrigerantes (HFCs)', kgCO2e: emision, fuente: 'Estimación por equipos', cantidad: refrig })
  }

  // ── ALCANCE 2 ──────────────────────────────────────────────────────────────
  const factorElec = FACTORES.electricidad[empresa.pais] || FACTORES.electricidad.default
  const tieneKwh = respuestas['a2_electricidad_proveedor']
  let kwh = 0
  if (tieneKwh?.op === 'Sí, lo tengo' && tieneKwh?.num) kwh = parseFloat(tieneKwh.num)
  else {
    const facturasCOP = parseFloat(respuestas['a2_electricidad_kwh']) || 0
    kwh = facturasCOP > 0 ? facturasCOP / FACTORES.precio_kwh_cop : 0
  }
  const renovables = respuestas['a2_fuentes_renovables']
  let descuentoRenovable = 0
  if (renovables?.includes('parcial')) descuentoRenovable = 0.15
  if (renovables?.includes('50%')) descuentoRenovable = 0.55
  if (renovables?.includes('RECs')) descuentoRenovable = 1.0
  if (kwh > 0) {
    const emision = kwh * factorElec * (1 - descuentoRenovable)
    alcance2 += emision
    detalles.push({ categoria: 'Consumo eléctrico', kgCO2e: emision, fuente: `Red eléctrica ${empresa.pais}`, cantidad: `${Math.round(kwh)} kWh/mes`, factorUsado: `${factorElec} kg CO2e/kWh` })
  }

  // ── ALCANCE 3 ──────────────────────────────────────────────────────────────
  const gastoProveedores = parseFloat(respuestas['a3_compras_proveedores']) || 0
  const tipoCompra = respuestas['a3_compras_tipo'] || 'Mixto'
  if (gastoProveedores > 0) {
    const gastoUSD = gastoProveedores > 10000 ? gastoProveedores / COP_TO_USD : gastoProveedores
    const factor = FACTORES.alcance3[tipoCompra] || FACTORES.alcance3.default
    const emision = gastoUSD * factor
    alcance3 += emision
    detallesA3.push({ categoria: 'Bienes y servicios comprados', kgCO2e: emision, fuente: tipoCompra, cantidad: `$${gastoUSD.toFixed(0)} USD/mes` })
  }

  const transporteUp = respuestas['a3_transporte_proveedores']
  if (transporteUp && gastoProveedores > 0) {
    const factor = FACTORES.transporte_upstream[transporteUp] || 0.15
    const emision = (gastoProveedores / COP_TO_USD) * factor * 0.5
    alcance3 += emision
    detallesA3.push({ categoria: 'Transporte upstream (proveedores)', kgCO2e: emision, fuente: transporteUp })
  }

  const transporteDown = respuestas['a3_distribucion_clientes']
  if (transporteDown && transporteDown !== 'Entrega digital (sin transporte físico)') {
    const factorDown = { 'Clientes vienen a nuestras instalaciones': 0, 'Entrega local (< 100 km)': 80, 'Distribución nacional': 250, 'Distribución internacional': 800, 'Mixto': 150 }
    const emision = factorDown[transporteDown] || 100
    alcance3 += emision
    detallesA3.push({ categoria: 'Distribución a clientes', kgCO2e: emision, fuente: transporteDown })
  }

  const viajes = respuestas['a3_viajes_negocio']
  if (viajes) {
    const emisionAnual = FACTORES.viajes[viajes] || 0
    const emisionMes = emisionAnual / 12
    alcance3 += emisionMes
    if (emisionMes > 0) detallesA3.push({ categoria: 'Viajes de negocios', kgCO2e: emisionMes, fuente: viajes })
  }

  const empleados = parseFloat(respuestas['a2_numero_empleados']) || 10
  const commuting = respuestas['a3_desplazamiento_empleados']
  if (commuting && commuting !== 'Trabajan desde casa (100% remoto)' && commuting !== 'A pie o bicicleta') {
    const factorComm = { 'Transporte público (metro, bus)': 2.5, 'Vehículo particular': 8.5, 'Mixto transporte público y particular': 5.0, 'Transporte empresarial': 4.0 }
    const emision = empleados * (factorComm[commuting] || 5.0) * 22
    alcance3 += emision
    detallesA3.push({ categoria: 'Desplazamiento empleados', kgCO2e: emision, fuente: commuting, cantidad: `${empleados} empleados × 22 días` })
  }

  const residuos = respuestas['a3_residuos_cantidad']
  if (residuos) {
    const factorRes = { 'Reciclaje y compostaje (> 70%)': 20, 'Reciclaje parcial (30 – 70%)': 60, 'Mayoría a relleno sanitario': 150, 'Residuos peligrosos (requiere gestor especializado)': 200, 'No tenemos gestión formal de residuos': 120 }
    const emision = (factorRes[residuos] || 80) * (empleados / 10)
    alcance3 += emision
    detallesA3.push({ categoria: 'Residuos generados', kgCO2e: emision, fuente: residuos })
  }

  const totalKgMes = alcance1 + alcance2 + alcance3
  const totalTonAnio = (totalKgMes * 12) / 1000
  const thresholds = { micro: { bajo: 500, moderado: 2000 }, pequena: { bajo: 2000, moderado: 8000 }, mediana: { bajo: 8000, moderado: 30000 }, grande: { bajo: 30000, moderado: 100000 } }
  const t = thresholds[empresa.tamano] || thresholds.pequena
  const nivelImpacto = totalKgMes < t.bajo ? 'Bajo' : totalKgMes < t.moderado ? 'Moderado' : 'Alto'
  const valorETS_COP = Math.round(totalTonAnio * 280000)

  return {
    alcance1: Math.round(alcance1), alcance2: Math.round(alcance2), alcance3: Math.round(alcance3),
    totalKgMes: Math.round(totalKgMes), totalTonAnio: Math.round(totalTonAnio * 10) / 10,
    nivelImpacto, valorETS_COP,
    detalles: [...detalles, ...detallesA3],
    detallesA1: detalles, detallesA3,
  }
}

// ── Guardar en Supabase ────────────────────────────────────────────────────
async function guardarDiagnostico(resultado) {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://reoyytnbsjfgunqeylo.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseKey || !resultado.user_id) return

  try {
    await fetch(`${supabaseUrl}/rest/v1/diagnosticos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        id: resultado.id,
        user_id: resultado.user_id,
        empresa: resultado.empresa,
        calculo: resultado.calculo,
        analisis: resultado.analisis,
        respuestas: resultado.respuestas,
        created_at: resultado.timestamp,
      }),
    })
  } catch (e) {
    console.error('Supabase insert error:', e)
    // No lanzar — el cálculo ya está listo, solo falla el guardado
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  try {
    const { empresa, respuestas, user_id } = JSON.parse(event.body)
    const calculo = calcularEmisiones(empresa, respuestas)
    let analisis = null
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      const prompt = `Eres consultor experto en huella de carbono (GHG Protocol, ISO 14064).
Empresa: ${empresa.nombre} | Sector: ${empresa.sector} | Tamaño: ${empresa.tamano} | País: ${empresa.pais}
RESULTADOS: Alcance 1: ${calculo.alcance1} kg CO2e/mes | Alcance 2: ${calculo.alcance2} kg CO2e/mes | Alcance 3: ${calculo.alcance3} kg CO2e/mes | TOTAL: ${calculo.totalTonAnio} ton CO2e/año | Nivel: ${calculo.nivelImpacto}
Genera JSON exacto:
{"resumen_ejecutivo":"2-3 oraciones","principales_fuentes":["f1","f2","f3"],"benchmark":"comparación sectorial","plan_accion":[{"accion":"desc","reduccion_pct":15,"dificultad":"Fácil","plazo":"1-3 meses"},{"accion":"desc","reduccion_pct":20,"dificultad":"Media","plazo":"3-6 meses"},{"accion":"desc","reduccion_pct":25,"dificultad":"Media","plazo":"6-12 meses"},{"accion":"desc","reduccion_pct":10,"dificultad":"Fácil","plazo":"1-3 meses"},{"accion":"desc","reduccion_pct":30,"dificultad":"Difícil","plazo":"12-24 meses"}],"siguiente_paso":"recomendación"}`
      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
        })
        const aiData = await resp.json()
        const text = aiData.content?.[0]?.text || ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) analisis = JSON.parse(jsonMatch[0])
      } catch(e) { console.error('Claude API error:', e) }
    }

    const resultado = {
      id: `ecm_${Date.now()}`,
      user_id: user_id || null,
      empresa, calculo, respuestas,
      analisis: analisis || {
        resumen_ejecutivo: `${empresa.nombre} tiene una huella de carbono de ${calculo.totalTonAnio} toneladas CO2e/año (Alcances 1+2+3), con nivel de impacto ${calculo.nivelImpacto} para su sector.`,
        principales_fuentes: calculo.detalles.slice(0, 3).map(d => d.categoria),
        benchmark: `Las empresas del sector ${empresa.sector} de tamaño similar tienen huella promedio entre 5 y 50 ton CO2e/año.`,
        plan_accion: [
          { accion: 'Auditoría energética de instalaciones', reduccion_pct: 15, dificultad: 'Fácil', plazo: '1-3 meses' },
          { accion: 'Migración a energías renovables', reduccion_pct: 40, dificultad: 'Media', plazo: '3-6 meses' },
          { accion: 'Optimización de cadena de suministro', reduccion_pct: 20, dificultad: 'Media', plazo: '6-12 meses' },
          { accion: 'Política de viajes sostenibles', reduccion_pct: 10, dificultad: 'Fácil', plazo: '1-3 meses' },
          { accion: 'Programa de economía circular', reduccion_pct: 15, dificultad: 'Media', plazo: '6-12 meses' },
        ],
        siguiente_paso: 'Iniciar auditoría energética para identificar las mayores oportunidades de reducción.',
      },
      timestamp: new Date().toISOString(),
    }

    // Guardar en Supabase si hay usuario autenticado
    await guardarDiagnostico(resultado)

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resultado) }
  } catch (err) {
    console.error('Calculate error:', err)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) }
  }
}
