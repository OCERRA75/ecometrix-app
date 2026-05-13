// ─── BANCO DE PREGUNTAS GHG PROTOCOL ─────────────────────────────────────────
// Basado en GHG Protocol Corporate Standard + ISO 14064-1
// Alcance 1: emisiones directas | Alcance 2: energía indirecta

export const SECTORES = [
  'Manufactura',
  'Retail / Comercio',
  'Logística / Transporte',
  'Servicios profesionales',
  'Alimentos y bebidas',
  'Construcción',
  'Tecnología / Software',
  'Salud / Farmacéutico',
  'Agropecuario',
  'Otro',
]

export const TAMANOS = [
  { value: 'micro',    label: 'Microempresa',  desc: 'Hasta 10 empleados' },
  { value: 'pequena',  label: 'Pequeña',        desc: '11 – 50 empleados' },
  { value: 'mediana',  label: 'Mediana',         desc: '51 – 200 empleados' },
  { value: 'grande',   label: 'Grande',          desc: 'Más de 200 empleados' },
]

// ─── ALCANCE 1 — Emisiones directas ──────────────────────────────────────────
export const preguntasAlcance1 = [
  {
    id: 'a1_combustible_tipo',
    alcance: 1,
    categoria: 'Combustibles estacionarios',
    pregunta: '¿Tu empresa usa combustibles para procesos internos (calefacción, cocinas industriales, calderas)?',
    tipo: 'opciones',
    opciones: ['No usamos combustibles', 'Gas natural', 'ACPM / Diésel', 'Gasolina', 'Carbón', 'Varios combustibles'],
    ayuda: 'Incluye calderas, hornos, generadores estacionarios y equipos de calefacción en instalaciones propias.',
    requerido: true,
  },
  {
    id: 'a1_combustible_cantidad',
    alcance: 1,
    categoria: 'Combustibles estacionarios',
    pregunta: '¿Cuánto combustible estacionario consume tu empresa al mes?',
    tipo: 'numero',
    unidad: 'm³ o galones/mes',
    placeholder: 'Ej: 500',
    ayuda: 'Revisa tus facturas de gas o combustible. Si tienes varios, suma el total estimado.',
    condicion: (r) => r['a1_combustible_tipo'] && r['a1_combustible_tipo'] !== 'No usamos combustibles',
    requerido: false,
  },
  {
    id: 'a1_flota_cantidad',
    alcance: 1,
    categoria: 'Flota vehicular propia',
    pregunta: '¿Cuántos vehículos propios o arrendados opera tu empresa?',
    tipo: 'opciones',
    opciones: ['Ninguno', '1 – 5 vehículos', '6 – 20 vehículos', '21 – 50 vehículos', 'Más de 50 vehículos'],
    ayuda: 'Incluye carros, camionetas, camiones, motos que sean propiedad o estén a nombre de la empresa.',
    requerido: true,
  },
  {
    id: 'a1_flota_combustible',
    alcance: 1,
    categoria: 'Flota vehicular propia',
    pregunta: '¿Cuántos galones de combustible consume tu flota al mes?',
    tipo: 'numero',
    unidad: 'galones/mes',
    placeholder: 'Ej: 300',
    ayuda: 'Revisa los tiquetes de combustible o el promedio mensual de abastecimiento de tu flota.',
    condicion: (r) => r['a1_flota_cantidad'] && r['a1_flota_cantidad'] !== 'Ninguno',
    requerido: false,
  },
  {
    id: 'a1_refrigerantes',
    alcance: 1,
    categoria: 'Gases refrigerantes',
    pregunta: '¿Tu empresa usa sistemas de refrigeración o aire acondicionado?',
    tipo: 'opciones',
    opciones: ['No tenemos', '1 – 5 equipos', '6 – 20 equipos', 'Más de 20 equipos', 'Sistema industrial de refrigeración'],
    ayuda: 'Los gases HFCs de equipos de A/C y refrigeración son emisores de Alcance 1. Incluye cuartos fríos, exhibidores y aires de oficina.',
    requerido: true,
  },
  {
    id: 'a1_generador',
    alcance: 1,
    categoria: 'Generación eléctrica propia',
    pregunta: '¿Tu empresa tiene planta eléctrica o generador de emergencia?',
    tipo: 'opciones',
    opciones: ['No', 'Sí, uso ocasional (< 10 h/mes)', 'Sí, uso frecuente (> 10 h/mes)', 'Sí, es nuestra fuente principal de electricidad'],
    ayuda: 'Los generadores a diésel o gasolina son fuente directa de emisiones de CO2.',
    requerido: true,
  },
  {
    id: 'a1_procesos_industriales',
    alcance: 1,
    categoria: 'Procesos industriales',
    pregunta: '¿Tu empresa tiene procesos que emiten gases directamente? (soldadura, pintura, fabricación química)',
    tipo: 'opciones',
    opciones: ['No aplica a nuestro negocio', 'Soldadura o corte metálico', 'Pintura o acabados superficiales', 'Fabricación química o farmacéutica', 'Procesamiento de alimentos con fermentación', 'Otro proceso industrial'],
    ayuda: 'Algunos procesos productivos emiten CO2, CH4 o N2O directamente, independiente del combustible.',
    requerido: true,
    saltarSectores: ['Tecnología / Software', 'Servicios profesionales'],
  },
]

// ─── ALCANCE 2 — Energía indirecta ───────────────────────────────────────────
export const preguntasAlcance2 = [
  {
    id: 'a2_electricidad_kwh',
    alcance: 2,
    categoria: 'Consumo eléctrico',
    pregunta: '¿Cuánto paga tu empresa de electricidad al mes aproximadamente?',
    tipo: 'numero',
    unidad: 'COP o USD/mes',
    placeholder: 'Ej: 800000',
    ayuda: 'Revisa tu última factura de energía. Si tienes varios locales, suma todas las facturas.',
    requerido: true,
  },
  {
    id: 'a2_electricidad_proveedor',
    alcance: 2,
    categoria: 'Consumo eléctrico',
    pregunta: '¿Conoces tu consumo en kWh de la factura de energía?',
    tipo: 'opciones_con_numero',
    opciones: ['No lo sé', 'Sí, lo tengo'],
    campoNumero: { label: 'kWh/mes', placeholder: 'Ej: 1500' },
    ayuda: 'Los kWh aparecen en la factura de tu proveedor (EPM, Electricaribe, Codensa, etc.). Si no los tienes, usamos el valor en pesos para estimarlo.',
    requerido: true,
  },
  {
    id: 'a2_fuentes_renovables',
    alcance: 2,
    categoria: 'Energías renovables',
    pregunta: '¿Tu empresa tiene paneles solares u otras fuentes de energía renovable?',
    tipo: 'opciones',
    opciones: ['No', 'Paneles solares (autoconsumo parcial)', 'Paneles solares (cubre > 50% del consumo)', 'Otras renovables (eólica, biomasa)', 'Compramos certificados de energía renovable (RECs)'],
    ayuda: 'Las fuentes renovables propias reducen las emisiones de Alcance 2.',
    requerido: true,
  },
  {
    id: 'a2_otras_energias',
    alcance: 2,
    categoria: 'Otras energías compradas',
    pregunta: '¿Tu empresa compra vapor, agua caliente o frío de red de un proveedor externo?',
    tipo: 'opciones',
    opciones: ['No', 'Vapor de proceso', 'Agua caliente / climatización de red', 'Frío de red (distrito de cooling)'],
    ayuda: 'Algunas zonas industriales o edificios corporativos proveen energía térmica centralizada.',
    requerido: false,
  },
  {
    id: 'a2_teletrabajo',
    alcance: 2,
    categoria: 'Trabajo remoto',
    pregunta: '¿Qué porcentaje de tu equipo trabaja desde casa?',
    tipo: 'opciones',
    opciones: ['Todos presenciales (0%)', 'Mayoría presencial (< 25% remoto)', 'Mixto (25 – 75% remoto)', 'Mayoría remota (> 75% remoto)', 'Empresa 100% remota'],
    ayuda: 'El teletrabajo transfiere parte del consumo eléctrico al hogar de los empleados (Alcance 3 en el futuro).',
    requerido: true,
  },
  {
    id: 'a2_numero_empleados',
    alcance: 2,
    categoria: 'Datos de contexto',
    pregunta: '¿Cuántos empleados tiene tu empresa actualmente?',
    tipo: 'numero',
    unidad: 'empleados',
    placeholder: 'Ej: 25',
    ayuda: 'Este dato nos ayuda a calcular la huella per cápita y compararte con empresas similares de tu sector.',
    requerido: true,
  },
  {
    id: 'a2_metas_sostenibilidad',
    alcance: 2,
    categoria: 'Contexto estratégico',
    pregunta: '¿Tu empresa ya tiene algún compromiso o meta de sostenibilidad?',
    tipo: 'opciones',
    opciones: [
      'No, este es nuestro primer paso',
      'Tenemos iniciativas informales',
      'Tenemos política de sostenibilidad documentada',
      'Estamos certificados (ISO 14001, B Corp, etc.)',
      'Reportamos a clientes o inversores sobre sostenibilidad',
    ],
    ayuda: 'Esta información nos ayuda a personalizar el plan de reducción de tu reporte.',
    requerido: true,
  },
  {
    id: 'a2_principal_motivacion',
    alcance: 2,
    categoria: 'Contexto estratégico',
    pregunta: '¿Cuál es tu principal motivación para medir la huella de carbono?',
    tipo: 'opciones',
    opciones: [
      'Cumplir requisitos de un cliente o licitación',
      'Prepararnos para regulación futura (CSRD, etc.)',
      'Diferenciarnos en el mercado',
      'Reducir costos operativos',
      'Atracción de inversión o financiamiento verde',
      'Compromiso genuino con el medio ambiente',
    ],
    ayuda: 'Usamos esto para priorizar las recomendaciones de tu plan de acción.',
    requerido: true,
  },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Filtra preguntas según sector y respuestas previas
export function getPreguntasFiltradas(preguntas, sector, respuestas) {
  return preguntas.filter(p => {
    // Saltar por sector
    if (p.saltarSectores && p.saltarSectores.includes(sector)) return false
    // Condición dinámica
    if (p.condicion && !p.condicion(respuestas)) return false
    return true
  })
}

// Total de preguntas activas (para barra de progreso)
export function getTotalPreguntas(sector, respuestas) {
  const a1 = getPreguntasFiltradas(preguntasAlcance1, sector, respuestas)
  const a2 = getPreguntasFiltradas(preguntasAlcance2, sector, respuestas)
  return a1.length + a2.length
}

// Progreso global 0-100
export function getProgreso(step, currentQ, sector, respuestas) {
  if (step === 'onboarding') return 5
  if (step === 'resumen') return 100
  const a1 = getPreguntasFiltradas(preguntasAlcance1, sector, respuestas)
  const a2 = getPreguntasFiltradas(preguntasAlcance2, sector, respuestas)
  const total = a1.length + a2.length
  const done = step === 'alcance1' ? currentQ : (a1.length + currentQ)
  return Math.round(5 + (done / total) * 90)
}
