// src/pages/SBTi.jsx
// M17 — Calculador de objetivos SBTi v2 basado en baseline del diagnóstico

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── SBTi Calculation Engine ──────────────────────────────────────────────────
// Basado en SBTi Corporate Manual v2 y SME Route
// https://sciencebasedtargets.org/resources/files/SBTi-Corporate-Manual.pdf

const AMBITION_LEVELS = {
  '1.5C': { label: '1.5°C (Acuerdo de París)', reduction_near: 4.2, reduction_long: 90, badge: 'bg-brand-50 text-brand-400 border-brand-200', icon: '🌟' },
  '2C':   { label: 'Muy por debajo de 2°C',    reduction_near: 2.5, reduction_long: 80, badge: 'bg-blue-50 text-blue-700 border-blue-200',   icon: '✅' },
  'SME':  { label: 'SME Route (simplificado)', reduction_near: 4.2, reduction_long: 90, badge: 'bg-green-50 text-green-700 border-green-200', icon: '🚀' },
}

// Factores de reducción requeridos por sector (% por año, método Sectoral Decarbonization Approach)
const SECTOR_PATHWAYS = {
  'Manufactura':    { near_pct: 4.5, scope3_required: true },
  'Retail / Comercio': { near_pct: 4.2, scope3_required: true },
  'Logística':      { near_pct: 5.2, scope3_required: true },
  'Servicios':      { near_pct: 3.8, scope3_required: false },
  'Alimentos':      { near_pct: 4.8, scope3_required: true },
  'Construcción':   { near_pct: 4.5, scope3_required: true },
  'Tecnología':     { near_pct: 3.5, scope3_required: false },
  'Salud':          { near_pct: 3.8, scope3_required: false },
  default:          { near_pct: 4.2, scope3_required: true },
}

function calcularObjetivoSBTi({ baseline_ton, sector, ambicion, ano_base, empleados }) {
  const pathway = SECTOR_PATHWAYS[sector] || SECTOR_PATHWAYS.default
  const level   = AMBITION_LEVELS[ambicion]
  const ano_near_term = ano_base + 10
  const ano_long_term = 2050

  // Near-term: reducción % anual compuesta por 10 años
  const reduccion_near_pct = level.reduction_near  // % anual
  const target_near = baseline_ton * Math.pow(1 - reduccion_near_pct / 100, 10)

  // Long-term: reducción absoluta sobre baseline
  const target_long = baseline_ton * (1 - level.reduction_long / 100)

  // SBTi SME: intensidad por empleado (alternativa para PYMEs)
  const intensidad_base = empleados > 0 ? (baseline_ton / empleados) : 0
  const intensidad_target = intensidad_base * (1 - reduccion_near_pct / 100 * 10)

  // Acciones requeridas para alcanzar el objetivo
  const reduccion_necesaria_ton = baseline_ton - target_near
  const acciones = []

  if (baseline_ton > 0) {
    const pct_elec = 0.35 // ~35% típico Alcance 2
    const pct_combustible = 0.25
    const pct_cadena = 0.40

    acciones.push({
      accion: 'Migración a energía 100% renovable',
      potencial_ton: Math.round(baseline_ton * pct_elec * 0.95),
      plazo: '2–4 años',
      costo: 'Medio',
      alcance: 2,
      descripcion: 'Contrato PPA o certificados REC para todo el consumo eléctrico',
    })
    acciones.push({
      accion: 'Electrificación de flota vehicular',
      potencial_ton: Math.round(baseline_ton * pct_combustible * 0.6),
      plazo: '3–5 años',
      costo: 'Alto',
      alcance: 1,
      descripcion: 'Reemplazar flota diésel/gasolina por vehículos eléctricos o híbridos',
    })
    acciones.push({
      accion: 'Eficiencia energética en instalaciones',
      potencial_ton: Math.round(baseline_ton * 0.12),
      plazo: '1–2 años',
      costo: 'Bajo',
      alcance: 1,
      descripcion: 'Iluminación LED, HVAC eficiente, gestión activa de consumo',
    })
    acciones.push({
      accion: 'Engagement cadena de suministro',
      potencial_ton: Math.round(baseline_ton * pct_cadena * 0.3),
      plazo: '2–5 años',
      costo: 'Bajo',
      alcance: 3,
      descripcion: 'Exigir compromisos de reducción a proveedores principales (Scope 3.1)',
    })
    acciones.push({
      accion: 'Optimización logística y distribución',
      potencial_ton: Math.round(baseline_ton * 0.08),
      plazo: '1–3 años',
      costo: 'Bajo',
      alcance: 3,
      descripcion: 'Consolidación de envíos, cambio modal, optimización de rutas',
    })
  }

  // Hoja de ruta anual 2025–2035
  const roadmap = []
  for (let i = 0; i <= 10; i++) {
    const ano = ano_base + i
    const target = baseline_ton * Math.pow(1 - reduccion_near_pct / 100, i)
    roadmap.push({ ano, target_ton: Math.round(target * 10) / 10, reduccion_pct: Math.round(reduccion_near_pct * i * 10) / 10 })
  }

  return {
    baseline_ton,
    sector,
    ambicion,
    ano_base,
    level,
    pathway,
    target_near_ton: Math.round(target_near * 10) / 10,
    target_long_ton: Math.round(target_long * 10) / 10,
    reduccion_near_pct: Math.round(reduccion_near_pct * 10 * 10) / 10,
    reduccion_near_ton: Math.round(reduccion_necesaria_ton * 10) / 10,
    ano_near_term,
    ano_long_term,
    intensidad_base: Math.round(intensidad_base * 100) / 100,
    intensidad_target: Math.round(intensidad_target * 100) / 100,
    scope3_required: pathway.scope3_required,
    acciones: acciones.sort((a, b) => b.potencial_ton - a.potencial_ton),
    roadmap,
  }
}

async function generarPDFSBTi(resultado, empresa) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, margin = 18
  let y = 0

  doc.setFillColor(29, 158, 117)
  doc.rect(0, 0, W, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15); doc.setFont('helvetica', 'bold')
  doc.text('EcoMetriX - Plan SBTi v2', margin, 12)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(`Science Based Targets initiative · ${resultado.level.label}`, margin, 20)
  doc.text(new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }), W - margin, 20, { align: 'right' })

  y = 40
  if (empresa) {
    doc.setTextColor(28, 25, 23); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.text(empresa.nombre || 'Empresa', margin, y)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(87, 83, 78)
    doc.text(`${empresa.sector || resultado.sector} · Año base: ${resultado.ano_base}`, margin, y + 5)
    y += 14
  }

  // KPIs
  doc.setFillColor(240, 253, 244); doc.roundedRect(margin, y, W - margin * 2, 28, 3, 3, 'F')
  const kpis = [
    { label: 'Baseline', value: `${resultado.baseline_ton} t`, sub: 'CO₂e/año' },
    { label: `Objetivo ${resultado.ano_near_term}`, value: `${resultado.target_near_ton} t`, sub: `−${resultado.reduccion_near_pct}%` },
    { label: 'Objetivo 2050', value: `${resultado.target_long_ton} t`, sub: `−${resultado.level.reduction_long}%` },
    { label: 'Reducción requerida', value: `${resultado.reduccion_near_ton} t`, sub: 'en 10 años' },
  ]
  const kpiW = (W - margin * 2) / 4
  kpis.forEach((k, i) => {
    const x = margin + i * kpiW + kpiW / 2
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 158, 117)
    doc.text(k.value, x, y + 12, { align: 'center' })
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(87, 83, 78)
    doc.text(k.label, x, y + 17, { align: 'center' })
    doc.text(k.sub, x, y + 21, { align: 'center' })
  })
  y += 36

  doc.setTextColor(28, 25, 23); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('Acciones prioritarias de reducción', margin, y); y += 8

  resultado.acciones.forEach((a, i) => {
    if (y > 255) { doc.addPage(); y = 20 }
    doc.setFillColor(i % 2 === 0 ? 249 : 255, 250, i % 2 === 0 ? 251 : 255)
    doc.rect(margin, y, W - margin * 2, 16, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(28, 25, 23)
    doc.text(`${i + 1}. ${a.accion}`, margin + 2, y + 6)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(87, 83, 78)
    const descLines = doc.splitTextToSize(a.descripcion, W - margin * 2 - 50)
    doc.text(descLines, margin + 2, y + 11)
    doc.setTextColor(29, 158, 117); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text(`−${a.potencial_ton}t`, W - margin - 2, y + 7, { align: 'right' })
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128)
    doc.text(`Alcance ${a.alcance} · ${a.plazo}`, W - margin - 2, y + 12, { align: 'right' })
    y += 18
  })

  y += 4
  if (y > 200) { doc.addPage(); y = 20 }
  doc.setTextColor(28, 25, 23); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text(`Hoja de ruta ${resultado.ano_base}–${resultado.ano_near_term}`, margin, y); y += 8

  resultado.roadmap.forEach(r => {
    if (y > 272) { doc.addPage(); y = 20 }
    const barW = Math.max(2, ((resultado.baseline_ton - r.target_ton) / resultado.baseline_ton) * (W - margin * 2 - 30))
    doc.setFontSize(7.5); doc.setTextColor(55, 65, 81); doc.setFont('helvetica', 'normal')
    doc.text(`${r.ano}`, margin, y + 3)
    doc.setFillColor(229, 231, 235); doc.rect(margin + 12, y, W - margin * 2 - 30, 5, 'F')
    doc.setFillColor(29, 158, 117); doc.rect(margin + 12, y, barW, 5, 'F')
    doc.setFontSize(7); doc.setTextColor(29, 158, 117)
    doc.text(`${r.target_ton}t (−${r.reduccion_pct}%)`, W - margin, y + 4, { align: 'right' })
    y += 7
  })

  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(29, 158, 117); doc.rect(0, 287, W, 10, 'F')
    doc.setFontSize(7); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal')
    doc.text('EcoMetriX · Science Based Targets v2 · ecometrix-app-one.vercel.app', W / 2, 293, { align: 'center' })
    doc.text(`${i} / ${pages}`, W - margin, 293, { align: 'right' })
  }

  const nombre = empresa?.nombre?.replace(/\s+/g, '_') || 'empresa'
  doc.save(`EcoMetriX_SBTi_${nombre}_${resultado.ano_base}.pdf`)
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function SBTi() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [ambicion, setAmbicion] = useState('1.5C')
  const [anoBase, setAnoBase] = useState(new Date().getFullYear())
  const [resultado, setResultado] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [manualBaseline, setManualBaseline] = useState('')
  const [manualSector, setManualSector] = useState('')
  const [manualEmpleados, setManualEmpleados] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('ecometrix_result')
    if (stored) {
      const d = JSON.parse(stored)
      setData(d)
      setManualSector(d.empresa?.sector || '')
      setManualEmpleados(String(d.respuestas?.a2_numero_empleados || 10))
    }
  }, [])

  const baseline_ton = data
    ? data.calculo?.totalTonAnio || 0
    : parseFloat(manualBaseline) || 0

  const sector = data?.empresa?.sector || manualSector || 'Servicios'
  const empleados = parseInt(data?.respuestas?.a2_numero_empleados || manualEmpleados || 10)

  function handleCalcuar() {
    if (baseline_ton <= 0) return
    const r = calcularObjetivoSBTi({ baseline_ton, sector, ambicion, ano_base: anoBase, empleados })
    setResultado(r)
  }

  async function handlePDF() {
    if (!resultado) return
    setPdfLoading(true)
    try { await generarPDFSBTi(resultado, data?.empresa) }
    catch { alert('Error generando PDF.') }
    finally { setPdfLoading(false) }
  }

  const SECTORES = Object.keys(SECTOR_PATHWAYS).filter(s => s !== 'default')

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-brand-400 font-semibold text-sm">EcoMetriX</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/estandares" className="btn-ghost text-sm py-1.5 px-3">← Estándares</Link>
            <Link to="/diagnostico" className="btn-primary text-sm py-1.5 px-3">{t('dashboard.newDiagnosis')}</Link>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎯</span>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Calculador SBTi v2</h1>
              <p className="text-sm text-text-secondary">Science Based Targets initiative · Alineado con 1.5°C del Acuerdo de París</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Info box */}
        <div className="card mb-6 border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">¿Qué es SBTi?</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                La Science Based Targets initiative valida objetivos de reducción de emisiones alineados con la ciencia climática.
                Más de 7,000 empresas globales tienen compromisos SBTi. Los objetivos deben reducir emisiones Alcances 1+2 un <strong>4.2% anual</strong> (ruta 1.5°C) y comprometer Alcance 3 si supera el 40% de las emisiones totales.
              </p>
              <p className="text-sm text-blue-700 mt-1">
                <strong>SME Route:</strong> Para PYMEs con &lt;500 empleados — proceso simplificado sin necesidad de verificación externa.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-text-primary mb-4">Datos del baseline</h2>

              {data ? (
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-brand-400 mb-2">✓ Datos de tu diagnóstico</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-text-muted text-xs">Empresa</span><p className="font-semibold">{data.empresa?.nombre}</p></div>
                    <div><span className="text-text-muted text-xs">Sector</span><p className="font-semibold">{data.empresa?.sector}</p></div>
                    <div><span className="text-text-muted text-xs">Baseline</span><p className="font-bold text-brand-400">{baseline_ton} t CO₂e/año</p></div>
                    <div><span className="text-text-muted text-xs">Empleados</span><p className="font-semibold">{empleados}</p></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                    <p className="text-xs text-amber-700">Sin diagnóstico activo. Ingresa los datos manualmente o
                      <Link to="/diagnostico" className="text-brand-400 font-semibold ml-1 hover:underline">haz tu diagnóstico gratis →</Link>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-primary mb-1 block">Emisiones baseline (ton CO₂e/año) *</label>
                    <input type="number" value={manualBaseline} onChange={e => setManualBaseline(e.target.value)}
                      placeholder="Ej: 45.5" className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-1 focus:ring-brand-300" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-primary mb-1 block">Sector</label>
                    <select value={manualSector} onChange={e => setManualSector(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-1 focus:ring-brand-300">
                      <option value="">Selecciona sector</option>
                      {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-primary mb-1 block">Número de empleados</label>
                    <input type="number" value={manualEmpleados} onChange={e => setManualEmpleados(e.target.value)}
                      placeholder="Ej: 50" className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-1 focus:ring-brand-300" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Año base del cálculo</label>
                <select value={anoBase} onChange={e => setAnoBase(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-1 focus:ring-brand-300">
                  {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="card">
              <h2 className="font-semibold text-text-primary mb-4">Nivel de ambición</h2>
              <div className="space-y-2">
                {Object.entries(AMBITION_LEVELS).map(([key, level]) => (
                  <label key={key} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${ambicion === key ? `border-brand-300 bg-brand-50` : 'border-border hover:border-brand-200'}`}>
                    <input type="radio" name="ambicion" value={key} checked={ambicion === key} onChange={() => setAmbicion(key)} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">{level.icon} {key === 'SME' ? 'SME Route' : key}</span>
                        {key === '1.5C' && <span className="bg-brand-300 text-white text-xs px-1.5 py-0.5 rounded-full">Recomendado</span>}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{level.label}</p>
                      <p className="text-xs text-text-muted">Reducción: {level.reduction_near}%/año · {level.reduction_long}% al 2050</p>
                    </div>
                  </label>
                ))}
              </div>

              <button onClick={handleCalcuar} disabled={baseline_ton <= 0}
                className="w-full mt-4 py-3 rounded-xl bg-brand-300 hover:bg-brand-400 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                <span>🎯</span> Calcular objetivos SBTi
              </button>
            </div>
          </div>

          {/* Resultados */}
          <div>
            {!resultado ? (
              <div className="card h-64 flex items-center justify-center text-center">
                <div>
                  <span className="text-4xl block mb-3">🎯</span>
                  <p className="text-text-muted text-sm">Completa los datos y presiona<br/>"Calcular objetivos SBTi"</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score card */}
                <div className="card border-brand-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Ruta SBTi</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${resultado.level.badge}`}>
                        {resultado.level.icon} {resultado.level.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-brand-400">{resultado.reduccion_near_pct}%</p>
                      <p className="text-xs text-text-muted">reducción en 10 años</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-surface-secondary rounded-xl p-3 text-center">
                      <p className="text-xs text-text-muted mb-1">Baseline {resultado.ano_base}</p>
                      <p className="text-xl font-bold text-text-primary">{resultado.baseline_ton}</p>
                      <p className="text-xs text-text-muted">t CO₂e/año</p>
                    </div>
                    <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 text-center">
                      <p className="text-xs text-text-muted mb-1">Objetivo {resultado.ano_near_term}</p>
                      <p className="text-xl font-bold text-brand-400">{resultado.target_near_ton}</p>
                      <p className="text-xs text-text-muted">t CO₂e/año</p>
                    </div>
                    <div className="bg-surface-secondary rounded-xl p-3 text-center">
                      <p className="text-xs text-text-muted mb-1">Reducción requerida</p>
                      <p className="text-xl font-bold text-red-500">{resultado.reduccion_near_ton}</p>
                      <p className="text-xs text-text-muted">t CO₂e a eliminar</p>
                    </div>
                    <div className="bg-surface-secondary rounded-xl p-3 text-center">
                      <p className="text-xs text-text-muted mb-1">Objetivo 2050</p>
                      <p className="text-xl font-bold text-text-primary">{resultado.target_long_ton}</p>
                      <p className="text-xs text-text-muted">t CO₂e/año</p>
                    </div>
                  </div>

                  {resultado.scope3_required && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                      <p className="text-xs font-semibold text-amber-700">⚠ Alcance 3 requerido</p>
                      <p className="text-xs text-amber-600 mt-0.5">Para el sector {resultado.sector}, SBTi requiere incluir Alcance 3 si supera el 40% de emisiones totales.</p>
                    </div>
                  )}

                  {resultado.intensidad_base > 0 && (
                    <div className="bg-surface-secondary rounded-xl p-3">
                      <p className="text-xs font-semibold text-text-primary mb-1">Intensidad por empleado (SME Route)</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted">Base: {resultado.intensidad_base} t/empleado</span>
                        <span className="text-brand-400 font-semibold">Meta {resultado.ano_near_term}: {resultado.intensidad_target} t/empleado</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="card">
                  <h3 className="font-semibold text-text-primary mb-3">Acciones de reducción prioritarias</h3>
                  <div className="space-y-2">
                    {resultado.acciones.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-secondary">
                        <span className="w-6 h-6 rounded-full bg-brand-300 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-text-primary">{a.accion}</p>
                          <p className="text-xs text-text-muted mt-0.5">{a.descripcion}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="badge-gray text-xs">Alc. {a.alcance}</span>
                            <span className="badge-gray text-xs">{a.plazo}</span>
                            <span className="badge-gray text-xs">Costo {a.costo}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-brand-400">−{a.potencial_ton}t</p>
                          <p className="text-xs text-text-muted">CO₂e</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Roadmap visual */}
                <div className="card">
                  <h3 className="font-semibold text-text-primary mb-3">Hoja de ruta {resultado.ano_base}–{resultado.ano_near_term}</h3>
                  <div className="space-y-1.5">
                    {resultado.roadmap.map(r => (
                      <div key={r.ano} className="flex items-center gap-3">
                        <span className="text-xs text-text-muted w-10 flex-shrink-0">{r.ano}</span>
                        <div className="flex-1 h-4 bg-surface-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-300 rounded-full transition-all duration-500"
                            style={{ width: `${100 - (r.reduccion_pct / resultado.level.reduction_long * 100 * (10/30))}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-brand-400 w-20 text-right flex-shrink-0">{r.target_ton}t</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export */}
                <button onClick={handlePDF} disabled={pdfLoading}
                  className="w-full py-3 rounded-xl border-2 border-brand-200 bg-brand-50 text-brand-400 font-semibold text-sm hover:bg-brand-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {pdfLoading
                    ? <><span className="w-4 h-4 border-2 border-brand-300 border-t-transparent rounded-full animate-spin" /><span>Generando...</span></>
                    : <><span>📄</span><span>Descargar Plan SBTi PDF</span></>
                  }
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-400 to-brand-300 p-6 text-white mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg mb-1">¿Listo para comprometerte con SBTi?</h3>
              <p className="text-white/80 text-sm">El plan Pro de EcoMetriX incluye seguimiento mensual de tu progreso SBTi con alertas automáticas.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a href="https://sciencebasedtargets.org/companies-taking-action" target="_blank" rel="noopener noreferrer"
                className="bg-white/20 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
                Registrar en SBTi →
              </a>
              <Link to="/precios" className="bg-white text-brand-400 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors">
                Plan Pro
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
