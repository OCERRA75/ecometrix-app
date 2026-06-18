// src/pages/Standards.jsx
// M17 — Tabla comparativa + CDP, SBTi v2, EU Taxonomy
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const STANDARDS = [
  {
    id: 'ghg', nombre: 'GHG Protocol', org: 'WRI / WBCSD', año: '2001', tipo: 'Marco metodológico', color: 'brand', logo: '🌍',
    aplicable: { micro: true, pequena: true, mediana: true, grande: true },
    descripcion: 'El estándar más usado globalmente para medir y gestionar emisiones de gases de efecto invernadero. Base de prácticamente todos los demás marcos.',
    features: { 'Alcances 1, 2 y 3': true, 'Certificación externa': false, 'Reporte público': false, 'Obligatorio UE': false, 'Incluye cadena de valor': true, 'Targets de reducción': false, 'Reporte financiero integrado': false, 'Soporte PYME': true, 'Aplica 1.5°C': false },
    ventajas: ['Metodología universal', 'Gratuito y abierto', 'Base para ISO 14064 y CSRD'],
    limitaciones: ['No certificable directamente', 'Sin formato estándar de reporte'],
    ecometrix: 'Núcleo del cálculo — todos los diagnósticos usan GHG Protocol',
    module: null,
  },
  {
    id: 'iso14064', nombre: 'ISO 14064', org: 'ISO', año: '2006 / rev. 2018', tipo: 'Norma certificable', color: 'blue', logo: '📋',
    aplicable: { micro: false, pequena: true, mediana: true, grande: true },
    descripcion: 'Norma internacional certificable para cuantificación, monitoreo, reporte y verificación de emisiones GHG. Tres partes: organizaciones, proyectos y validación.',
    features: { 'Alcances 1, 2 y 3': true, 'Certificación externa': true, 'Reporte público': false, 'Obligatorio UE': false, 'Incluye cadena de valor': true, 'Targets de reducción': false, 'Reporte financiero integrado': false, 'Soporte PYME': true, 'Aplica 1.5°C': false },
    ventajas: ['Certificable por terceros', 'Reconocida internacionalmente', 'Requerida por clientes corporativos'],
    limitaciones: ['Costo de certificación', 'Proceso largo (3-6 meses)'],
    ecometrix: 'Los reportes de EcoMetriX siguen metodología compatible con ISO 14064-1',
    module: null,
  },
  {
    id: 'csrd', nombre: 'CSRD / ESRS', org: 'Unión Europea', año: '2023', tipo: 'Regulación obligatoria', color: 'purple', logo: '🇪🇺',
    aplicable: { micro: false, pequena: false, mediana: true, grande: true },
    descripcion: 'Corporate Sustainability Reporting Directive — directiva europea que obliga a reportar sostenibilidad usando los ESRS. Afecta proveedores de empresas europeas.',
    features: { 'Alcances 1, 2 y 3': true, 'Certificación externa': true, 'Reporte público': true, 'Obligatorio UE': true, 'Incluye cadena de valor': true, 'Targets de reducción': true, 'Reporte financiero integrado': true, 'Soporte PYME': false, 'Aplica 1.5°C': false },
    ventajas: ['Estándar de facto para exportadores', 'Integra aspectos E, S y G', 'Reconocido por inversores europeos'],
    limitaciones: ['Muy complejo para PYMEs', 'Requiere auditor externo', 'Alto costo de implementación'],
    ecometrix: 'Módulo CSRD de EcoMetriX prepara el gap analysis y roadmap hacia cumplimiento',
    module: '/csrd',
  },
  {
    id: 'gri', nombre: 'GRI Standards', org: 'Global Reporting Initiative', año: '1997 / v. 2021', tipo: 'Marco de reporte', color: 'amber', logo: '📊',
    aplicable: { micro: false, pequena: true, mediana: true, grande: true },
    descripcion: 'El marco más usado para reporte de sostenibilidad integral (ESG). Cubre aspectos económicos, ambientales y sociales. Muy usado por grandes empresas y cotizadas.',
    features: { 'Alcances 1, 2 y 3': true, 'Certificación externa': false, 'Reporte público': true, 'Obligatorio UE': false, 'Incluye cadena de valor': true, 'Targets de reducción': true, 'Reporte financiero integrado': false, 'Soporte PYME': false, 'Aplica 1.5°C': false },
    ventajas: ['Marco ESG completo', 'Reconocido por inversores globales', 'Integra dimensión social'],
    limitaciones: ['No certificable', 'Muy extenso para PYMEs', 'Sin metodología de cálculo propia'],
    ecometrix: 'Los datos de EcoMetriX son compatibles con los indicadores GRI 305 (Emisiones)',
    module: null,
  },
  {
    id: 'sbti', nombre: 'Science Based Targets', org: 'SBTi', año: '2015 / v2 2024', tipo: 'Marco de objetivos', color: 'green', logo: '🎯',
    aplicable: { micro: false, pequena: true, mediana: true, grande: true },
    descripcion: 'Iniciativa para que empresas fijen objetivos de reducción de emisiones alineados con la ciencia climática (1.5°C del Acuerdo de París). Muy valorado por inversores y grandes clientes.',
    features: { 'Alcances 1, 2 y 3': true, 'Certificación externa': true, 'Reporte público': true, 'Obligatorio UE': false, 'Incluye cadena de valor': true, 'Targets de reducción': true, 'Reporte financiero integrado': false, 'Soporte PYME': true, 'Aplica 1.5°C': true },
    ventajas: ['Objetivos validados científicamente', 'Diferenciador ante clientes e inversores', 'Ruta SME simplificada disponible'],
    limitaciones: ['Requiere compromiso de largo plazo', 'Verificación cada 5 años', 'Solo aplica si tienes baseline medido'],
    ecometrix: 'El diagnóstico de EcoMetriX genera el baseline necesario para aplicar a SBTi',
    module: '/sbti',
    nuevo: true,
  },
  {
    id: 'cdp', nombre: 'CDP Climate', org: 'CDP (Carbon Disclosure Project)', año: '2000', tipo: 'Marco de reporte', color: 'teal', logo: '🏦',
    aplicable: { micro: false, pequena: false, mediana: true, grande: true },
    descripcion: 'El sistema de divulgación ambiental más usado por inversores institucionales. Más de 23,000 empresas reportan a CDP. Cubre clima, agua y bosques. Score A-F para inversores.',
    features: { 'Alcances 1, 2 y 3': true, 'Certificación externa': false, 'Reporte público': true, 'Obligatorio UE': false, 'Incluye cadena de valor': true, 'Targets de reducción': true, 'Reporte financiero integrado': false, 'Soporte PYME': false, 'Aplica 1.5°C': true },
    ventajas: ['Requerido por inversores institucionales', 'Score público comparable', 'Alineado con TCFD y CSRD'],
    limitaciones: ['Proceso de reporte complejo', 'Costo de membresía', 'Principalmente para empresas grandes o cotizadas'],
    ecometrix: 'Los datos de EcoMetriX cubren las métricas clave de CDP Climate (C6-C7 emisiones)',
    module: null,
    nuevo: true,
  },
  {
    id: 'eutaxonomy', nombre: 'EU Taxonomy', org: 'Unión Europea', año: '2020', tipo: 'Regulación obligatoria', color: 'indigo', logo: '🌿',
    aplicable: { micro: false, pequena: false, mediana: true, grande: true },
    descripcion: 'Sistema de clasificación de la UE que define qué actividades económicas son ambientalmente sostenibles. Obligatorio para empresas sujetas a CSRD y fondos de inversión europeos.',
    features: { 'Alcances 1, 2 y 3': false, 'Certificación externa': true, 'Reporte público': true, 'Obligatorio UE': true, 'Incluye cadena de valor': false, 'Targets de reducción': true, 'Reporte financiero integrado': true, 'Soporte PYME': false, 'Aplica 1.5°C': true },
    ventajas: ['Acceso a financiamiento verde europeo', 'Credencial para inversores ESG', 'Complementa CSRD/ESRS'],
    limitaciones: ['Solo aplica a 6 objetivos ambientales UE', 'Requiere DNSH (Do No Significant Harm) para cada actividad', 'Alta complejidad técnica'],
    ecometrix: 'EcoMetriX prepara los datos de emisiones y energía requeridos para la evaluación EU Taxonomy',
    module: null,
    nuevo: true,
  },
]

const FEATURES = [
  'Alcances 1, 2 y 3', 'Certificación externa', 'Reporte público', 'Obligatorio UE',
  'Incluye cadena de valor', 'Targets de reducción', 'Reporte financiero integrado', 'Soporte PYME', 'Aplica 1.5°C',
]

const SIZE_OPTIONS = [
  { id: 'micro',   labelKey: 'standards.micro' },
  { id: 'pequena', labelKey: 'standards.small' },
  { id: 'mediana', labelKey: 'standards.medium' },
  { id: 'grande',  labelKey: 'standards.large' },
]

const COLOR_MAP = {
  brand:  { badge: 'bg-brand-50 text-brand-400 border-brand-200',       header: 'bg-brand-50',   dot: 'bg-brand-300'  },
  blue:   { badge: 'bg-blue-50 text-blue-700 border-blue-200',          header: 'bg-blue-50',    dot: 'bg-blue-400'   },
  purple: { badge: 'bg-purple-50 text-purple-700 border-purple-200',    header: 'bg-purple-50',  dot: 'bg-purple-400' },
  amber:  { badge: 'bg-amber-50 text-amber-700 border-amber-200',       header: 'bg-amber-50',   dot: 'bg-amber-400'  },
  green:  { badge: 'bg-green-50 text-green-700 border-green-200',       header: 'bg-green-50',   dot: 'bg-green-400'  },
  teal:   { badge: 'bg-teal-50 text-teal-700 border-teal-200',          header: 'bg-teal-50',    dot: 'bg-teal-400'   },
  indigo: { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',    header: 'bg-indigo-50',  dot: 'bg-indigo-400' },
}

async function generarPDFComparativa(standards) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297, margin = 14
  let y = 0

  doc.setFillColor(29, 158, 117)
  doc.rect(0, 0, W, 24, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14); doc.setFont('helvetica', 'bold')
  doc.text('EcoMetriX - Comparativa de Estandares de Sostenibilidad', margin, 10)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text('GHG Protocol - ISO 14064 - CSRD/ESRS - GRI - SBTi - CDP - EU Taxonomy', margin, 18)
  doc.text(new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }), W - margin, 18, { align: 'right' })

  y = 32
  const colW = (W - margin * 2 - 48) / standards.length
  const labelW = 48

  doc.setFillColor(249, 250, 251)
  doc.rect(margin, y, W - margin * 2, 14, 'F')
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(107, 114, 128)
  doc.text('CARACTERISTICA', margin + 2, y + 9)
  standards.forEach((std, i) => {
    const x = margin + labelW + i * colW
    doc.setTextColor(28, 25, 23); doc.setFontSize(7)
    doc.text(std.nombre, x + colW / 2, y + 6, { align: 'center' })
    doc.setFontSize(6); doc.setTextColor(107, 114, 128)
    doc.text(std.org.split(' ')[0], x + colW / 2, y + 11, { align: 'center' })
  })
  y += 16

  FEATURES.forEach((feature, fi) => {
    if (y > 185) { doc.addPage(); y = 20 }
    if (fi % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y, W - margin * 2, 8, 'F') }
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 81)
    doc.text(feature, margin + 2, y + 5.5)
    standards.forEach((std, i) => {
      const x = margin + labelW + i * colW + colW / 2
      if (std.features[feature]) {
        doc.setTextColor(29, 158, 117); doc.setFontSize(9); doc.text('✓', x, y + 5.5, { align: 'center' })
      } else {
        doc.setTextColor(220, 38, 38); doc.setFontSize(9); doc.text('✗', x, y + 5.5, { align: 'center' })
      }
    })
    y += 8
  })

  y += 2
  doc.setFillColor(240, 253, 244); doc.rect(margin, y, W - margin * 2, 8, 'F')
  doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 158, 117)
  doc.text('EcoMetriX:', margin + 2, y + 5.5)
  standards.forEach((std, i) => {
    const x = margin + labelW + i * colW
    doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 81)
    const lines = doc.splitTextToSize(std.ecometrix.split('—')[0].trim(), colW - 2)
    doc.text(lines[0] || '', x + 1, y + 5.5)
  })
  y += 14

  doc.addPage(); y = 20
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(28, 25, 23)
  doc.text('Descripcion detallada', margin, y); y += 10

  standards.forEach(std => {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(28, 25, 23)
    doc.text(`${std.nombre}`, margin, y)
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128)
    doc.text(`${std.org} · ${std.año} · ${std.tipo}`, margin, y + 4)
    y += 9
    doc.setFontSize(7.5); doc.setTextColor(55, 65, 81)
    const descLines = doc.splitTextToSize(std.descripcion, W - margin * 2)
    doc.text(descLines, margin, y); y += descLines.length * 3.8 + 2
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 158, 117)
    doc.text('+ ', margin, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 81)
    doc.text(std.ventajas.join('  ·  '), margin + 4, y); y += 4
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(220, 38, 38)
    doc.text('- ', margin, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 81)
    doc.text(std.limitaciones.join('  ·  '), margin + 4, y); y += 6
    doc.setFillColor(240, 253, 244); doc.roundedRect(margin, y, W - margin * 2, 7, 1, 1, 'F')
    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 158, 117)
    doc.text('EcoMetriX: ', margin + 2, y + 4.5)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 81)
    doc.text(std.ecometrix, margin + 20, y + 4.5); y += 12
  })

  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(29, 158, 117); doc.rect(0, 203, W, 7, 'F')
    doc.setFontSize(6.5); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal')
    doc.text('EcoMetriX · GHG Protocol + ISO 14064 + CSRD + SBTi + CDP + EU Taxonomy · ecometrix-app-one.vercel.app', W / 2, 207.5, { align: 'center' })
    doc.text(`${i} / ${pages}`, W - margin, 207.5, { align: 'right' })
  }

  doc.save('EcoMetriX_Comparativa_Estandares_M17.pdf')
}

function FeatureIcon({ value }) {
  if (value === true) return (
    <div className="flex justify-center">
      <div className="w-5 h-5 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3 text-brand-400">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
  return (
    <div className="flex justify-center">
      <div className="w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3 text-red-400">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}

function StandardCard({ std, expanded, onToggle }) {
  const { t } = useTranslation()
  const c = COLOR_MAP[std.color] || COLOR_MAP.brand
  return (
    <div className={`card cursor-pointer transition-all ${expanded ? 'ring-2 ring-brand-200' : ''}`} onClick={onToggle}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{std.logo}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-text-primary">{std.nombre}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.badge}`}>{std.tipo}</span>
              {std.nuevo && <span className="bg-brand-300 text-white text-xs px-2 py-0.5 rounded-full font-semibold">Nuevo M17</span>}
            </div>
            <p className="text-xs text-text-muted">{std.org} · {std.año}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {std.module && (
            <Link to={std.module} onClick={e => e.stopPropagation()}
              className="text-xs text-brand-400 hover:underline font-medium px-2 py-1 bg-brand-50 rounded-lg border border-brand-200">
              Ver módulo →
            </Link>
          )}
          <span className="text-text-muted text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">{std.descripcion}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{t('standards.advantages')}</p>
              <ul className="space-y-1.5">
                {std.ventajas.map(v => (
                  <li key={v} className="flex items-start gap-2">
                    <span className="text-brand-400 flex-shrink-0 mt-0.5 text-sm">+</span>
                    <span className="text-xs text-text-secondary">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{t('standards.limitations')}</p>
              <ul className="space-y-1.5">
                {std.limitaciones.map(l => (
                  <li key={l} className="flex items-start gap-2">
                    <span className="text-red-400 flex-shrink-0 mt-0.5 text-sm">−</span>
                    <span className="text-xs text-text-secondary">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className={`rounded-xl p-3 ${c.header} border`}>
            <p className="text-xs font-semibold mb-1">🌿 {t('standards.ecometrixCovers')} — {std.nombre}</p>
            <p className="text-xs text-text-secondary">{std.ecometrix}</p>
          </div>
          {std.module && (
            <Link to={std.module} onClick={e => e.stopPropagation()}
              className="block w-full text-center py-2 rounded-xl bg-brand-300 text-white text-sm font-semibold hover:bg-brand-400 transition-colors">
              Abrir módulo {std.nombre} →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default function Standards() {
  const { t } = useTranslation()
  const [view, setView] = useState('cards')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const filtered = STANDARDS.filter(s => {
    if (showNew && !s.nuevo) return false
    if (sizeFilter === 'all') return true
    return s.aplicable[sizeFilter]
  })

  async function handleExportPDF() {
    setPdfLoading(true)
    try { await generarPDFComparativa(filtered) }
    catch (err) { alert('Error generando PDF.') }
    finally { setPdfLoading(false) }
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-brand-400 font-semibold text-sm">EcoMetriX</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/csrd" className="btn-ghost text-sm py-1.5 px-3">{t('csrd.badge')}</Link>
            <Link to="/sbti" className="btn-ghost text-sm py-1.5 px-3">SBTi Calculator</Link>
            <Link to="/diagnostico" className="btn-primary text-sm py-1.5 px-3">{t('landing.ctaPrimary')}</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <span className="badge-green mb-3 inline-block">{t('standards.badge')}</span>
          <h1 className="text-3xl font-bold text-text-primary mb-3">{t('standards.title')}</h1>
          <p className="text-text-secondary max-w-2xl mx-auto">{t('standards.subtitle')}</p>
          <p className="text-xs text-brand-400 mt-2 font-medium">+ CDP Climate · EU Taxonomy · SBTi v2 — Nuevos en M17</p>
        </div>

        {/* Nuevos M17 highlight */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { logo: '🎯', nombre: 'SBTi v2', desc: 'Calculador de objetivos 1.5°C con baseline de tu diagnóstico', link: '/sbti', color: 'green' },
            { logo: '🏦', nombre: 'CDP Climate', desc: 'Prepara tus respuestas para el cuestionario CDP de inversores', link: null, color: 'teal' },
            { logo: '🌿', nombre: 'EU Taxonomy', desc: 'Clasifica tus actividades económicas como sostenibles según la UE', link: null, color: 'indigo' },
          ].map(item => (
            <div key={item.nombre} className={`card border-2 ${item.color === 'green' ? 'border-green-200 bg-green-50' : item.color === 'teal' ? 'border-teal-200 bg-teal-50' : 'border-indigo-200 bg-indigo-50'}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{item.logo}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-text-primary text-sm">{item.nombre}</span>
                    <span className="bg-brand-300 text-white text-xs px-1.5 py-0.5 rounded-full">Nuevo</span>
                  </div>
                  <p className="text-xs text-text-secondary">{item.desc}</p>
                  {item.link ? (
                    <Link to={item.link} className="text-xs text-brand-400 font-semibold mt-2 inline-block hover:underline">Abrir módulo →</Link>
                  ) : (
                    <span className="text-xs text-text-muted mt-2 inline-block">{t('landing.standards.coming')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-text-muted font-medium">{t('standards.applicableTo')}:</span>
            <button onClick={() => setSizeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sizeFilter === 'all' && !showNew ? 'bg-brand-50 text-brand-400 border border-brand-200' : 'bg-white border border-border text-text-secondary hover:bg-surface-tertiary'}`}>
              {t('standards.compareAll')}
            </button>
            {SIZE_OPTIONS.map(s => (
              <button key={s.id} onClick={() => { setSizeFilter(s.id); setShowNew(false) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sizeFilter === s.id && !showNew ? 'bg-brand-50 text-brand-400 border border-brand-200' : 'bg-white border border-border text-text-secondary hover:bg-surface-tertiary'}`}>
                {t(s.labelKey)}
              </button>
            ))}
            <button onClick={() => { setShowNew(!showNew); setSizeFilter('all') }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showNew ? 'bg-brand-300 text-white' : 'bg-white border border-border text-text-secondary hover:bg-surface-tertiary'}`}>
              ✨ Solo M17
            </button>
          </div>
          <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1">
            <button onClick={() => setView('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'cards' ? 'bg-brand-50 text-brand-400' : 'text-text-secondary hover:bg-surface-tertiary'}`}>
              {t('standards.detailedDesc')}
            </button>
            <button onClick={() => setView('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'table' ? 'bg-brand-50 text-brand-400' : 'text-text-secondary hover:bg-surface-tertiary'}`}>
              {t('standards.compareAll')}
            </button>
          </div>
        </div>

        {view === 'cards' && (
          <div className="space-y-3 mb-10">
            {filtered.map(std => (
              <StandardCard key={std.id} std={std} expanded={expanded === std.id} onToggle={() => setExpanded(expanded === std.id ? null : std.id)} />
            ))}
            {filtered.length === 0 && (
              <div className="card text-center py-10">
                <p className="text-text-muted text-sm">{t('standards.applicableTo')}</p>
              </div>
            )}
          </div>
        )}

        {view === 'table' && (
          <div className="overflow-x-auto mb-10">
            <table className="w-full bg-white rounded-2xl border border-border overflow-hidden text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-text-muted font-medium text-xs uppercase tracking-wide w-36">{t('standards.feature')}</th>
                  {filtered.map(std => (
                    <th key={std.id} className="p-3 text-center">
                      <span className="text-lg block mb-1">{std.logo}</span>
                      <span className="font-bold text-text-primary text-xs block">{std.nombre}</span>
                      {std.nuevo && <span className="bg-brand-300 text-white text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5">Nuevo</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, i) => (
                  <tr key={feature} className={i % 2 === 0 ? 'bg-surface-secondary' : 'bg-white'}>
                    <td className="p-3 text-xs text-text-secondary font-medium">{feature}</td>
                    {filtered.map(std => (
                      <td key={std.id} className="p-3"><FeatureIcon value={std.features[feature]} /></td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-border bg-brand-50">
                  <td className="p-3 text-xs font-semibold text-brand-400">{t('standards.ecometrixCovers')}</td>
                  {filtered.map(std => (
                    <td key={std.id} className="p-3 text-center">
                      <span className="text-xs text-text-secondary leading-tight block">{std.ecometrix.split('—')[0]}</span>
                      {std.module && <Link to={std.module} className="text-xs text-brand-400 font-semibold mt-1 inline-block hover:underline">Módulo →</Link>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="card border-brand-200 bg-brand-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <p className="font-semibold text-text-primary mb-1">{t('standards.downloadPDF')}</p>
            <p className="text-sm text-text-secondary">{t('standards.detailedDesc')}</p>
          </div>
          <button onClick={handleExportPDF} disabled={pdfLoading}
            className="btn-primary flex-shrink-0 flex items-center gap-2 disabled:opacity-60">
            {pdfLoading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{t('common.loading')}</span></>
              : <><span>📄</span><span>{t('standards.downloadPDF')}</span></>
            }
          </button>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-brand-400 to-brand-300 p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">{t('landing.steps.s1Title')} — {t('pricing.startFree')}</h3>
          <p className="text-white/80 text-sm mb-5 max-w-md mx-auto">{t('landing.subheadline')}</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/diagnostico" className="bg-white text-brand-400 font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors text-sm">{t('landing.ctaPrimary')} →</Link>
            <Link to="/sbti" className="bg-white/20 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-white/30 transition-colors text-sm">SBTi Calculator →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
