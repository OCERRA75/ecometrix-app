// src/pages/Manual.jsx
// Manual de usuario EcoMetriX — diseño editorial fresco
import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── SECCIONES DEL MANUAL ─────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'que-es',       label: '01 ¿Qué es EcoMetriX?',      icon: '🌿' },
  { id: 'como-funciona',label: '02 Cómo funciona',            icon: '⚙️' },
  { id: 'diagnostico',  label: '03 El diagnóstico paso a paso',icon: '📋' },
  { id: 'reporte',      label: '04 Tu reporte de resultados', icon: '📊' },
  { id: 'certificado',  label: '05 Certificado y credibilidad',icon: '🏅' },
  { id: 'estandares',   label: '06 Estándares aplicados',     icon: '📐' },
  { id: 'integraciones',label: '07 Integraciones ERP',        icon: '🔗' },
  { id: 'planes',       label: '08 Planes y precios',         icon: '💡' },
  { id: 'faq',          label: '09 Preguntas frecuentes',     icon: '❓' },
]

// ─── COMPONENTES UI ───────────────────────────────────────────────────────────
function StepCard({ n, title, desc, detail }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="group border border-[#E8F5F0] rounded-2xl bg-white hover:border-[#1D9E75] transition-all duration-200 overflow-hidden">
      <div className="flex items-start gap-4 p-5 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="w-10 h-10 rounded-xl bg-[#1D9E75] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">{n}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1C1917] text-sm mb-0.5">{title}</p>
          <p className="text-xs text-[#78716C]">{desc}</p>
        </div>
        <span className="text-[#78716C] text-xs flex-shrink-0 mt-1">{open ? '▲' : '▼'}</span>
      </div>
      {open && detail && (
        <div className="px-5 pb-5 pt-0 border-t border-[#F0FDF4]">
          <p className="text-sm text-[#57534E] leading-relaxed">{detail}</p>
        </div>
      )}
    </div>
  )
}

function StandardBadge({ name, desc, color }) {
  return (
    <div className={`rounded-2xl p-4 border-2 ${color}`}>
      <p className="font-bold text-sm mb-1">{name}</p>
      <p className="text-xs leading-relaxed opacity-80">{desc}</p>
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[#E8F5F0] rounded-2xl bg-white overflow-hidden">
      <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setOpen(!open)}>
        <span className="font-medium text-[#1C1917] text-sm pr-4">{q}</span>
        <span className="text-[#1D9E75] flex-shrink-0 font-bold">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[#F0FDF4]">
          <p className="text-sm text-[#57534E] leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ id, icon, n, title }) {
  return (
    <div id={id} className="flex items-center gap-3 mb-6 pt-2">
      <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-base flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-0">{n}</p>
        <h2 className="text-xl font-bold text-[#1C1917] leading-tight">{title}</h2>
      </div>
    </div>
  )
}

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────
async function generarManualPDF() {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 18
  let y = 0

  const verde = [29, 158, 117]
  const verdeClaro = [240, 253, 244]
  const gris = [87, 83, 78]
  const negro = [28, 25, 23]
  const grisClaro = [249, 250, 251]

  const addPage = () => { doc.addPage(); y = 24 }
  const checkPage = (needed = 20) => { if (y + needed > 275) addPage() }

  // ── PORTADA ────────────────────────────────────────────────────────────────
  doc.setFillColor(...verde)
  doc.rect(0, 0, W, 297, 'F')

  // Patrón de puntos
  doc.setFillColor(255, 255, 255)
  for (let px = 10; px < W; px += 20) {
    for (let py = 10; py < 297; py += 20) {
      doc.circle(px, py, 0.5, 'F')
    }
  }

  // Círculo decorativo
  doc.setFillColor(255, 255, 255)
  doc.setGState(new doc.GState({ opacity: 0.08 }))
  doc.circle(W - 30, 60, 80, 'F')
  doc.circle(30, 240, 60, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))

  // Logo texto
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('EcoMetriX', M, 28)

  // Titulo principal
  doc.setFontSize(38); doc.setFont('helvetica', 'bold')
  doc.text('Manual de', M, 100)
  doc.text('Usuario', M, 120)

  // Línea accent
  doc.setFillColor(255, 255, 255)
  doc.rect(M, 128, 40, 2, 'F')

  doc.setFontSize(13); doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('Guia completa para medir y gestionar', M, 142)
  doc.text('la huella de carbono de tu empresa', M, 152)

  // Versión y fecha
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(`Version 1.0  |  ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}`, M, 270)
  doc.text('ecometrix-app-one.vercel.app', M, 278)

  // ── ÍNDICE ─────────────────────────────────────────────────────────────────
  addPage()
  doc.setFillColor(...verdeClaro)
  doc.roundedRect(M, y - 4, W - M * 2, 12, 3, 3, 'F')
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Contenido', M + 3, y + 5)
  y += 16

  const indice = [
    ['01', 'Que es EcoMetriX', '3'],
    ['02', 'Como funciona', '4'],
    ['03', 'El diagnostico paso a paso', '5'],
    ['04', 'Tu reporte de resultados', '7'],
    ['05', 'Certificado y credibilidad', '9'],
    ['06', 'Estandares aplicados', '10'],
    ['07', 'Integraciones ERP', '12'],
    ['08', 'Planes y precios', '13'],
    ['09', 'Preguntas frecuentes', '14'],
  ]

  indice.forEach(([n, titulo, pg], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...grisClaro)
      doc.rect(M, y - 1, W - M * 2, 8, 'F')
    }
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
    doc.text(n, M + 2, y + 5)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris)
    doc.text(titulo, M + 12, y + 5)
    doc.setTextColor(...verde)
    doc.text(pg, W - M - 2, y + 5, { align: 'right' })
    y += 8
  })

  // ── SECCIÓN 1: QUÉ ES ─────────────────────────────────────────────────────
  addPage()
  doc.setFillColor(...verde)
  doc.rect(0, 0, 4, 297, 'F')

  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
  doc.text('01', M, y)
  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Que es EcoMetriX?', M, y + 9)
  y += 20

  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris)
  const intro = 'EcoMetriX es una plataforma SaaS de sostenibilidad empresarial que permite a cualquier empresa, independientemente de su tamano o sector, medir su huella de carbono en menos de 10 minutos, obtener un reporte detallado con recomendaciones de reduccion, y recibir una certificacion verificable basada en estandares internacionales reconocidos.'
  const introLines = doc.splitTextToSize(intro, W - M * 2)
  doc.text(introLines, M, y)
  y += introLines.length * 5 + 6

  // Beneficios destacados
  const beneficios = [
    ['10 minutos', 'Tiempo promedio para completar el diagnostico completo de los 3 alcances GHG'],
    ['100% online', 'Sin instalacion, sin software adicional. Solo tu navegador web'],
    ['Gratis para empezar', 'El plan Free incluye diagnosticos ilimitados con reporte completo'],
    ['Verificable', 'Cada certificado tiene un codigo unico verificable publicamente en /verificar'],
  ]

  beneficios.forEach(([titulo, desc], i) => {
    checkPage(18)
    doc.setFillColor(i % 2 === 0 ? ...verdeClaro : 255, 255, 255)
    if (i % 2 !== 0) doc.setFillColor(255, 255, 255)
    doc.roundedRect(M, y, W - M * 2, 14, 2, 2, 'F')
    doc.setFillColor(...verde)
    doc.circle(M + 5, y + 7, 2.5, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
    doc.text(titulo, M + 11, y + 5.5)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris); doc.setFontSize(8)
    const dlines = doc.splitTextToSize(desc, W - M * 2 - 15)
    doc.text(dlines[0], M + 11, y + 10)
    y += 16
  })

  y += 4
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Para quien es EcoMetriX?', M, y); y += 6
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris); doc.setFontSize(9)
  const paraQuien = 'EcoMetriX esta disenado para empresas colombianas y latinoamericanas de todos los sectores: comercio, manufactura, servicios, tecnologia, alimentos, construccion y mas. Es especialmente util para PyMEs que quieren prepararse para requerimientos de sostenibilidad de clientes corporativos, acceder a licitaciones que exigen medicion de huella de carbono, o simplemente entender y reducir su impacto ambiental.'
  const pqLines = doc.splitTextToSize(paraQuien, W - M * 2)
  doc.text(pqLines, M, y)
  y += pqLines.length * 5 + 8

  // ── SECCIÓN 2: CÓMO FUNCIONA ───────────────────────────────────────────────
  checkPage(30)
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
  doc.text('02', M, y)
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Como funciona', M, y + 9)
  y += 20

  const pasos = [
    ['Paso 1', 'Cuestionario inteligente', 'Respondes preguntas sobre tu empresa: sector, tamano, consumo energetico, combustibles, flota vehicular, compras y logistica. El sistema adapta las preguntas segun tu sector para mayor precision.'],
    ['Paso 2', 'Calculo automatico', 'EcoMetriX aplica factores de emision del IPCC AR6 y calcula tus emisiones en los 3 alcances del GHG Protocol: emisiones directas (Alcance 1), electricidad (Alcance 2) y cadena de valor (Alcance 3).'],
    ['Paso 3', 'Analisis con IA', 'La plataforma genera un resumen ejecutivo, benchmark sectorial, plan de reduccion priorizado y recomendaciones especificas para tu tipo de empresa usando inteligencia artificial.'],
    ['Paso 4', 'Reporte y certificado', 'Recibes un reporte completo en tu correo y en la plataforma, junto con tu certificado EcoMetriX con codigo de verificacion unico. El reporte incluye comparacion con estandares CSRD/ESRS.'],
  ]

  pasos.forEach((paso, i) => {
    checkPage(25)
    doc.setFillColor(...verdeClaro)
    doc.roundedRect(M, y, W - M * 2, 22, 3, 3, 'F')
    doc.setFillColor(...verde)
    doc.roundedRect(M, y, 18, 22, 3, 3, 'F')
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
    doc.text(`${i + 1}`, M + 9, y + 13, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
    doc.text(paso[1], M + 22, y + 7)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris); doc.setFontSize(8)
    const lines = doc.splitTextToSize(paso[2], W - M * 2 - 24)
    doc.text(lines[0], M + 22, y + 13)
    if (lines[1]) doc.text(lines[1], M + 22, y + 18)
    y += 26
  })

  // ── SECCIÓN 3: DIAGNÓSTICO PASO A PASO ─────────────────────────────────────
  if (y > 220) addPage()
  y += 4
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
  doc.text('03', M, y)
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('El diagnostico paso a paso', M, y + 9)
  y += 20

  const etapas = [
    {
      titulo: 'Paso 1 de 5 — Tu empresa',
      items: [
        'Nombre de la empresa y correo corporativo (recibiras tu reporte aqui)',
        'NIT o RUT (opcional)',
        'Sector economico (ej: Tecnologia, Alimentos, Manufactura)',
        'Tamano: micro (<10), pequena (10-50), mediana (50-250), grande (>250 empleados)',
        'Pais de operacion',
      ]
    },
    {
      titulo: 'Paso 2 de 5 — Alcance 1 (Emisiones directas)',
      items: [
        'Uso de gas natural o GLP (m3 o galones por mes)',
        'Flota de vehiculos propios (tipo de combustible, consumo mensual)',
        'Uso de refrigerantes en equipos de climatizacion',
        'Generadores electricos (combustible y horas de uso)',
        'Procesos industriales con emision directa de gases',
      ]
    },
    {
      titulo: 'Paso 3 de 5 — Alcance 2 (Energia indirecta)',
      items: [
        'Consumo mensual de electricidad de la red (kWh)',
        'Si tienes paneles solares: energia generada',
        'Otras fuentes de energia comprada (vapor, calor)',
      ]
    },
    {
      titulo: 'Paso 4 de 5 — Alcance 3 (Cadena de valor)',
      items: [
        'Compras a proveedores (categorias principales)',
        'Logistica y transporte de mercancias',
        'Viajes de negocio (vuelos, hoteles)',
        'Desplazamiento de empleados al trabajo',
        'Gestion de residuos generados',
        'Uso del producto por parte de clientes (si aplica)',
      ]
    },
    {
      titulo: 'Paso 5 de 5 — Resumen y envio',
      items: [
        'Revision de los datos ingresados',
        'Confirmacion del correo para recibir el reporte',
        'El sistema calcula automaticamente en segundos',
        'Redireccion al reporte completo con resultados',
      ]
    },
  ]

  etapas.forEach(etapa => {
    checkPage(40)
    doc.setFillColor(...grisClaro)
    doc.roundedRect(M, y, W - M * 2, 8, 2, 2, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
    doc.text(etapa.titulo, M + 3, y + 5.5)
    y += 11
    etapa.items.forEach(item => {
      checkPage(8)
      doc.setFillColor(...verde)
      doc.circle(M + 3, y + 3, 1, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris)
      const lines = doc.splitTextToSize(item, W - M * 2 - 10)
      doc.text(lines, M + 8, y + 3.5)
      y += lines.length * 4.5 + 1
    })
    y += 5
  })

  // ── SECCIÓN 4: REPORTE ─────────────────────────────────────────────────────
  addPage()
  doc.setFillColor(...verde)
  doc.rect(0, 0, 4, 297, 'F')
  y = 24

  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
  doc.text('04', M, y)
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Tu reporte de resultados', M, y + 9)
  y += 20

  const modulosReporte = [
    ['Resumen ejecutivo', 'Texto generado por IA con la situacion de tu empresa, nivel de impacto y comparacion con el promedio del sector. Incluye benchmark sectorial para Colombia.'],
    ['Metricas principales', 'Huella total en toneladas CO2e/ano, desglose por los 3 alcances en kg CO2e/mes, valor economico equivalente al mercado de carbono europeo (EU ETS) en COP.'],
    ['Distribucion por alcance', 'Grafica de barras que muestra el porcentaje de emisiones de cada alcance. Te permite identificar donde concentrar los esfuerzos de reduccion.'],
    ['Fuentes de emision', 'Tabla detallada con cada categoria de emision, su peso en el total y el factor de emision aplicado (trazable al IPCC AR6).'],
    ['Plan de reduccion', '5 acciones priorizadas por impacto potencial y facilidad de implementacion. Cada accion incluye: reduccion estimada (%), dificultad y plazo sugerido.'],
    ['Metodologia aplicada', 'Badges que muestran la cobertura de cada estandar: GHG Protocol, ISO 14064-1, IPCC AR6, CSRD/ESRS E1, SBTi Baseline y GRI 305.'],
    ['Certificacion EcoMetriX', 'Score de sostenibilidad (0-100), nivel obtenido, codigo de verificacion unico y badges de logros desbloqueados.'],
  ]

  modulosReporte.forEach((modulo, i) => {
    checkPage(18)
    if (i % 2 === 0) {
      doc.setFillColor(...verdeClaro)
    } else {
      doc.setFillColor(255, 255, 255)
    }
    doc.roundedRect(M, y, W - M * 2, 16, 2, 2, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
    doc.text(modulo[0], M + 4, y + 6)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris); doc.setFontSize(8)
    const lines = doc.splitTextToSize(modulo[1], W - M * 2 - 8)
    doc.text(lines[0], M + 4, y + 12)
    y += 18
  })

  y += 4
  doc.setFillColor(...verde)
  doc.roundedRect(M, y, W - M * 2, 16, 3, 3, 'F')
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text('Tip: El reporte tiene una URL unica y permanente', M + 4, y + 6)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text('Puedes compartirla con socios, clientes o inversionistas. Funciona incluso en modo incognito.', M + 4, y + 12)
  y += 22

  // ── SECCIÓN 5: CERTIFICADO ─────────────────────────────────────────────────
  checkPage(40)
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
  doc.text('05', M, y)
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Certificado y credibilidad', M, y + 9)
  y += 20

  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris)
  const certText = 'Al completar el diagnostico, EcoMetriX genera automaticamente un Certificado de Diagnostico de Huella de Carbono. Este certificado no es decorativo: tiene una puntuacion calculada matematicamente, un nivel asignado segun criterios objetivos, un codigo de verificacion unico y un diploma descargable en PDF.'
  const certLines = doc.splitTextToSize(certText, W - M * 2)
  doc.text(certLines, M, y)
  y += certLines.length * 5 + 8

  // Niveles
  const niveles = [
    ['Iniciado Verde', '0-39 pts', 'Primer diagnostico completado. Punto de partida para el camino sostenible.', '#6B7280'],
    ['Comprometido', '40-64 pts', 'Los 3 alcances medidos y plan de accion generado.', '#10B981'],
    ['Avanzado', '65-84 pts', 'Medicion completa con nivel de impacto moderado o bajo.', '#059669'],
    ['Lider Sostenible', '85-100 pts', 'Maxima cobertura de alcances, plan solido y puntaje excelente.', '#D97706'],
  ]

  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Los 4 niveles de certificacion:', M, y); y += 7

  niveles.forEach(([nivel, pts, desc, color]) => {
    checkPage(14)
    const rgb = hexToRgb(color)
    doc.setFillColor(...rgb, 0.1)
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.setGState(new doc.GState({ opacity: 0.12 }))
    doc.roundedRect(M, y, W - M * 2, 12, 2, 2, 'F')
    doc.setGState(new doc.GState({ opacity: 1 }))
    doc.setFillColor(...rgb)
    doc.circle(M + 5, y + 6, 3, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
    doc.text(nivel, M + 11, y + 5)
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...rgb)
    doc.text(pts, M + 11, y + 10)
    doc.setTextColor(...gris)
    const dlines = doc.splitTextToSize(desc, W - M * 2 - 40)
    doc.text(dlines[0], W - M - 2, y + 7, { align: 'right' })
    y += 14
  })

  y += 4
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Como se verifica el certificado?', M, y); y += 6
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris); doc.setFontSize(8)
  const verText = 'Cualquier persona puede verificar un certificado EcoMetriX en: ecometrix-app-one.vercel.app/verificar/[CODIGO]. El sistema consulta la base de datos en tiempo real y muestra el nivel, score, empresa y fecha de emision.'
  const verLines = doc.splitTextToSize(verText, W - M * 2)
  doc.text(verLines, M, y)
  y += verLines.length * 4.5 + 6

  // ── SECCIÓN 6: ESTÁNDARES ──────────────────────────────────────────────────
  addPage()
  doc.setFillColor(...verde)
  doc.rect(0, 0, 4, 297, 'F')
  y = 24

  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
  doc.text('06', M, y)
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Estandares aplicados', M, y + 9)
  y += 20

  const estandares = [
    {
      nombre: 'GHG Protocol Corporate Standard',
      org: 'WRI / WBCSD',
      descripcion: 'Es el estandar global mas usado para medir emisiones de gases de efecto invernadero en organizaciones. Desarrollado por el World Resources Institute y el World Business Council for Sustainable Development. EcoMetriX lo usa como base metodologica para todos los calculos.',
      uso: 'Base de todos los calculos. Define los 3 alcances de emision.',
    },
    {
      nombre: 'ISO 14064-1:2018',
      org: 'Organizacion Internacional de Normalizacion',
      descripcion: 'Norma internacional certificable para la cuantificacion y reporte de emisiones GHG a nivel organizacional. Los reportes de EcoMetriX siguen una metodologia compatible con esta norma, lo que facilita la transicion a una certificacion formal.',
      uso: 'Metodologia de inventario compatible. Facilita certificacion futura.',
    },
    {
      nombre: 'IPCC AR6 (2021)',
      org: 'Panel Intergubernamental sobre Cambio Climatico',
      descripcion: 'El Sexto Informe de Evaluacion del IPCC incluye los factores de emision mas actualizados para cada tipo de actividad. EcoMetriX usa estos factores para convertir consumos (kWh, litros, m3) en kilogramos de CO2 equivalente.',
      uso: 'Factores de emision actualizados para cada tipo de actividad.',
    },
    {
      nombre: 'CSRD / ESRS E1',
      org: 'Union Europea - Directiva 2022/2464',
      descripcion: 'La Corporate Sustainability Reporting Directive obliga a empresas europeas y sus proveedores a reportar sostenibilidad. EcoMetriX incluye un modulo especifico de gap analysis CSRD que evalua el cumplimiento de los requerimientos ESRS.',
      uso: 'Modulo CSRD para preparacion y analisis de brechas.',
    },
    {
      nombre: 'Science Based Targets (SBTi)',
      org: 'Science Based Targets initiative',
      descripcion: 'Iniciativa que valida objetivos de reduccion de emisiones alineados con el limite de 1.5 grados del Acuerdo de Paris. El diagnostico de EcoMetriX genera el baseline necesario para que una empresa aplique a SBTi.',
      uso: 'El diagnostico genera el baseline requerido para aplicar a SBTi.',
    },
  ]

  estandares.forEach(std => {
    checkPage(35)
    doc.setFillColor(...grisClaro)
    doc.roundedRect(M, y, W - M * 2, 9, 2, 2, 'F')
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
    doc.text(std.nombre, M + 3, y + 6)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris)
    doc.text(std.org, W - M - 2, y + 6, { align: 'right' })
    y += 12

    const descLines = doc.splitTextToSize(std.descripcion, W - M * 2)
    doc.setTextColor(...gris); doc.setFontSize(8)
    doc.text(descLines, M, y)
    y += descLines.length * 4.5

    doc.setFillColor(...verdeClaro)
    doc.roundedRect(M, y + 2, W - M * 2, 7, 2, 2, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
    doc.text('Como lo usa EcoMetriX: ', M + 3, y + 6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(std.uso, M + 42, y + 6.5)
    y += 14
  })

  // ── SECCIÓN 7: INTEGRACIONES ───────────────────────────────────────────────
  addPage()
  doc.setFillColor(...verde)
  doc.rect(0, 0, 4, 297, 'F')
  y = 24

  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
  doc.text('07', M, y)
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Integraciones ERP', M, y + 9)
  y += 20

  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris)
  const intText = 'EcoMetriX se conecta con los principales sistemas contables del mercado colombiano para importar automaticamente tus facturas y gastos, eliminando la necesidad de ingresar datos manualmente.'
  const intLines = doc.splitTextToSize(intText, W - M * 2)
  doc.text(intLines, M, y)
  y += intLines.length * 5 + 8

  const integraciones = [
    ['Siigo', 'API directa', 'Conexion mediante API key. Importa facturas de compra, gastos por categoria y servicios publicos de los ultimos 90 dias automaticamente.'],
    ['Alegra', 'API directa', 'Conexion mediante email y token. Importa gastos, compras a proveedores y facturas de servicios clasificados por categoria.'],
    ['SIESA Enterprise', 'CSV / Excel', 'Exporta el reporte de compras desde SIESA 8.5 o Enterprise en Excel y cargalo en EcoMetriX. Compatible con el formato estandar de exportacion de SIESA.'],
    ['CSV / Excel generico', 'Archivo', 'Importa datos desde cualquier ERP o sistema contable. Descarga la plantilla, completa las columnas requeridas y sube el archivo. EcoMetriX mapea cada gasto a su categoria GHG correspondiente.'],
  ]

  integraciones.forEach(([nombre, tipo, desc]) => {
    checkPage(20)
    doc.setFillColor(...verdeClaro)
    doc.roundedRect(M, y, W - M * 2, 17, 2, 2, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
    doc.text(nombre, M + 4, y + 6)
    doc.setFillColor(...verde)
    doc.roundedRect(W - M - 20, y + 2, 18, 5, 2, 2, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
    doc.text(tipo, W - M - 11, y + 5.5, { align: 'center' })
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris)
    const dlines = doc.splitTextToSize(desc, W - M * 2 - 8)
    doc.text(dlines[0], M + 4, y + 12)
    y += 20
  })

  // ── SECCIÓN 8: PLANES ──────────────────────────────────────────────────────
  checkPage(60)
  y += 4
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
  doc.text('08', M, y)
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Planes y precios', M, y + 9)
  y += 20

  const planes = [
    {
      nombre: 'Free', precio: '$0', periodo: 'Siempre gratis',
      features: ['Diagnosticos ilimitados', 'Reporte completo con 3 alcances', 'Certificado con codigo verificable', 'Email con reporte y PDF', 'Modulo CSRD basico'],
      color: gris,
    },
    {
      nombre: 'Pro', precio: '$149.000 COP', periodo: 'por mes',
      features: ['Todo lo del plan Free', 'Historial de diagnosticos', 'Comparacion entre periodos', 'Integraciones ERP (Siigo, Alegra)', 'Exportacion PDF avanzada', 'Soporte prioritario'],
      color: verde,
    },
    {
      nombre: 'Enterprise', precio: 'Precio personalizado', periodo: '',
      features: ['Todo lo del plan Pro', 'Multiples empresas / sucursales', 'API para integracion custom', 'Reporte CSRD completo para auditores', 'Verificacion externa ISO 14064-3', 'Onboarding dedicado'],
      color: [180, 83, 9],
    },
  ]

  planes.forEach((plan) => {
    checkPage(50)
    doc.setFillColor(...plan.color)
    doc.setGState(new doc.GState({ opacity: 0.08 }))
    doc.roundedRect(M, y, W - M * 2, 8, 2, 2, 'F')
    doc.setGState(new doc.GState({ opacity: 1 }))
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...plan.color)
    doc.text(plan.nombre, M + 3, y + 5.5)
    doc.setFontSize(9); doc.setTextColor(...negro)
    doc.text(plan.precio, W - M - 2, y + 5.5, { align: 'right' })
    y += 11
    plan.features.forEach(f => {
      checkPage(7)
      doc.setFillColor(...plan.color)
      doc.circle(M + 3, y + 3, 1, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris)
      doc.text(f, M + 8, y + 3.5)
      y += 5.5
    })
    y += 6
  })

  // ── SECCIÓN 9: FAQ ─────────────────────────────────────────────────────────
  addPage()
  doc.setFillColor(...verde)
  doc.rect(0, 0, 4, 297, 'F')
  y = 24

  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
  doc.text('09', M, y)
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
  doc.text('Preguntas frecuentes', M, y + 9)
  y += 20

  const faqs = [
    ['Los resultados son exactos?', 'EcoMetriX genera estimaciones de alta calidad basadas en los datos que proporciones y factores de emision del IPCC AR6. Para una medicion certificable formalmente se requiere una auditoria con verificador acreditado ISO 14064-3. EcoMetriX puede conectarte con verificadores.'],
    ['Mis datos son confidenciales?', 'Si. Los datos de diagnostico se almacenan en una base de datos segura en Supabase (infraestructura cifrada). No compartimos datos con terceros. El certificado publico solo muestra el nombre de empresa, score y nivel, nunca los datos de consumo.'],
    ['Puedo hacer varios diagnosticos?', 'Si, todos los planes incluyendo Free permiten diagnosticos ilimitados. Cada diagnostico genera un reporte y certificado independiente con su propia URL y codigo de verificacion.'],
    ['El certificado tiene validez legal?', 'El certificado EcoMetriX es un documento de autoevaluacion verificable digitalmente, no una certificacion ISO formal. Sin embargo, es un documento de respaldo valido para licitaciones, reportes de sostenibilidad internos y preparacion para auditorias externas.'],
    ['Funciona para empresas fuera de Colombia?', 'Si. EcoMetriX esta disponible en espanol, ingles, portugues y frances. Los factores de emision del IPCC AR6 son de aplicacion global. Para el modulo de electricidad, se usa el factor de emision de la red electrica colombiana por defecto, pero se puede ajustar.'],
    ['Como comparto mi reporte con clientes o socios?', 'El reporte tiene una URL unica del tipo ecometrix-app-one.vercel.app/reporte/ecm_XXXX que cualquier persona puede abrir sin crear cuenta. Tambien puedes descargar el certificado PDF y el reporte en PDF para adjuntar en correos o propuestas.'],
  ]

  faqs.forEach((faq, i) => {
    checkPage(25)
    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255)
    doc.roundedRect(M, y, W - M * 2, 8, 2, 2, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...negro)
    doc.text(faq[0], M + 3, y + 5.5)
    y += 10
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris)
    const alines = doc.splitTextToSize(faq[1], W - M * 2)
    doc.text(alines, M + 3, y)
    y += alines.length * 4.5 + 6
  })

  // ── PÁGINA FINAL ───────────────────────────────────────────────────────────
  addPage()
  doc.setFillColor(...verde)
  doc.rect(0, 0, W, 297, 'F')

  for (let px = 10; px < W; px += 20) {
    for (let py = 10; py < 297; py += 20) {
      doc.setFillColor(255, 255, 255)
      doc.setGState(new doc.GState({ opacity: 0.04 }))
      doc.circle(px, py, 0.5, 'F')
    }
  }
  doc.setGState(new doc.GState({ opacity: 1 }))

  doc.setFontSize(28); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text('Listo para medir', M, 100)
  doc.text('tu impacto?', M, 118)

  doc.setFillColor(255, 255, 255)
  doc.rect(M, 126, 30, 2, 'F')

  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255)
  doc.text('Inicia tu diagnostico gratuito en:', M, 140)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
  doc.text('ecometrix-app-one.vercel.app/diagnostico', M, 152)

  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('Consultas: oscar@ecometrix.co', M, 200)
  doc.text('Manual de Usuario v1.0  |  EcoMetriX  |  2026', M, 210)

  // ── FOOTERS ────────────────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 2; i <= totalPages - 1; i++) {
    doc.setPage(i)
    doc.setFillColor(...verde)
    doc.rect(0, 290, W, 7, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255)
    doc.text('EcoMetriX — Manual de Usuario v1.0', M, 295)
    doc.text(`${i} / ${totalPages - 1}`, W - M, 295, { align: 'right' })
  }

  doc.save('EcoMetriX_Manual_de_Usuario_v1.0.pdf')
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Manual() {
  const [activeSection, setActiveSection] = useState('que-es')
  const [pdfLoading, setPdfLoading] = useState(false)
  const contentRef = useRef(null)

  async function handleDownloadPDF() {
    setPdfLoading(true)
    try {
      await generarManualPDF()
    } catch (err) {
      console.error(err)
      alert('Error generando el PDF. Intenta de nuevo.')
    } finally {
      setPdfLoading(false)
    }
  }

  function scrollTo(id) {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]" style={{ fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="bg-white border-b border-[#E8F5F0] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1D9E75] flex items-center justify-center"><IconLeaf /></div>
            <span className="text-[#1D9E75] font-semibold text-sm">EcoMetriX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/diagnostico" className="hidden sm:block text-sm text-[#57534E] hover:text-[#1D9E75] transition-colors">Hacer diagnóstico →</Link>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold hover:bg-[#16875f] transition-all disabled:opacity-60"
            >
              {pdfLoading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generando...</span></>
              ) : (
                <><span>↓</span><span>Descargar PDF</span></>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">

        {/* Sidebar navegación */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-bold uppercase tracking-widest text-[#78716C] mb-4">Contenido</p>
            <nav className="space-y-1">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activeSection === s.id
                      ? 'bg-[#F0FDF4] text-[#1D9E75] font-semibold border border-[#BBF7D0]'
                      : 'text-[#78716C] hover:bg-[#F0FDF4] hover:text-[#1D9E75]'
                  }`}
                >
                  <span className="flex-shrink-0">{s.icon}</span>
                  <span className="text-xs leading-tight">{s.label}</span>
                </button>
              ))}
            </nav>

            {/* CTA sidebar */}
            <div className="mt-8 p-4 rounded-2xl bg-[#1D9E75] text-white">
              <p className="text-sm font-bold mb-1">¿Listo para empezar?</p>
              <p className="text-xs text-white/80 mb-3">Diagnóstico gratuito en 10 minutos</p>
              <Link to="/diagnostico" className="block text-center bg-white text-[#1D9E75] text-xs font-bold py-2 rounded-lg hover:bg-[#F0FDF4] transition-colors">
                Iniciar diagnóstico →
              </Link>
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <main ref={contentRef} className="flex-1 min-w-0 space-y-16">

          {/* Hero */}
          <div className="rounded-3xl bg-[#1D9E75] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="relative">
              <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">Manual de Usuario v1.0</span>
              <h1 className="text-3xl font-bold mb-3">Todo lo que necesitas saber sobre EcoMetriX</h1>
              <p className="text-white/80 text-sm max-w-lg leading-relaxed">
                Aprende a medir la huella de carbono de tu empresa, entiende tu certificado y descubre cómo EcoMetriX usa estándares internacionales reconocidos.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                {['GHG Protocol', 'ISO 14064', 'IPCC AR6', 'CSRD/ESRS'].map(s => (
                  <span key={s} className="bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 01 — Qué es */}
          <section>
            <SectionTitle id="que-es" icon="🌿" n="01" title="¿Qué es EcoMetriX?" />
            <p className="text-[#57534E] leading-relaxed mb-6 text-sm">
              EcoMetriX es una plataforma SaaS de sostenibilidad empresarial que permite a cualquier empresa medir su huella de carbono en menos de 10 minutos, obtener un reporte detallado con recomendaciones de reducción, y recibir una certificación verificable basada en estándares internacionales.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { n: '10 min', d: 'Tiempo promedio del diagnóstico completo' },
                { n: '3', d: 'Alcances GHG Protocol medidos' },
                { n: '100%', d: 'Online, sin instalaciones' },
                { n: 'Gratis', d: 'Para empezar, sin tarjeta' },
              ].map(({ n, d }) => (
                <div key={n} className="bg-white rounded-2xl border border-[#E8F5F0] p-4 text-center">
                  <p className="text-2xl font-bold text-[#1D9E75] mb-1">{n}</p>
                  <p className="text-xs text-[#78716C] leading-tight">{d}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-5">
              <p className="text-sm font-semibold text-[#1D9E75] mb-2">¿Para quién es EcoMetriX?</p>
              <p className="text-sm text-[#57534E] leading-relaxed">
                Empresas colombianas y latinoamericanas de todos los sectores — comercio, manufactura, servicios, tecnología, alimentos, construcción. Especialmente útil para PyMEs que quieren prepararse para requerimientos de sostenibilidad de clientes corporativos, acceder a licitaciones, o simplemente entender y reducir su impacto ambiental.
              </p>
            </div>
          </section>

          {/* 02 — Cómo funciona */}
          <section>
            <SectionTitle id="como-funciona" icon="⚙️" n="02" title="Cómo funciona" />
            <div className="space-y-3">
              <StepCard n="1" title="Cuestionario inteligente" desc="Respondes preguntas adaptadas a tu sector sobre consumos energéticos, combustibles, flota y logística."
                detail="El cuestionario se adapta según el sector de tu empresa para hacer preguntas relevantes. Una empresa de tecnología no necesita responder sobre maquinaria industrial; una empresa de logística tiene preguntas específicas sobre flota vehicular. Esto asegura precisión y evita respuestas irrelevantes." />
              <StepCard n="2" title="Cálculo automático con factores IPCC AR6" desc="EcoMetriX aplica los factores de emisión más actualizados para convertir consumos en kg CO₂e."
                detail="Los factores de emisión del IPCC Sixth Assessment Report (2021) son el referente científico más actualizado para cuantificar el impacto climático de cada actividad. Por ejemplo: 1 kWh de electricidad en Colombia = 0.126 kg CO₂e según el factor de la red eléctrica nacional (UPME 2023)." />
              <StepCard n="3" title="Análisis con inteligencia artificial" desc="La plataforma genera resumen ejecutivo, benchmark sectorial y plan de reducción personalizado."
                detail="La IA analiza tus resultados en contexto con benchmarks sectoriales y genera recomendaciones priorizadas por impacto y facilidad. El plan de reducción incluye 5 acciones concretas con estimación del porcentaje de reducción potencial, dificultad de implementación y plazo sugerido." />
              <StepCard n="4" title="Reporte y certificado" desc="Recibes reporte completo por email y en la plataforma, más tu certificado PDF descargable."
                detail="El reporte queda almacenado en una URL permanente que puedes compartir con socios, clientes o inversionistas. El certificado PDF tiene diseño tipo diploma con tu nombre de empresa, nivel obtenido, score, código de verificación y fecha de emisión." />
            </div>
          </section>

          {/* 03 — Diagnóstico */}
          <section>
            <SectionTitle id="diagnostico" icon="📋" n="03" title="El diagnóstico paso a paso" />
            <p className="text-sm text-[#78716C] mb-5">El cuestionario tiene 5 etapas. Puedes navegar entre ellas — tus respuestas se guardan automáticamente.</p>
            {[
              { paso: 'Paso 1 de 5', titulo: 'Tu empresa', color: 'bg-[#F0FDF4] border-[#BBF7D0]',
                items: ['Nombre de la empresa y correo corporativo (recibirás el reporte aquí)', 'NIT / RUT (opcional)', 'Sector económico', 'Tamaño de la empresa', 'País de operación'] },
              { paso: 'Paso 2 de 5', titulo: 'Alcance 1 — Emisiones directas', color: 'bg-blue-50 border-blue-200',
                items: ['Gas natural o GLP (m³ o galones/mes)', 'Flota de vehículos propios (combustible y consumo)', 'Refrigerantes en equipos de climatización', 'Generadores eléctricos', 'Procesos industriales con emisión directa'] },
              { paso: 'Paso 3 de 5', titulo: 'Alcance 2 — Energía indirecta', color: 'bg-purple-50 border-purple-200',
                items: ['Consumo mensual de electricidad de la red (kWh)', 'Energía solar generada (si aplica)', 'Otras fuentes de energía comprada'] },
              { paso: 'Paso 4 de 5', titulo: 'Alcance 3 — Cadena de valor', color: 'bg-amber-50 border-amber-200',
                items: ['Compras a proveedores (categorías principales)', 'Logística y transporte de mercancías', 'Viajes de negocio', 'Desplazamiento de empleados', 'Gestión de residuos'] },
              { paso: 'Paso 5 de 5', titulo: 'Resumen y envío', color: 'bg-[#F0FDF4] border-[#BBF7D0]',
                items: ['Revisión de los datos ingresados', 'Confirmación del correo', 'Cálculo automático en segundos', 'Redirección al reporte completo'] },
            ].map(({ paso, titulo, color, items }) => (
              <div key={paso} className={`rounded-2xl border-2 ${color} p-5 mb-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-[#78716C] uppercase tracking-widest">{paso}</span>
                  <span className="text-sm font-bold text-[#1C1917]">{titulo}</span>
                </div>
                <ul className="space-y-1.5">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[#57534E]">
                      <span className="text-[#1D9E75] flex-shrink-0 mt-0.5">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* 04 — Reporte */}
          <section>
            <SectionTitle id="reporte" icon="📊" n="04" title="Tu reporte de resultados" />
            <p className="text-sm text-[#78716C] mb-5">El reporte incluye 7 módulos. Aquí explicamos qué significa cada uno:</p>
            <div className="space-y-3">
              {[
                { t: 'Resumen ejecutivo', d: 'Texto generado por IA con la situación de tu empresa, nivel de impacto (Bajo / Moderado / Alto) y comparación con el promedio del sector en Colombia.' },
                { t: 'Métricas principales', d: 'Huella total en toneladas CO₂e/año, desglose por los 3 alcances en kg CO₂e/mes, y valor económico equivalente al mercado de carbono europeo (EU ETS) en COP.' },
                { t: 'Distribución por alcance', d: 'Gráfica que muestra qué porcentaje de tus emisiones viene de cada alcance. Te ayuda a priorizar dónde actuar primero.' },
                { t: 'Fuentes de emisión', d: 'Tabla detallada con cada categoría de emisión, su peso en el total y el factor de emisión aplicado (trazable al IPCC AR6).' },
                { t: 'Plan de reducción', d: '5 acciones priorizadas por impacto potencial y facilidad. Cada acción incluye: % de reducción estimado, dificultad (Fácil/Media/Difícil) y plazo.' },
                { t: 'Metodología aplicada', d: 'Badges que muestran la cobertura de cada estándar: GHG Protocol, ISO 14064-1, IPCC AR6, CSRD/ESRS E1, SBTi Baseline y GRI 305.' },
                { t: 'Certificación EcoMetriX', d: 'Score de sostenibilidad (0-100), nivel obtenido, código de verificación único y badges de logros desbloqueados.' },
              ].map(({ t, d }, i) => (
                <div key={t} className="flex gap-4 p-4 rounded-2xl bg-white border border-[#E8F5F0]">
                  <div className="w-7 h-7 rounded-lg bg-[#1D9E75] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{i + 1}</div>
                  <div>
                    <p className="font-semibold text-[#1C1917] text-sm mb-1">{t}</p>
                    <p className="text-xs text-[#78716C] leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-[#1D9E75] rounded-2xl p-4 text-white">
              <p className="text-sm font-bold mb-1">💡 URL permanente y compartible</p>
              <p className="text-xs text-white/80">El reporte tiene una URL única que funciona sin cuenta. Puedes compartirla con socios, clientes o inversionistas — incluso en modo incógnito.</p>
            </div>
          </section>

          {/* 05 — Certificado */}
          <section>
            <SectionTitle id="certificado" icon="🏅" n="05" title="Certificado y credibilidad" />
            <p className="text-sm text-[#57534E] leading-relaxed mb-6">
              Al completar el diagnóstico, EcoMetriX genera automáticamente un <strong>Certificado de Diagnóstico de Huella de Carbono</strong>. Este certificado no es decorativo: tiene una puntuación calculada matemáticamente, un nivel asignado según criterios objetivos, un código de verificación único y un diploma descargable en PDF.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { nivel: 'Iniciado Verde', pts: '0–39 pts', icon: '🌿', color: 'border-gray-200 bg-gray-50', tc: 'text-gray-600' },
                { nivel: 'Comprometido', pts: '40–64 pts', icon: '♻️', color: 'border-emerald-200 bg-emerald-50', tc: 'text-emerald-700' },
                { nivel: 'Avanzado', pts: '65–84 pts', icon: '🌱', color: 'border-green-200 bg-green-50', tc: 'text-green-700' },
                { nivel: 'Líder Sostenible', pts: '85–100 pts', icon: '🏆', color: 'border-amber-200 bg-amber-50', tc: 'text-amber-700' },
              ].map(({ nivel, pts, icon, color, tc }) => (
                <div key={nivel} className={`rounded-2xl border-2 ${color} p-4 text-center`}>
                  <span className="text-2xl block mb-2">{icon}</span>
                  <p className={`text-sm font-bold ${tc} mb-1`}>{nivel}</p>
                  <p className="text-xs text-[#78716C]">{pts}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-5">
              <p className="text-sm font-bold text-[#1D9E75] mb-2">¿Cómo se verifica el certificado?</p>
              <p className="text-sm text-[#57534E] leading-relaxed">
                Cualquier persona puede verificar un certificado en <strong>ecometrix-app-one.vercel.app/verificar/[CODIGO]</strong>. El sistema consulta la base de datos en tiempo real y muestra el nivel, score, empresa y fecha de emisión — sin necesidad de crear una cuenta.
              </p>
            </div>
          </section>

          {/* 06 — Estándares */}
          <section>
            <SectionTitle id="estandares" icon="📐" n="06" title="Estándares aplicados" />
            <p className="text-sm text-[#57534E] mb-6 leading-relaxed">
              La credibilidad de EcoMetriX se basa en los estándares internacionales que utiliza. No inventamos metodologías propias — aplicamos los marcos científicos y regulatorios más reconocidos globalmente.
            </p>
            <div className="space-y-4">
              <StandardBadge
                name="🌍 GHG Protocol Corporate Standard"
                desc="El estándar global más usado para medir emisiones GHG en organizaciones. Desarrollado por WRI y WBCSD. Es la base de prácticamente todos los demás marcos de reporte. EcoMetriX lo usa como metodología central para definir los 3 alcances de emisión."
                color="border-[#1D9E75] bg-[#F0FDF4] text-[#1D9E75]"
              />
              <StandardBadge
                name="📋 ISO 14064-1:2018"
                desc="Norma internacional certificable para cuantificación y reporte de inventarios GHG. Los reportes de EcoMetriX siguen una metodología compatible, lo que facilita la transición a una certificación formal con un verificador acreditado ISO 14064-3."
                color="border-blue-300 bg-blue-50 text-blue-700"
              />
              <StandardBadge
                name="📊 IPCC AR6 — Sexto Informe de Evaluación (2021)"
                desc="Los factores de emisión del Panel Intergubernamental sobre Cambio Climático AR6 son el referente científico más actualizado. EcoMetriX los usa para convertir consumos (kWh, litros, m³) en kg CO₂ equivalente con la mayor precisión disponible."
                color="border-purple-300 bg-purple-50 text-purple-700"
              />
              <StandardBadge
                name="🇪🇺 CSRD / ESRS E1 — Directiva UE 2022/2464"
                desc="La Corporate Sustainability Reporting Directive obliga a empresas europeas y sus proveedores a reportar sostenibilidad. EcoMetriX incluye un módulo de gap analysis CSRD con roadmap de cumplimiento para empresas que exportan a Europa o trabajan con clientes europeos."
                color="border-amber-300 bg-amber-50 text-amber-700"
              />
              <StandardBadge
                name="🎯 Science Based Targets (SBTi)"
                desc="Iniciativa que valida objetivos de reducción alineados con el límite de 1.5°C del Acuerdo de París. El diagnóstico de EcoMetriX genera el baseline de emisiones necesario para que una empresa aplique formalmente a SBTi."
                color="border-green-300 bg-green-50 text-green-700"
              />
            </div>
          </section>

          {/* 07 — Integraciones */}
          <section>
            <SectionTitle id="integraciones" icon="🔗" n="07" title="Integraciones ERP" />
            <p className="text-sm text-[#57534E] mb-5 leading-relaxed">
              Conecta tu sistema contable para importar automáticamente facturas y gastos, eliminando el ingreso manual de datos.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { nombre: 'Siigo', tipo: 'API directa', desc: 'Conexión por API key. Importa facturas de compra y gastos de los últimos 90 días automáticamente.', badge: 'bg-blue-100 text-blue-700' },
                { nombre: 'Alegra', tipo: 'API directa', desc: 'Conexión por email + token. Importa gastos y compras a proveedores clasificados por categoría.', badge: 'bg-amber-100 text-amber-700' },
                { nombre: 'SIESA Enterprise', tipo: 'CSV / Excel', desc: 'Exporta el reporte de compras desde SIESA en Excel y cárgalo. Compatible con SIESA 8.5 y Enterprise.', badge: 'bg-green-100 text-green-700' },
                { nombre: 'CSV / Excel genérico', tipo: 'Archivo', desc: 'Para cualquier ERP. Descarga la plantilla, llena las columnas y EcoMetriX mapea automáticamente cada gasto a su categoría GHG.', badge: 'bg-gray-100 text-gray-700' },
              ].map(({ nombre, tipo, desc, badge }) => (
                <div key={nombre} className="bg-white rounded-2xl border border-[#E8F5F0] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-[#1C1917] text-sm">{nombre}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>{tipo}</span>
                  </div>
                  <p className="text-xs text-[#78716C] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 08 — Planes */}
          <section>
            <SectionTitle id="planes" icon="💡" n="08" title="Planes y precios" />
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  nombre: 'Free', precio: '$0', periodo: 'siempre',
                  features: ['Diagnósticos ilimitados', 'Reporte completo 3 alcances', 'Certificado verificable', 'Email con reporte PDF', 'Módulo CSRD básico'],
                  color: 'border-[#E8F5F0]', btn: 'bg-[#F0FDF4] text-[#1D9E75]', link: '/diagnostico',
                },
                {
                  nombre: 'Pro', precio: '$149.000 COP', periodo: '/mes',
                  features: ['Todo el plan Free', 'Historial de diagnósticos', 'Integraciones ERP', 'Exportación PDF avanzada', 'Soporte prioritario'],
                  color: 'border-[#1D9E75] ring-2 ring-[#1D9E75]/20', btn: 'bg-[#1D9E75] text-white', link: '/login', badge: 'Más popular',
                },
                {
                  nombre: 'Enterprise', precio: 'Personalizado', periodo: '',
                  features: ['Todo el plan Pro', 'Múltiples empresas', 'API personalizada', 'Reporte CSRD completo', 'Verificación ISO 14064-3'],
                  color: 'border-amber-200', btn: 'bg-amber-50 text-amber-700', link: 'mailto:oscar@ecometrix.co',
                },
              ].map(({ nombre, precio, periodo, features, color, btn, link, badge }) => (
                <div key={nombre} className={`bg-white rounded-2xl border-2 ${color} p-5 flex flex-col`}>
                  {badge && <span className="text-xs bg-[#1D9E75] text-white font-bold px-2 py-0.5 rounded-full self-start mb-2">{badge}</span>}
                  <p className="font-bold text-[#1C1917] text-base mb-1">{nombre}</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-xl font-bold text-[#1C1917]">{precio}</span>
                    <span className="text-xs text-[#78716C]">{periodo}</span>
                  </div>
                  <ul className="space-y-1.5 mb-5 flex-1">
                    {features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-[#57534E]">
                        <span className="text-[#1D9E75] flex-shrink-0">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <a href={link} className={`block text-center text-xs font-bold py-2.5 rounded-xl transition-colors ${btn}`}>
                    {nombre === 'Enterprise' ? 'Contactar →' : nombre === 'Pro' ? 'Iniciar prueba →' : 'Empezar gratis →'}
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* 09 — FAQ */}
          <section>
            <SectionTitle id="faq" icon="❓" n="09" title="Preguntas frecuentes" />
            <div className="space-y-3">
              <FAQItem
                q="¿Los resultados son exactos?"
                a="EcoMetriX genera estimaciones de alta calidad basadas en los datos que proporciones y factores de emisión del IPCC AR6. Para una medición certificable formalmente se requiere una auditoría con verificador acreditado ISO 14064-3. EcoMetriX puede conectarte con verificadores certificados."
              />
              <FAQItem
                q="¿Mis datos son confidenciales?"
                a="Sí. Los datos se almacenan en Supabase con infraestructura cifrada. No compartimos datos con terceros. El certificado público solo muestra nombre de empresa, score y nivel — nunca los datos de consumo."
              />
              <FAQItem
                q="¿Puedo hacer varios diagnósticos?"
                a="Sí. Todos los planes incluyendo Free permiten diagnósticos ilimitados. Cada diagnóstico genera un reporte y certificado independiente con su propia URL y código de verificación."
              />
              <FAQItem
                q="¿El certificado tiene validez legal?"
                a="El certificado EcoMetriX es un documento de autoevaluación verificable digitalmente, no una certificación ISO formal. Es un documento válido para licitaciones, reportes de sostenibilidad internos y preparación para auditorías externas."
              />
              <FAQItem
                q="¿Funciona para empresas fuera de Colombia?"
                a="Sí. EcoMetriX está disponible en español, inglés, portugués y francés. Los factores IPCC AR6 son de aplicación global. El factor de electricidad usa la red colombiana por defecto pero se puede ajustar."
              />
              <FAQItem
                q="¿Cómo comparto mi reporte con clientes o socios?"
                a="El reporte tiene una URL única permanente que cualquier persona puede abrir sin cuenta. También puedes descargar el certificado PDF y el reporte en PDF para adjuntar en correos o propuestas comerciales."
              />
            </div>
          </section>

          {/* CTA Final */}
          <div className="rounded-3xl bg-[#1D9E75] p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="relative">
              <h2 className="text-2xl font-bold mb-2">¿Listo para medir tu impacto?</h2>
              <p className="text-white/80 text-sm mb-6 max-w-md mx-auto">Diagnóstico gratuito en 10 minutos. Sin tarjeta, sin instalaciones.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/diagnostico" className="bg-white text-[#1D9E75] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#F0FDF4] transition-colors">
                  Iniciar diagnóstico gratis →
                </Link>
                <button onClick={handleDownloadPDF} disabled={pdfLoading} className="bg-white/20 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/30 transition-colors disabled:opacity-60">
                  {pdfLoading ? 'Generando...' : '↓ Descargar este manual'}
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
