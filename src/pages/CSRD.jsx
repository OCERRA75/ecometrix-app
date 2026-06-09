// src/pages/CSRD.jsx
// M17.1 — Módulo CSRD / ESRS con export PDF real
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconEU = () => <span className="text-lg">🇪🇺</span>
const IconCheck = ({ color = 'text-brand-400' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={`w-3.5 h-3.5 ${color}`}>
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-red-500">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconMinus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-amber-500">
    <path d="M5 12h14" strokeLinecap="round"/>
  </svg>
)

// ─── CSRD DATA ────────────────────────────────────────────────────────────────
const ESRS_REQUIREMENTS = [
  {
    standard: 'ESRS E1', titulo: 'Cambio climático', obligatorio: true,
    requerimientos: [
      { id: 'e1_1', texto: 'Divulgación de emisiones GHG — Alcances 1, 2 y 3', categoria: 'Métricas', peso: 3 },
      { id: 'e1_2', texto: 'Objetivos de reducción de emisiones con plazos definidos', categoria: 'Objetivos', peso: 3 },
      { id: 'e1_3', texto: 'Plan de transición hacia economía baja en carbono', categoria: 'Estrategia', peso: 2 },
      { id: 'e1_4', texto: 'Análisis de riesgos climáticos físicos y de transición', categoria: 'Riesgos', peso: 2 },
      { id: 'e1_5', texto: 'Políticas relacionadas con cambio climático documentadas', categoria: 'Gobernanza', peso: 2 },
      { id: 'e1_6', texto: 'Intensidad de emisiones por unidad de producción o empleado', categoria: 'Métricas', peso: 1 },
    ]
  },
  {
    standard: 'ESRS E2', titulo: 'Contaminación', obligatorio: false,
    requerimientos: [
      { id: 'e2_1', texto: 'Gestión de emisiones al aire, agua y suelo', categoria: 'Operaciones', peso: 2 },
      { id: 'e2_2', texto: 'Uso y liberación de sustancias preocupantes', categoria: 'Métricas', peso: 1 },
    ]
  },
  {
    standard: 'ESRS E3', titulo: 'Recursos hídricos y marinos', obligatorio: false,
    requerimientos: [
      { id: 'e3_1', texto: 'Consumo total de agua y en zonas de estrés hídrico', categoria: 'Métricas', peso: 1 },
      { id: 'e3_2', texto: 'Política de gestión sostenible del agua', categoria: 'Gobernanza', peso: 1 },
    ]
  },
  {
    standard: 'ESRS E4', titulo: 'Biodiversidad y ecosistemas', obligatorio: false,
    requerimientos: [
      { id: 'e4_1', texto: 'Impacto en biodiversidad de operaciones propias', categoria: 'Operaciones', peso: 1 },
    ]
  },
  {
    standard: 'ESRS E5', titulo: 'Uso de recursos y economía circular', obligatorio: false,
    requerimientos: [
      { id: 'e5_1', texto: 'Gestión de residuos y tasa de reciclaje', categoria: 'Métricas', peso: 2 },
      { id: 'e5_2', texto: 'Estrategia de economía circular documentada', categoria: 'Estrategia', peso: 1 },
    ]
  },
  {
    standard: 'ESRS S1', titulo: 'Fuerza laboral propia', obligatorio: true,
    requerimientos: [
      { id: 's1_1', texto: 'Políticas de condiciones laborales y salud ocupacional', categoria: 'Gobernanza', peso: 2 },
      { id: 's1_2', texto: 'Métricas de diversidad, equidad e inclusión', categoria: 'Métricas', peso: 1 },
      { id: 's1_3', texto: 'Remuneración justa y brecha salarial de género', categoria: 'Métricas', peso: 1 },
    ]
  },
  {
    standard: 'ESRS G1', titulo: 'Conducta empresarial', obligatorio: true,
    requerimientos: [
      { id: 'g1_1', texto: 'Política anticorrupción y antisoborno documentada', categoria: 'Gobernanza', peso: 2 },
      { id: 'g1_2', texto: 'Canal de denuncias (whistleblowing) operativo', categoria: 'Gobernanza', peso: 1 },
      { id: 'g1_3', texto: 'Código de conducta para proveedores', categoria: 'Cadena de valor', peso: 1 },
    ]
  },
]

const ROADMAP_FASES = [
  {
    fase: 'Fase 0', titulo: 'Diagnóstico base', plazo: 'Inmediato', color: 'brand',
    acciones: ['Completar diagnóstico de huella de carbono (Alcances 1, 2 y 3) ✓', 'Identificar brechas vs requerimientos ESRS E1', 'Nombrar responsable de sostenibilidad en la empresa']
  },
  {
    fase: 'Fase 1', titulo: 'Fundamentos', plazo: '1–3 meses', color: 'purple',
    acciones: ['Documentar política de cambio climático y objetivos de reducción', 'Implementar sistema de registro mensual de emisiones', 'Establecer baseline de métricas ESRS E1 requeridas', 'Política anticorrupción y código de conducta proveedores']
  },
  {
    fase: 'Fase 2', titulo: 'Reporte inicial', plazo: '3–6 meses', color: 'amber',
    acciones: ['Primer reporte de sostenibilidad alineado a ESRS E1', 'Análisis de riesgos climáticos (físicos y de transición)', 'Plan de transición baja en carbono con hitos anuales', 'Métricas laborales y diversidad (ESRS S1)']
  },
  {
    fase: 'Fase 3', titulo: 'Cumplimiento completo', plazo: '6–12 meses', color: 'green',
    acciones: ['Verificación externa del reporte (auditor ISO 14064-3)', 'Publicación del reporte en formato XBRL (estándar UE)', 'Integrar ESRS E2–E5 según materialidad', 'Preparar para auditoría CSRD si aplica obligatoriedad']
  },
]

const ESRS_PILLARS = [
  { id: 'cross', label: 'Transversales', color: 'bg-slate-100 border-slate-300 text-slate-700', dot: 'bg-slate-400', standards: ['ESRS 1 — Requisitos generales', 'ESRS 2 — Divulgaciones generales'], desc: 'Base metodológica para todos los reportes ESRS' },
  { id: 'env',   label: 'Medioambiente', color: 'bg-brand-50 border-brand-200 text-brand-400',  dot: 'bg-brand-300', standards: ['E1 — Cambio climático ★', 'E2 — Contaminación', 'E3 — Recursos hídricos', 'E4 — Biodiversidad', 'E5 — Economía circular'], desc: 'E1 es obligatorio para todas las empresas bajo CSRD' },
  { id: 'social', label: 'Social',       color: 'bg-purple-50 border-purple-200 text-purple-700', dot: 'bg-purple-400', standards: ['S1 — Fuerza laboral ★', 'S2 — Trabajadores cadena', 'S3 — Comunidades', 'S4 — Consumidores'], desc: 'S1 es obligatorio para empresas con más de 250 empleados' },
  { id: 'gov',   label: 'Gobernanza',   color: 'bg-amber-50 border-amber-200 text-amber-700',   dot: 'bg-amber-400', standards: ['G1 — Conducta empresarial ★'], desc: 'G1 es obligatorio — anticorrupción y cadena de valor' },
]

const CHECKLIST_ITEMS = [
  { id: 'c1', categoria: 'E1 — Clima', texto: 'Hemos medido nuestras emisiones GHG (Alcances 1 y 2)', peso: 3 },
  { id: 'c2', categoria: 'E1 — Clima', texto: 'Tenemos objetivo de reducción de emisiones con fecha límite', peso: 3 },
  { id: 'c3', categoria: 'E1 — Clima', texto: 'Existe una política de cambio climático documentada', peso: 2 },
  { id: 'c4', categoria: 'E1 — Clima', texto: 'Medimos emisiones de Alcance 3 (cadena de valor)', peso: 2 },
  { id: 'c5', categoria: 'G1 — Gobernanza', texto: 'Tenemos política anticorrupción documentada', peso: 2 },
  { id: 'c6', categoria: 'G1 — Gobernanza', texto: 'Existe canal de denuncias operativo', peso: 1 },
  { id: 'c7', categoria: 'G1 — Gobernanza', texto: 'Código de conducta para proveedores vigente', peso: 1 },
  { id: 'c8', categoria: 'S1 — Social', texto: 'Métricas de salud y seguridad ocupacional disponibles', peso: 2 },
  { id: 'c9', categoria: 'S1 — Social', texto: 'Datos de diversidad e inclusión registrados', peso: 1 },
  { id: 'c10', categoria: 'E5 — Circular', texto: 'Sistema de gestión de residuos con métricas de reciclaje', peso: 1 },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function evaluarCumplimiento(calculo, respuestas) {
  const e = {}
  e['e1_1'] = (calculo?.alcance1 > 0 || calculo?.alcance2 > 0) ? 'cumple' : 'no_cumple'
  e['e1_2'] = respuestas?.['a2_metas_sostenibilidad']?.includes('política') ? 'parcial' : 'no_cumple'
  e['e1_3'] = 'no_cumple'
  e['e1_4'] = 'no_cumple'
  e['e1_5'] = respuestas?.['a2_metas_sostenibilidad']?.includes('política') ? 'parcial' : 'no_cumple'
  e['e1_6'] = respuestas?.['a2_numero_empleados'] ? 'parcial' : 'no_cumple'
  e['e2_1'] = 'no_cumple'; e['e2_2'] = 'no_cumple'
  e['e3_1'] = 'no_cumple'; e['e3_2'] = 'no_cumple'
  e['e4_1'] = 'no_cumple'
  e['e5_1'] = respuestas?.['a3_residuos_cantidad']?.includes('Reciclaje') ? 'parcial' : 'no_cumple'
  e['e5_2'] = 'no_cumple'
  e['s1_1'] = 'no_cumple'; e['s1_2'] = 'no_cumple'; e['s1_3'] = 'no_cumple'
  e['g1_1'] = 'no_cumple'; e['g1_2'] = 'no_cumple'
  e['g1_3'] = respuestas?.['a3_compras_proveedores'] ? 'parcial' : 'no_cumple'
  return e
}

function calcularScore(estados) {
  let total = 0, cumplidos = 0, parciales = 0
  ESRS_REQUIREMENTS.forEach(s => s.requerimientos.forEach(r => {
    total += r.peso
    if (estados[r.id] === 'cumple') cumplidos += r.peso
    if (estados[r.id] === 'parcial') parciales += r.peso * 0.5
  }))
  return Math.round(((cumplidos + parciales) / total) * 100)
}

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────
async function generarPDFGapAnalysis({ data, estados, scoreCSRD, totalCumple, totalParciales, totalBrechas }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, margin = 18
  let y = 0

  doc.setFillColor(29, 158, 117)
  doc.rect(0, 0, W, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text('EcoMetriX - Analisis CSRD / ESRS', margin, 12)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('Corporate Sustainability Reporting Directive - UE 2022/2464', margin, 20)
  doc.text(new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }), W - margin, 20, { align: 'right' })

  y = 38
  if (data?.empresa?.nombre) {
    doc.setTextColor(28, 25, 23)
    doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.text(data.empresa.nombre, margin, y)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(87, 83, 78)
    doc.text(`${data.empresa.sector || ''} - ${data.empresa.tamano || ''} - ${data.empresa.pais || ''}`, margin, y + 6)
    y += 16
  }

  doc.setFillColor(240, 253, 244)
  doc.roundedRect(margin, y, W - margin * 2, 22, 3, 3, 'F')
  doc.setTextColor(29, 158, 117); doc.setFontSize(22); doc.setFont('helvetica', 'bold')
  doc.text(`${scoreCSRD}%`, margin + 8, y + 14)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(87, 83, 78)
  doc.text('Preparacion CSRD', margin + 24, y + 10)
  doc.setTextColor(29, 158, 117); doc.text(`${totalCumple} cumple`, margin + 70, y + 8)
  doc.setTextColor(180, 83, 9); doc.text(`${totalParciales} parcial`, margin + 100, y + 8)
  doc.setTextColor(185, 28, 28); doc.text(`${totalBrechas} brechas`, margin + 130, y + 8)
  y += 30

  doc.setTextColor(28, 25, 23); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('Gap Analysis - Requerimientos ESRS', margin, y); y += 8

  ESRS_REQUIREMENTS.forEach(s => {
    if (y > 260) { doc.addPage(); y = 20 }
    const cumplidos = s.requerimientos.filter(r => estados[r.id] === 'cumple').length
    const parciales = s.requerimientos.filter(r => estados[r.id] === 'parcial').length
    const pct = Math.round(((cumplidos + parciales * 0.5) / s.requerimientos.length) * 100)
    doc.setFillColor(249, 250, 251)
    doc.rect(margin, y, W - margin * 2, 8, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(28, 25, 23)
    doc.text(`${s.standard} - ${s.titulo}`, margin + 2, y + 5.5)
    doc.setFontSize(8); doc.setTextColor(29, 158, 117)
    doc.text(`${pct}%`, W - margin - 2, y + 5.5, { align: 'right' })
    if (s.obligatorio) {
      doc.setFillColor(254, 226, 226); doc.roundedRect(W - margin - 30, y + 1, 22, 5, 1, 1, 'F')
      doc.setFontSize(7); doc.setTextColor(185, 28, 28); doc.text('Obligatorio', W - margin - 29, y + 4.8)
    }
    y += 10
    s.requerimientos.forEach(r => {
      if (y > 272) { doc.addPage(); y = 20 }
      const estado = estados[r.id]
      const dot = estado === 'cumple' ? [29, 158, 117] : estado === 'parcial' ? [217, 119, 6] : [220, 38, 38]
      doc.setFillColor(...dot); doc.circle(margin + 2, y + 2, 1.2, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 81)
      const lines = doc.splitTextToSize(r.texto, W - margin * 2 - 12)
      doc.text(lines, margin + 6, y + 2.5)
      const label = estado === 'cumple' ? 'Cumple' : estado === 'parcial' ? 'Parcial' : 'Brecha'
      doc.setFontSize(7); doc.setTextColor(...dot)
      doc.text(label, W - margin - 2, y + 2.5, { align: 'right' })
      y += lines.length * 4.5 + 1
    })
    y += 4
  })

  if (y > 220) { doc.addPage(); y = 20 }
  doc.setTextColor(28, 25, 23); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('Roadmap hacia cumplimiento CSRD', margin, y); y += 8

  ROADMAP_FASES.forEach(f => {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 158, 117)
    doc.text(`${f.fase} - ${f.titulo}`, margin, y)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128)
    doc.text(f.plazo, W - margin, y, { align: 'right' })
    y += 5
    f.acciones.forEach(a => {
      if (y > 272) { doc.addPage(); y = 20 }
      const lines = doc.splitTextToSize(`-> ${a}`, W - margin * 2 - 4)
      doc.setTextColor(55, 65, 81)
      doc.text(lines, margin + 3, y)
      y += lines.length * 4.5
    })
    y += 5
  })

  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(29, 158, 117)
    doc.rect(0, 287, W, 10, 'F')
    doc.setFontSize(7); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal')
    doc.text('EcoMetriX - GHG Protocol + ISO 14064 - ecometrix-app-one.vercel.app', W / 2, 293, { align: 'center' })
    doc.text(`${i} / ${pages}`, W - margin, 293, { align: 'right' })
  }

  const nombre = data?.empresa?.nombre?.replace(/\s+/g, '_') || 'empresa'
  doc.save(`EcoMetriX_CSRD_GapAnalysis_${nombre}.pdf`)
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function StatusIcon({ estado }) {
  if (estado === 'cumple') return <div className="w-5 h-5 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center"><IconCheck /></div>
  if (estado === 'parcial') return <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center"><IconMinus /></div>
  return <div className="w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center"><IconX /></div>
}

function StatusBadge({ estado, t }) {
  if (estado === 'cumple')  return <span className="badge-green text-xs">{t('csrd.compliant')}</span>
  if (estado === 'parcial') return <span className="bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-0.5 text-xs font-medium">{t('csrd.partial')}</span>
  return <span className="bg-red-50 text-red-700 border border-red-100 rounded-full px-2 py-0.5 text-xs font-medium">{t('csrd.notCompliant')}</span>
}

function StandardCard({ standard, titulo, obligatorio, requerimientos, estados }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(standard === 'ESRS E1')
  const cumplidos = requerimientos.filter(r => estados[r.id] === 'cumple').length
  const parciales = requerimientos.filter(r => estados[r.id] === 'parcial').length
  const total = requerimientos.length
  const pct = Math.round(((cumplidos + parciales * 0.5) / total) * 100)

  return (
    <div className="card">
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-text-primary">{standard}</span>
              {obligatorio && <span className="bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 text-xs font-medium">{t('csrd.mandatory')}</span>}
            </div>
            <p className="text-sm text-text-secondary">{titulo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold text-text-primary">{pct}%</p>
            <p className="text-xs text-text-muted">{cumplidos}/{total} req.</p>
          </div>
          <span className="text-text-muted text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-surface-tertiary rounded-full overflow-hidden mt-3">
        <div className="h-full bg-brand-300 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      {expanded && (
        <div className="mt-4 space-y-2.5 pt-4 border-t border-border">
          {requerimientos.map(r => (
            <div key={r.id} className="flex items-start gap-3">
              <StatusIcon estado={estados[r.id]} />
              <div className="flex-1">
                <p className="text-sm text-text-primary">{r.texto}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge-gray text-xs">{r.categoria}</span>
                  <StatusBadge estado={estados[r.id]} t={t} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RoadmapItem({ fase, titulo, plazo, color, acciones }) {
  const colorMap = {
    brand:  { dot: 'bg-brand-300',  label: 'text-brand-400',  bg: 'bg-brand-50',  border: 'border-brand-200' },
    purple: { dot: 'bg-purple-500', label: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    amber:  { dot: 'bg-amber-500',  label: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
    green:  { dot: 'bg-brand-400',  label: 'text-brand-400',  bg: 'bg-brand-50',  border: 'border-brand-100' },
  }
  const c = colorMap[color] || colorMap.brand
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full ${c.dot} flex-shrink-0 mt-1`} />
        <div className="w-px flex-1 bg-border mt-2" />
      </div>
      <div className={`flex-1 pb-6 p-4 rounded-xl border ${c.border} ${c.bg} mb-4`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wide ${c.label}`}>{fase}</span>
            <h3 className="text-sm font-semibold text-text-primary">{titulo}</h3>
          </div>
          <span className="badge-gray text-xs">{plazo}</span>
        </div>
        <ul className="space-y-1.5">
          {acciones.map((a, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={`${c.label} mt-0.5 flex-shrink-0 text-sm`}>→</span>
              <span className="text-xs text-text-secondary">{a}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ESRSPillarsMap() {
  const { t } = useTranslation()
  const [active, setActive] = useState(null)
  return (
    <div className="card mb-6">
      <h2 className="font-semibold text-text-primary mb-1">Marco ESRS — European Sustainability Reporting Standards</h2>
      <p className="text-sm text-text-secondary mb-4">Haz clic en cada pilar para ver los estándares que incluye. Los marcados con ★ son obligatorios.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ESRS_PILLARS.map(p => (
          <button key={p.id} onClick={() => setActive(active === p.id ? null : p.id)}
            className={`text-left p-3 rounded-xl border-2 transition-all ${p.color} ${active === p.id ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${p.dot} mb-2`} />
            <p className="text-xs font-bold uppercase tracking-wide mb-1">{p.label}</p>
            <p className="text-xs opacity-70">{p.standards.length} {t('standards.badge').toLowerCase()}</p>
          </button>
        ))}
      </div>
      {active && (() => {
        const p = ESRS_PILLARS.find(x => x.id === active)
        return (
          <div className={`mt-4 p-4 rounded-xl border ${p.color}`}>
            <p className="text-xs font-semibold mb-2">{p.desc}</p>
            <div className="flex flex-wrap gap-2">
              {p.standards.map(s => <span key={s} className="text-xs bg-white/60 rounded-lg px-2.5 py-1 font-medium">{s}</span>)}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function ManualChecklist() {
  const { t } = useTranslation()
  const [checked, setChecked] = useState({})
  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  const score = Math.round(
    CHECKLIST_ITEMS.filter(i => checked[i.id]).reduce((a, i) => a + i.peso, 0) /
    CHECKLIST_ITEMS.reduce((a, i) => a + i.peso, 0) * 100
  )
  const categorias = [...new Set(CHECKLIST_ITEMS.map(i => i.categoria))]
  return (
    <div className="card mb-6 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-text-primary">{t('csrd.gapAnalysis')}</h2>
          <p className="text-sm text-text-secondary">{t('csrd.gapAnalysisDesc')}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-400">{score}%</p>
          <p className="text-xs text-text-muted">{t('csrd.readinessScore')}</p>
        </div>
      </div>
      <div className="w-full h-2 bg-surface-tertiary rounded-full mb-5">
        <div className="h-2 bg-brand-300 rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
      </div>
      {categorias.map(cat => (
        <div key={cat} className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">{cat}</p>
          <div className="space-y-2">
            {CHECKLIST_ITEMS.filter(i => i.categoria === cat).map(item => (
              <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${checked[item.id] ? 'bg-brand-300 border-brand-300' : 'border-border group-hover:border-brand-300'}`}
                  onClick={() => toggle(item.id)}>
                  {checked[item.id] && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className={`text-sm transition-colors ${checked[item.id] ? 'text-text-muted line-through' : 'text-text-primary'}`}>{item.texto}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CTAUpgrade() {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-400 to-brand-300 p-6 text-white mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">Plan Pro / Enterprise</p>
          <h3 className="text-lg font-bold mb-2">{t('csrd.title')} completo con EcoMetriX</h3>
          <ul className="space-y-1.5 mb-4">
            {[
              'Diagnósticos mensuales ilimitados con trazabilidad',
              'Reporte CSRD/ESRS E1 listo para auditor externo',
              'Export XBRL para presentación ante reguladores',
              'Verificación externa con auditores certificados'
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {f}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 flex-wrap">
            <a href="/pricing" className="bg-white text-brand-400 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors">{t('pricing.badge')} →</a>
            <a href="mailto:oscar@ecometrix.co" className="bg-white/20 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">{t('pricing.contactSales')}</a>
          </div>
        </div>
        <span className="text-5xl flex-shrink-0 hidden sm:block">🏆</span>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function CSRD() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('gap')
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('ecometrix_result')
    if (stored) setData(JSON.parse(stored))
  }, [])

  const estados = data ? evaluarCumplimiento(data.calculo, data.respuestas) : {}
  const scoreCSRD = data ? calcularScore(estados) : 0
  const totalBrechas  = Object.values(estados).filter(e => e === 'no_cumple').length
  const totalParciales = Object.values(estados).filter(e => e === 'parcial').length
  const totalCumple   = Object.values(estados).filter(e => e === 'cumple').length

  async function handleExportPDF() {
    setPdfLoading(true)
    try {
      await generarPDFGapAnalysis({ data, estados, scoreCSRD, totalCumple, totalParciales, totalBrechas })
    } catch (err) {
      console.error(err)
      alert('Error generando PDF. Intenta de nuevo.')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-brand-400 font-semibold text-sm">EcoMetriX</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="btn-ghost text-sm py-1.5 px-3">← Dashboard</Link>
            <Link to="/questionnaire" className="btn-primary text-sm py-1.5 px-3">{t('dashboard.newDiagnosis')}</Link>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <IconEU />
              <div>
                <h1 className="text-lg font-bold text-text-primary">{t('csrd.badge')}</h1>
                <p className="text-sm text-text-secondary">
                  {data ? `${data.empresa.nombre} · ` : ''}{t('csrd.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-400">{scoreCSRD}%</p>
                <p className="text-xs text-text-muted">{t('csrd.readinessScore')}</p>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-300" />{totalCumple} {t('csrd.compliant')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />{totalParciales} {t('csrd.partial')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />{totalBrechas} brecha</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            {[['gap', t('csrd.gapAnalysis')], ['roadmap', t('csrd.roadmap')], ['export', t('csrd.downloadPDF')]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-brand-50 text-brand-400 border border-brand-200' : 'text-text-secondary hover:bg-surface-tertiary'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!data && (
          <div className="card mb-6 border-amber-200 bg-amber-50">
            <p className="text-sm text-amber-700 font-medium mb-2">⚠ No hay diagnóstico activo</p>
            <p className="text-sm text-amber-600 mb-3">Completa primero el cuestionario de huella de carbono para ver tu análisis CSRD personalizado.</p>
            <Link to="/questionnaire" className="btn-primary text-sm py-2 px-4">{t('dashboard.newDiagnosis')}</Link>
          </div>
        )}

        {tab === 'gap' && (
          <>
            <div className="card mb-6 border-blue-200 bg-blue-50">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🇪🇺</span>
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">¿Qué es la CSRD?</p>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    La <strong>Corporate Sustainability Reporting Directive</strong> (UE 2022/2464) obliga a empresas europeas y filiales de multinacionales a reportar sobre sostenibilidad usando los estándares ESRS. Las PYMEs que son proveedoras de grandes empresas europeas ya reciben presión para cumplir con ESRS E1.
                  </p>
                  <p className="text-sm text-blue-700 mt-2"><strong>Colombia:</strong> No hay obligatoriedad aún, pero clientes europeos cada vez más la exigen como requisito de proveeduría.</p>
                </div>
              </div>
            </div>
            <ESRSPillarsMap />
            {!data && <ManualChecklist />}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card text-center border-brand-200">
                <p className="text-3xl font-bold text-brand-400 mb-1">{totalCumple}</p>
                <p className="text-xs text-text-secondary">{t('csrd.compliant')}</p>
              </div>
              <div className="card text-center border-amber-200">
                <p className="text-3xl font-bold text-amber-600 mb-1">{totalParciales}</p>
                <p className="text-xs text-text-secondary">{t('csrd.partial')}</p>
              </div>
              <div className="card text-center border-red-200">
                <p className="text-3xl font-bold text-red-600 mb-1">{totalBrechas}</p>
                <p className="text-xs text-text-secondary">{t('csrd.notCompliant')}</p>
              </div>
            </div>
            <div className="space-y-4">
              {ESRS_REQUIREMENTS.map(s => <StandardCard key={s.standard} {...s} estados={estados} />)}
            </div>
          </>
        )}

        {tab === 'roadmap' && (
          <div>
            <div className="card mb-6">
              <h2 className="font-semibold text-text-primary mb-1">{t('csrd.roadmap')}</h2>
              <p className="text-sm text-text-secondary mb-4">{t('csrd.roadmapDesc')}</p>
              <div className="w-full bg-surface-tertiary rounded-full h-2 mb-2">
                <div className="bg-brand-300 h-2 rounded-full" style={{ width: `${scoreCSRD}%` }} />
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>Posición actual: {scoreCSRD}%</span>
                <span>Meta: 100% ESRS E1 ({t('csrd.mandatory')})</span>
              </div>
            </div>
            <div>{ROADMAP_FASES.map(f => <RoadmapItem key={f.fase} {...f} />)}</div>
          </div>
        )}

        {tab === 'export' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-text-primary mb-1">{t('csrd.downloadPDF')}</h2>
              <p className="text-sm text-text-secondary mb-6">Prepara tu información para reportes formales y auditorías externas.</p>
              <div className="space-y-3">
                <div onClick={handleExportPDF}
                  className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-brand-200 hover:bg-brand-50 cursor-pointer transition-all">
                  <span className="text-2xl flex-shrink-0">📄</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-text-primary">Reporte de brechas ESRS</span>
                      <span className="badge-gray text-xs">PDF</span>
                    </div>
                    <p className="text-xs text-text-secondary">Gap analysis completo + roadmap personalizado para presentar a auditores o clientes</p>
                  </div>
                  {pdfLoading ? (
                    <span className="w-4 h-4 border-2 border-brand-300 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-1" />
                  ) : (
                    <span className="text-brand-400 text-sm font-medium flex-shrink-0">Exportar →</span>
                  )}
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl border border-dashed border-border opacity-50">
                  <span className="text-2xl flex-shrink-0">🗂</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-text-primary">Export formato XBRL</span>
                      <span className="badge-gray text-xs">XBRL</span>
                      <span className="bg-surface-tertiary text-text-muted rounded-full px-2 py-0.5 text-xs">{t('landing.standards.coming')}</span>
                    </div>
                    <p className="text-xs text-text-secondary">Formato estándar de la UE para reportes CSRD — requiere verificación externa</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card border-dashed">
              <p className="text-sm font-medium text-text-primary mb-2">Nota metodológica</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Este análisis CSRD es una evaluación preliminar basada en los datos de tu diagnóstico de huella de carbono. Para cumplimiento formal con la CSRD, se requiere verificación por un auditor externo acreditado (ISO 14064-3 o equivalente). EcoMetriX puede conectarte con verificadores acreditados — <a href="mailto:oscar@ecometrix.co" className="text-brand-400 hover:underline">oscar@ecometrix.co</a>
              </p>
            </div>
          </div>
        )}

        <CTAUpgrade />
      </main>
    </div>
  )
}
