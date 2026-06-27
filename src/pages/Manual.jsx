// src/pages/Manual.jsx
// Manual de usuario EcoMetriX — diseño editorial fresco
import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── SECCIONES ────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'que-es',        labelKey: 'manual.sections.queEs',        icon: '🌿', n: '01' },
  { id: 'como-funciona', labelKey: 'manual.sections.comoFunciona', icon: '⚙️', n: '02' },
  { id: 'diagnostico',   labelKey: 'manual.sections.diagnostico',  icon: '📋', n: '03' },
  { id: 'reporte',       labelKey: 'manual.sections.reporte',      icon: '📊', n: '04' },
  { id: 'certificado',   labelKey: 'manual.sections.certificado',  icon: '🏅', n: '05' },
  { id: 'estandares',    labelKey: 'manual.sections.estandares',   icon: '📐', n: '06' },
  { id: 'integraciones', labelKey: 'manual.sections.integraciones',icon: '🔗', n: '07' },
  { id: 'planes',        labelKey: 'manual.sections.planes',       icon: '💡', n: '08' },
  { id: 'faq',           labelKey: 'manual.sections.faq',          icon: '❓', n: '09' },
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

  // Portada
  doc.setFillColor(...verde)
  doc.rect(0, 0, W, 297, 'F')
  doc.setFillColor(255, 255, 255)
  for (let px = 10; px < W; px += 20) {
    for (let py = 10; py < 297; py += 20) {
      doc.circle(px, py, 0.5, 'F')
    }
  }
  doc.setFillColor(255, 255, 255)
  doc.setGState(new doc.GState({ opacity: 0.08 }))
  doc.circle(W - 30, 60, 80, 'F')
  doc.circle(30, 240, 60, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('EcoMetriX', M, 28)
  doc.setFontSize(38); doc.setFont('helvetica', 'bold')
  doc.text('Manual de', M, 100)
  doc.text('Usuario', M, 120)
  doc.setFillColor(255, 255, 255)
  doc.rect(M, 128, 40, 2, 'F')
  doc.setFontSize(13); doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('Guia completa para medir y gestionar', M, 142)
  doc.text('la huella de carbono de tu empresa', M, 152)
  doc.setFontSize(9)
  doc.text(`Version 1.0  |  ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}`, M, 270)
  doc.text('ecometrix-app-one.vercel.app', M, 278)

  // Índice
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
    if (i % 2 === 0) { doc.setFillColor(...grisClaro); doc.rect(M, y - 1, W - M * 2, 8, 'F') }
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...verde)
    doc.text(n, M + 2, y + 5)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...gris)
    doc.text(titulo, M + 12, y + 5)
    doc.setTextColor(...verde)
    doc.text(pg, W - M - 2, y + 5, { align: 'right' })
    y += 8
  })

  // Footer en todas las páginas
  const addFooters = () => {
    const pages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.setFillColor(...verde)
      doc.rect(0, 287, W, 10, 'F')
      doc.setFontSize(7); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal')
      doc.text('EcoMetriX - Manual de Usuario - ecometrix-app-one.vercel.app', W / 2, 293, { align: 'center' })
      doc.text(`${i} / ${pages}`, W - M, 293, { align: 'right' })
    }
  }

  addFooters()
  doc.save('EcoMetriX_Manual_de_Usuario.pdf')
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Manual() {
  const { t } = useTranslation()
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
            <Link to="/questionnaire" className="hidden sm:block text-sm text-[#57534E] hover:text-[#1D9E75] transition-colors">{t('landing.ctaPrimary')} →</Link>
            <button onClick={handleDownloadPDF} disabled={pdfLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold hover:bg-[#16875f] transition-all disabled:opacity-60">
              {pdfLoading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{t('common.loading')}</span></>
              ) : (
                <><span>↓</span><span>{t('manual.downloadPDF')}</span></>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">

        {/* Sidebar */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-bold uppercase tracking-widest text-[#78716C] mb-4">{t('manual.title')}</p>
            <nav className="space-y-1">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => scrollTo(s.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activeSection === s.id
                      ? 'bg-[#F0FDF4] text-[#1D9E75] font-semibold border border-[#BBF7D0]'
                      : 'text-[#78716C] hover:bg-[#F0FDF4] hover:text-[#1D9E75]'
                  }`}>
                  <span className="flex-shrink-0">{s.icon}</span>
                  <span className="text-xs leading-tight">{s.n} {t(s.labelKey)}</span>
                </button>
              ))}
            </nav>
            <div className="mt-8 p-4 rounded-2xl bg-[#1D9E75] text-white">
              <p className="text-sm font-bold mb-1">{t('manual.ctaReadyTitle')}</p>
              <p className="text-xs text-white/80 mb-3">{t('manual.subtitle')}</p>
              <Link to="/questionnaire" className="block text-center bg-white text-[#1D9E75] text-xs font-bold py-2 rounded-lg hover:bg-[#F0FDF4] transition-colors">
                {t('landing.ctaPrimary')} →
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
              <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">{t('manual.badge')} v1.0</span>
              <h1 className="text-3xl font-bold mb-3">{t('manual.heroTitle')}</h1>
              <p className="text-white/80 text-sm max-w-lg leading-relaxed">{t('manual.subtitle')}</p>
              <div className="flex flex-wrap gap-3 mt-6">
                {['GHG Protocol', 'ISO 14064', 'IPCC AR6', 'CSRD/ESRS'].map(s => (
                  <span key={s} className="bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 01 — Qué es */}
          <section>
            <SectionTitle id="que-es" icon="🌿" n="01" title={t('manual.sections.queEs')} />
            <p className="text-[#57534E] leading-relaxed mb-6 text-sm">{t('manual.queEs.desc')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { icon: '⏱', label: '10 minutos', desc: 'Para el diagnóstico completo' },
                { icon: '🌐', label: '100% online', desc: 'Sin instalación adicional' },
                { icon: '🆓', label: 'Gratis', desc: 'Para empezar' },
                { icon: '✅', label: 'Verificable', desc: 'Código único público' },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="rounded-2xl bg-white border border-[#E8F5F0] p-4 text-center">
                  <span className="text-2xl block mb-2">{icon}</span>
                  <p className="font-bold text-[#1C1917] text-sm">{label}</p>
                  <p className="text-xs text-[#78716C]">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm font-semibold text-[#1C1917] mb-2">{t('manual.queEs.forWho')}</p>
            <p className="text-sm text-[#57534E] leading-relaxed">{t('manual.queEs.forWhoDesc')}</p>
          </section>

          {/* 02 — Cómo funciona */}
          <section>
            <SectionTitle id="como-funciona" icon="⚙️" n="02" title={t('manual.sections.comoFunciona')} />
            <div className="space-y-3">
              <StepCard n="1" title={t('manual.comoFunciona.step1')} desc={t('manual.comoFunciona.step1Desc')}
                detail="El cuestionario se adapta según el sector de tu empresa para hacer preguntas relevantes. Una empresa de tecnología no necesita responder sobre maquinaria industrial; una empresa de logística tiene preguntas específicas sobre flota vehicular." />
              <StepCard n="2" title={t('manual.comoFunciona.step2')} desc={t('manual.comoFunciona.step2Desc')}
                detail="Los factores del IPCC AR6 (2021) son el referente científico más actualizado. Por ejemplo: 1 kWh en Colombia = 0.126 kg CO₂e según el factor de la red eléctrica nacional (UPME 2023)." />
              <StepCard n="3" title={t('manual.comoFunciona.step3ai')} desc={t('manual.comoFunciona.step3aiDesc')}
                detail="La IA analiza tus resultados y genera recomendaciones priorizadas por impacto y facilidad. El plan de reducción incluye 5 acciones concretas con estimación del porcentaje de reducción potencial." />
              <StepCard n="4" title={t('manual.comoFunciona.step3')} desc={t('manual.comoFunciona.step3Desc')}
                detail="El reporte queda en una URL permanente que puedes compartir con socios, clientes o inversionistas. El certificado PDF tiene diseño tipo diploma con código de verificación único." />
            </div>
          </section>

          {/* 03 — Diagnóstico */}
          <section>
            <SectionTitle id="diagnostico" icon="📋" n="03" title={t('manual.sections.diagnostico')} />
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
            <SectionTitle id="reporte" icon="📊" n="04" title={t('manual.sections.reporte')} />
            <p className="text-sm text-[#78716C] mb-5">El reporte incluye 7 módulos. Aquí explicamos qué significa cada uno:</p>
            <div className="space-y-3">
              {[
                { t: 'Resumen ejecutivo', d: 'Texto generado por IA con la situación de tu empresa, nivel de impacto (Bajo / Moderado / Alto) y comparación con el promedio del sector.' },
                { t: 'Métricas principales', d: 'Huella total en toneladas CO₂e/año, desglose por los 3 alcances en kg CO₂e/mes, y valor económico equivalente al mercado de carbono europeo (EU ETS).' },
                { t: 'Distribución por alcance', d: 'Gráfica que muestra qué porcentaje de tus emisiones viene de cada alcance. Te ayuda a priorizar dónde actuar primero.' },
                { t: 'Fuentes de emisión', d: 'Tabla detallada con cada categoría de emisión, su peso en el total y el factor de emisión aplicado (trazable al IPCC AR6).' },
                { t: 'Plan de reducción', d: '5 acciones priorizadas por impacto potencial y facilidad. Cada acción incluye % de reducción estimado, dificultad y plazo.' },
                { t: 'Metodología aplicada', d: 'Badges con cobertura de cada estándar: GHG Protocol, ISO 14064-1, IPCC AR6, CSRD/ESRS E1, SBTi Baseline y GRI 305.' },
                { t: 'Certificación EcoMetriX', d: 'Score de sostenibilidad (0-100), nivel obtenido, código de verificación único y badges de logros desbloqueados.' },
              ].map(({ t: title, d }, i) => (
                <div key={title} className="flex gap-4 p-4 rounded-2xl bg-white border border-[#E8F5F0]">
                  <div className="w-7 h-7 rounded-lg bg-[#1D9E75] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{i + 1}</div>
                  <div>
                    <p className="font-semibold text-[#1C1917] text-sm mb-1">{title}</p>
                    <p className="text-xs text-[#78716C] leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Nueva feature: Importar factura */}
            <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📄</span>
                <p className="font-bold text-blue-800 text-sm">Nuevo: Importar desde factura</p>
                <span className="text-xs bg-blue-200 text-blue-700 font-bold px-2 py-0.5 rounded-full">IA</span>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed mb-3">
                Durante el cuestionario (Alcances 1, 2 y 3) encontrarás el botón <strong>"Importar factura"</strong> en la barra superior. Sube una imagen de tu factura de electricidad, gas o combustible y EcoMetriX extrae automáticamente los datos usando inteligencia artificial.
              </p>
              <ul className="space-y-1.5">
                {[
                  'Sube una foto o captura de pantalla de tu factura (JPG o PNG)',
                  'La IA identifica el proveedor, tipo de consumo y cantidad',
                  'Los datos se pre-llenan automáticamente en el cuestionario',
                  'Revisa y confirma los datos antes de continuar',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-blue-700">
                    <span className="text-blue-500 flex-shrink-0 mt-0.5">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-blue-500 mt-3">Disponible en planes Básico, Pro y Enterprise. Requiere conexión a internet.</p>
            </div>

            <div className="mt-4 bg-[#1D9E75] rounded-2xl p-4 text-white">
              <p className="text-sm font-bold mb-1">💡 URL permanente y compartible</p>
              <p className="text-xs text-white/80">El reporte tiene una URL única que funciona sin cuenta. Puedes compartirla con socios, clientes o inversionistas.</p>
            </div>
          </section>

          {/* 05 — Certificado */}
          <section>
            <SectionTitle id="certificado" icon="🏅" n="05" title={t('manual.sections.certificado')} />
            <p className="text-sm text-[#57534E] leading-relaxed mb-6">
              Al completar el diagnóstico, EcoMetriX genera automáticamente un <strong>Certificado de Diagnóstico de Huella de Carbono</strong>. Este certificado tiene una puntuación calculada matemáticamente, un nivel asignado según criterios objetivos y un código de verificación único.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { nivel: 'Iniciado Verde',   pts: '0–39 pts',   icon: '🌿', color: 'border-gray-200 bg-gray-50',     tc: 'text-gray-600' },
                { nivel: 'Comprometido',     pts: '40–64 pts',  icon: '♻️', color: 'border-emerald-200 bg-emerald-50',tc: 'text-emerald-700' },
                { nivel: 'Avanzado',         pts: '65–84 pts',  icon: '🌱', color: 'border-green-200 bg-green-50',   tc: 'text-green-700' },
                { nivel: 'Líder Sostenible', pts: '85–100 pts', icon: '🏆', color: 'border-amber-200 bg-amber-50',   tc: 'text-amber-700' },
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
                Cualquier persona puede verificar un certificado en <strong>ecometrix-app-one.vercel.app/verificar/[CODIGO]</strong>. El sistema consulta la base de datos en tiempo real y muestra el nivel, score, empresa y fecha de emisión.
              </p>
            </div>
          </section>

          {/* 06 — Estándares */}
          <section>
            <SectionTitle id="estandares" icon="📐" n="06" title={t('manual.sections.estandares')} />
            <p className="text-sm text-[#57534E] mb-6 leading-relaxed">
              La credibilidad de EcoMetriX se basa en los estándares internacionales que utiliza. Aplicamos los marcos científicos y regulatorios más reconocidos globalmente.
            </p>
            <div className="space-y-4">
              <StandardBadge name="🌍 GHG Protocol Corporate Standard"
                desc="El estándar global más usado para medir emisiones GHG en organizaciones. Desarrollado por WRI y WBCSD. Es la base de prácticamente todos los demás marcos. EcoMetriX lo usa como metodología central para definir los 3 alcances de emisión."
                color="border-[#1D9E75] bg-[#F0FDF4] text-[#1D9E75]" />
              <StandardBadge name="📋 ISO 14064-1:2018"
                desc="Norma internacional certificable para cuantificación y reporte de inventarios GHG. Los reportes de EcoMetriX siguen una metodología compatible, lo que facilita la transición a una certificación formal con un verificador acreditado ISO 14064-3."
                color="border-blue-300 bg-blue-50 text-blue-700" />
              <StandardBadge name="📊 IPCC AR6 — Sexto Informe de Evaluación (2021)"
                desc="Los factores de emisión del Panel Intergubernamental sobre Cambio Climático AR6 son el referente científico más actualizado. EcoMetriX los usa para convertir consumos (kWh, litros, m³) en kg CO₂ equivalente con la mayor precisión disponible."
                color="border-purple-300 bg-purple-50 text-purple-700" />
              <StandardBadge name="🇪🇺 CSRD / ESRS E1 — Directiva UE 2022/2464"
                desc="La Corporate Sustainability Reporting Directive obliga a empresas europeas y sus proveedores a reportar sostenibilidad. EcoMetriX incluye un módulo de gap analysis CSRD con roadmap de cumplimiento para empresas que exportan a Europa."
                color="border-amber-300 bg-amber-50 text-amber-700" />
              <StandardBadge name="🎯 Science Based Targets (SBTi)"
                desc="Iniciativa que valida objetivos de reducción alineados con el límite de 1.5°C del Acuerdo de París. El diagnóstico de EcoMetriX genera el baseline de emisiones necesario para que una empresa aplique formalmente a SBTi."
                color="border-green-300 bg-green-50 text-green-700" />
            </div>
          </section>

          {/* 07 — Integraciones */}
          <section>
            <SectionTitle id="integraciones" icon="🔗" n="07" title={t('manual.sections.integraciones')} />
            <p className="text-sm text-[#57534E] mb-5 leading-relaxed">
              Conecta tu sistema contable para importar automáticamente facturas y gastos, eliminando el ingreso manual de datos.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { nombre: 'Siigo',              tipo: 'API directa', desc: 'Conexión por API key. Importa facturas de compra y gastos de los últimos 90 días automáticamente.', badge: 'bg-blue-100 text-blue-700' },
                { nombre: 'Alegra',             tipo: 'API directa', desc: 'Conexión por email + token. Importa gastos y compras a proveedores clasificados por categoría.', badge: 'bg-amber-100 text-amber-700' },
                { nombre: 'SIESA Enterprise',   tipo: 'CSV / Excel', desc: 'Exporta el reporte de compras desde SIESA en Excel y cárgalo. Compatible con SIESA 8.5 y Enterprise.', badge: 'bg-green-100 text-green-700' },
                { nombre: 'CSV / Excel genérico',tipo: 'Archivo', desc: 'Para cualquier ERP. Descarga la plantilla y EcoMetriX mapea cada gasto a su categoría GHG.', badge: 'bg-gray-100 text-gray-700' },
                { nombre: 'Foto de factura (IA)', tipo: 'Imagen', desc: 'Sube una foto de cualquier factura (JPG/PNG). La IA extrae consumos y los mapea automáticamente al alcance GHG correcto. Sin necesidad de ERP.', badge: 'bg-purple-100 text-purple-700' },
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
            <SectionTitle id="planes" icon="💡" n="08" title={t('manual.sections.planes')} />
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { nombre: 'Básico', precio: '$79.000 COP', periodo: '/mes — o $758.400/año (20% off)',
                  features: ['Diagnósticos ilimitados', 'Reporte PDF descargable', 'Certificación EcoMetriX', 'Dashboard 360°', 'Soporte por email'],
                  color: 'border-[#E8F5F0]', btn: 'bg-[#F0FDF4] text-[#1D9E75]', link: '/pricing?plan=basico' },
                { nombre: 'Pro', precio: '$199.000 COP', periodo: '/mes — o $1.910.400/año (20% off)',
                  features: ['Todo lo del Básico', 'Plan de reducción mensual', 'Seguimiento mes a mes', 'Módulo CSRD/ESRS', 'Acceso API', 'Soporte prioritario'],
                  color: 'border-[#1D9E75] ring-2 ring-[#1D9E75]/20', btn: 'bg-[#1D9E75] text-white', link: '/pricing?plan=pro', badge: t('pricing.popular') },
                { nombre: 'Enterprise', precio: '$499.000 COP', periodo: '/mes — o $4.790.400/año (20% off)',
                  features: ['Todo lo del Pro', 'Múltiples usuarios', 'API ilimitada', 'Onboarding personalizado', 'SLA garantizado', 'Factura electrónica'],
                  color: 'border-amber-200', btn: 'bg-amber-50 text-amber-700', link: '/pricing?plan=enterprise' },
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
                    {t('manual.activatePlan', { nombre })}
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* 09 — FAQ */}
          <section>
            <SectionTitle id="faq" icon="❓" n="09" title={t('manual.sections.faq')} />
            <div className="space-y-3">
              <FAQItem q={t('manual.faqItems.q1')} a={t('manual.faqItems.a1')} />
              <FAQItem q={t('manual.faqItems.q2')} a={t('manual.faqItems.a2')} />
              <FAQItem q={t('manual.faqItems.q3')} a={t('manual.faqItems.a3')} />
              <FAQItem q={t('manual.faqItems.q4')} a={t('manual.faqItems.a4')} />
              <FAQItem q={t('manual.faqItems.q5')} a={t('manual.faqItems.a5')} />
              <FAQItem q={t('manual.faqItems.q6')} a={t('manual.faqItems.a6')} />
              <FAQItem
                q="¿Puedo subir una foto de mi factura de servicios públicos?"
                a="Sí. Durante el cuestionario encontrarás el botón 'Importar factura' en la barra superior de cada alcance. Sube una imagen JPG o PNG de tu factura de electricidad, gas o combustible y la IA extrae automáticamente el consumo y lo pre-llena en el formulario. Para PDFs, toma una captura de pantalla primero."
              />
              <FAQItem
                q="¿Los precios tienen descuento por pago anual?"
                a="Sí. Al seleccionar facturación anual en la página de precios obtienes un 20% de descuento sobre el total. El descuento aplica desde el primer pago y se cobra en un solo cobro anual."
              />
            </div>
          </section>

          {/* CTA Final */}
          <div className="rounded-3xl bg-[#1D9E75] p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="relative">
              <h2 className="text-2xl font-bold mb-2">{t('manual.ctaFinalTitle')}</h2>
              <p className="text-white/80 text-sm mb-6 max-w-md mx-auto">{t('landing.cta.desc')}</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/questionnaire" className="bg-white text-[#1D9E75] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#F0FDF4] transition-colors">
                  {t('landing.ctaPrimary')} →
                </Link>
                <button onClick={handleDownloadPDF} disabled={pdfLoading}
                  className="bg-white/20 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/30 transition-colors disabled:opacity-60">
                  {pdfLoading ? t('common.loading') : `↓ ${t('manual.downloadPDF')}`}
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
