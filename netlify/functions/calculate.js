// netlify/functions/calculate.js
// POST /api/calculate — recibe respuestas del cuestionario, calcula emisiones con Claude

// ─── FACTORES DE EMISIÓN IPCC AR6 ────────────────────────────────────────────
const FACTORES = {
  // Combustibles (kg CO2e por galón)
  gasolina:     8.78,
  diesel:       10.15,
  acpm:         10.15,
  gas_natural:  5.49,   // por m³
  carbon:       2.42,   // por kg
  // Electricidad (kg CO2e por kWh) — por país
  electricidad: {
    Colombia:   0.126,  // XM 2023
    Mexico:     0.454,
    Argentina:  0.321,
    Chile:      0.287,
    Peru:       0.249,
    Ecuador:    0.272,
    Espana:     0.181,
    default:    0.35,
  },
  // Precio estimado electricidad (COP/kWh) para cuando no tienen kWh
  precio_kwh_cop: 650,
}

// ─── CÁLCULO GHG ─────────────────────────────────────────────────────────────
function calcularEmisiones(empresa, respuestas) {
  let alcance1 = 0  // kg CO2e/mes
  let alcance2 = 0  // kg CO2e/mes
  const detalles = []

  // ── ALCANCE 1 ──────────────────────────────────────────────────────────────

  // Combustibles estacionarios
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

  // Flota vehicular
  const flota = respuestas['a1_flota_cantidad']
  const galFlota = parseFloat(respuestas['a1_flota_combustible']) || 0
  if (flota && flota !== 'Ninguno') {
    let galEstimado = galFlota
    if (!galEstimado) {
      // Estimación por cantidad de vehículos
      const mapFlota = { '1 – 5 vehículos': 3, '6 – 20 vehículos': 13, '21 – 50 vehículos': 35, 'Más de 50 vehículos': 75 }
      const numV = mapFlota[flota] || 3
      galEstimado = numV * 60  // ~60 gal/vehículo/mes promedio
    }
    const emision = galEstimado * FACTORES.diesel
    alcance1 += emision
    detalles.push({ categoria: 'Flota vehicular', kgCO2e: emision, fuente: 'ACPM/Diésel', cantidad: `${galEstimado} gal/mes` })
  }

  // Generador
  const generador = respuestas['a1_generador']
  if (generador && generador.includes('Sí')) {
    let galGen = 30
    if (generador.includes('frecuente')) galGen = 150
    if (generador.includes('principal')) galGen = 600
    const emision = galGen * FACTORES.diesel
    alcance1 += emision
    detalles.push({ categoria: 'Generador eléctrico', kgCO2e: emision, fuente: 'Diésel', cantidad: `~${galGen} gal/mes estimado` })
  }

  // Refrigerantes (estimación por cantidad de equipos)
  const refrig = respuestas['a1_refrigerantes']
  if (refrig && refrig !== 'No tenemos') {
    const mapR = { '1 – 5 equipos': 50, '6 – 20 equipos': 150, 'Más de 20 equipos': 400, 'Sistema industrial de refrigeración': 1200 }
    const emision = mapR[refrig] || 50
    alcance1 += emision
    detalles.push({ categoria: 'Gases refrigerantes (HFCs)', kgCO2e: emision, fuente: 'Estimación por equipos', cantidad: refrig })
  }

  // ── ALCANCE 2 ──────────────────────────────────────────────────────────────

  const factorElec = FACTORES.electricidad[empresa.pais] || FACTORES.electricidad.default

  // kWh conocido o estimado desde factura
  const tieneKwh = respuestas['a2_electricidad_proveedor']
  let kwh = 0
  if (tieneKwh?.op === 'Sí, lo tengo' && tieneKwh?.num) {
    kwh = parseFloat(tieneKwh.num)
  } else {
    const facturasCOP = parseFloat(respuestas['a2_electricidad_kwh']) || 0
    kwh = facturasCOP > 0 ? facturasCOP / FACTORES.precio_kwh_cop : 0
  }

  // Descuento por renovables
  const renovables = respuestas['a2_fuentes_renovables']
  let descuentoRenovable = 0
  if (renovables === 'Paneles solares (autoconsumo parcial)') descuentoRenovable = 0.15
  if (renovables === 'Paneles solares (cubre > 50% del consumo)') descuentoRenovable = 0.55
  if (renovables === 'Compramos certificados de energía renovable (RECs)') descuentoRenovable = 1.0

  if (kwh > 0) {
    const emision = kwh * factorElec * (1 - descuentoRenovable)
    alcance2 += emision
    detalles.push({
      categoria: 'Consumo eléctrico',
      kgCO2e: emision,
      fuente: `Red eléctrica ${empresa.pais}`,
      cantidad: `${Math.round(kwh)} kWh/mes`,
      factorUsado: `${factorElec} kg CO2e/kWh`
    })
  }

  const totalKgMes = alcance1 + alcance2
  const totalTonAnio = (totalKgMes * 12) / 1000

  // Nivel de impacto por sector y tamaño
  const thresholds = {
    micro:    { bajo: 500, moderado: 2000 },
    pequena:  { bajo: 2000, moderado: 8000 },
    mediana:  { bajo: 8000, moderado: 30000 },
    grande:   { bajo: 30000, moderado: 100000 },
  }
  const t = thresholds[empresa.tamano] || thresholds.pequena
  const nivelImpacto = totalKgMes < t.bajo ? 'Bajo' : totalKgMes < t.moderado ? 'Moderado' : 'Alto'

  // Valoración EU ETS (~65 EUR/ton CO2e, ~280.000 COP/ton)
  const valorETS_COP = Math.round(totalTonAnio * 280000)

  return {
    alcance1: Math.round(alcance1),
    alcance2: Math.round(alcance2),
    totalKgMes: Math.round(totalKgMes),
    totalTonAnio: Math.round(totalTonAnio * 10) / 10,
    nivelImpacto,
    valorETS_COP,
    detalles,
  }
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { empresa, respuestas } = JSON.parse(event.body)

    // Cálculo GHG
    const calculo = calcularEmisiones(empresa, respuestas)

    // Análisis narrativo con Claude
    let analisis = null
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (apiKey) {
      const prompt = `Eres un consultor experto en huella de carbono certificado en GHG Protocol e ISO 14064.

Empresa: ${empresa.nombre}
Sector: ${empresa.sector}
Tamaño: ${empresa.tamano}
País: ${empresa.pais}

RESULTADOS DEL DIAGNÓSTICO:
- Alcance 1 (emisiones directas): ${calculo.alcance1} kg CO2e/mes
- Alcance 2 (energía indirecta): ${calculo.alcance2} kg CO2e/mes
- TOTAL: ${calculo.totalKgMes} kg CO2e/mes = ${calculo.totalTonAnio} toneladas CO2e/año
- Nivel de impacto: ${calculo.nivelImpacto}
- Valor EU ETS estimado: COP ${calculo.valorETS_COP.toLocaleString()}/año

RESPUESTAS CLAVE:
${Object.entries(respuestas).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join('\n')}

Genera un análisis en español con este formato JSON exacto:
{
  "resumen_ejecutivo": "2-3 oraciones sobre la situación de la empresa",
  "principales_fuentes": ["fuente 1", "fuente 2", "fuente 3"],
  "benchmark": "comparación con empresas similares del sector ${empresa.sector}",
  "plan_accion": [
    {"accion": "descripción", "reduccion_pct": 15, "dificultad": "Fácil", "plazo": "1-3 meses"},
    {"accion": "descripción", "reduccion_pct": 20, "dificultad": "Media", "plazo": "3-6 meses"},
    {"accion": "descripción", "reduccion_pct": 25, "dificultad": "Media", "plazo": "6-12 meses"},
    {"accion": "descripción", "reduccion_pct": 10, "dificultad": "Fácil", "plazo": "1-3 meses"},
    {"accion": "descripción", "reduccion_pct": 30, "dificultad": "Difícil", "plazo": "12-24 meses"}
  ],
  "siguiente_paso": "recomendación principal inmediata"
}`

      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
          }),
        })
        const aiData = await resp.json()
        const text = aiData.content?.[0]?.text || ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) analisis = JSON.parse(jsonMatch[0])
      } catch (aiErr) {
        console.error('Claude API error:', aiErr)
      }
    }

    // Respuesta final
    const resultado = {
      id: `ecm_${Date.now()}`,
      empresa,
      calculo,
      analisis: analisis || {
        resumen_ejecutivo: `${empresa.nombre} tiene una huella de carbono de ${calculo.totalTonAnio} toneladas CO2e/año, con nivel de impacto ${calculo.nivelImpacto} para su sector y tamaño.`,
        principales_fuentes: calculo.detalles.map(d => d.categoria),
        benchmark: `Las empresas del sector ${empresa.sector} de tamaño similar tienen huella promedio entre 5 y 50 ton CO2e/año.`,
        plan_accion: [
          { accion: 'Auditoría energética de instalaciones', reduccion_pct: 15, dificultad: 'Fácil', plazo: '1-3 meses' },
          { accion: 'Migración a energías renovables (contrato de energía limpia)', reduccion_pct: 40, dificultad: 'Media', plazo: '3-6 meses' },
          { accion: 'Optimización de rutas y eficiencia de flota', reduccion_pct: 20, dificultad: 'Fácil', plazo: '1-3 meses' },
          { accion: 'Programa de eficiencia en equipos de refrigeración', reduccion_pct: 10, dificultad: 'Media', plazo: '6-12 meses' },
          { accion: 'Política de teletrabajo y movilidad sostenible', reduccion_pct: 8, dificultad: 'Fácil', plazo: '1-3 meses' },
        ],
        siguiente_paso: 'Iniciar auditoría energética para identificar las mayores oportunidades de reducción.',
      },
      timestamp: new Date().toISOString(),
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultado),
    }

  } catch (err) {
    console.error('Calculate function error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error calculando emisiones', detail: err.message }),
    }
  }
}
