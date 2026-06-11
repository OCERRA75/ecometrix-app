// src/pages/Report.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import ChatAssistant from '@/components/ChatAssistant.jsx'
import CertificationCard from '@/components/CertificationCard.jsx'
import { supabase } from '@/lib/supabase.js'

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const nivelColor = {
  Bajo:     { bg: 'bg-brand-50',  text: 'text-brand-400',  border: 'border-brand-200',  bar: '#1D9E75' },
  Moderado: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  bar: '#BA7517' },
  Alto:     { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    bar: '#993C1D' },
}

const dificultadColor = {
  'Fácil':  'badge-green',
  'Media':  'bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2.5 py-0.5 text-xs font-medium',
  'Difícil':'bg-red-50 text-red-700 border border-red-100 rounded-full px-2.5 py-0.5 text-xs font-medium',
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const steps = [
    'Procesando tus respuestas...',
    'Aplicando factores IPCC AR6...',
    'Calculando emisiones por alcance...',
    'Generando análisis con IA...',
    'Preparando tu reporte...',
  ]
  useEffect(() => {
    const interval = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 900)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-6">
          <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-300 rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">{t('questionnaire.calculating')}</h2>
        <p className="text-sm text-text-secondary mb-6">{steps[step]}</p>
        <div className="flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i <= step ? 'bg-brand-300' : 'bg-border'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── METRIC CARD ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, sub, accent = false }) {
  return (
    <div className={`card ${accent ? 'bg-brand-400 border-brand-400' : ''}`}>
      <p className={`text-xs font-medium mb-2 ${accent ? 'text-white/70' : 'text-text-muted'}`}>{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-3xl font-bold ${accent ? 'text-white' : 'text-text-primary'}`}>{value}</span>
        {unit && <span className={`text-sm font-medium ${accent ? 'text-white/70' : 'text-text-secondary'}`}>{unit}</span>}
      </div>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-white/60' : 'text-text-muted'}`}>{sub}</p>}
    </div>
  )
}

// ─── ALCANCE CHART ────────────────────────────────────────────────────────────
function AlcanceChart({ alcance1, alcance2, alcance3 }) {
  const { t } = useTranslation()
  const total = (alcance1 + alcance2 + (alcance3 || 0)) || 1
  const alcances = [
    { label: t('report.scope1short'), desc: t('report.scope1desc'), value: alcance1, pct: Math.round(alcance1 / total * 100), color: 'bg-brand-300' },
    { label: t('report.scope2short'), desc: t('report.scope2desc'), value: alcance2, pct: Math.round(alcance2 / total * 100), color: 'bg-purple-500' },
    ...(alcance3 > 0 ? [{ label: t('report.scope3short'), desc: t('report.scope3desc'), value: alcance3, pct: Math.round(alcance3 / total * 100), color: 'bg-blue-500' }] : []),
  ]
  return (
    <div className="card">
      <h3 className="font-semibold text-text-primary mb-1">{t('report.distribution')}</h3>
      <p className="text-xs text-text-muted mb-4">GHG Protocol Corporate Standard</p>
      <div className="space-y-3">
        {alcances.map(({ label, desc, value, pct, color }) => (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1">
              <div>
                <span className="font-medium text-text-primary">{label}</span>
                <span className="text-text-muted ml-1.5 text-xs">{desc}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-text-primary">{value.toLocaleString()}</span>
                <span className="text-text-muted text-xs ml-1">kg CO₂e/mes</span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-surface-tertiary rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-text-muted mt-0.5 text-right">{pct}% del total</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PLAN DE ACCIÓN ───────────────────────────────────────────────────────────
function PlanAccion({ acciones }) {
  const { t } = useTranslation()
  return (
    <div className="card">
      <h3 className="font-semibold text-text-primary mb-1">{t('report.reductionPlan')}</h3>
      <p className="text-xs text-text-muted mb-4">5 acciones priorizadas por impacto y facilidad</p>
      <div className="space-y-3">
        {acciones.map((a, i) => (
          <div key={i} className="flex items-start gap-4 p-3.5 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors">
            <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-brand-400 font-bold text-xs">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary mb-1.5">{a.accion}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-green">-{a.reduccion_pct}% emisiones</span>
                <span className={dificultadColor[a.dificultad] || 'badge-gray'}>{a.dificultad}</span>
                <span className="badge-gray">{a.plazo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── DETALLES POR FUENTE ──────────────────────────────────────────────────────
function DetallesFuentes({ detalles, total }) {
  const { t } = useTranslation()
  if (!detalles?.length) return null
  return (
    <div className="card">
      <h3 className="font-semibold text-text-primary mb-1">{t('report.sources')}</h3>
      <p className="text-xs text-text-muted mb-4">Desglose detallado por categoría</p>
      <div className="space-y-3">
        {detalles.map((d, i) => {
          const pct = total > 0 ? Math.round(d.kgCO2e / total * 100) : 0
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-text-primary truncate">{d.categoria}</span>
                  <span className="text-text-muted ml-2 flex-shrink-0">{d.kgCO2e.toLocaleString()} kg</span>
                </div>
                <div className="w-full h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                  <div className="h-full bg-brand-200 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="text-xs text-text-muted w-8 text-right flex-shrink-0">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Report() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setUserId(user.id)

        if (id) {
          // Cargar diagnóstico por ID desde Supabase
          const { data: diag } = await supabase
            .from('diagnosticos')
            .select('*')
            .eq('id', id)
            .single()
          if (diag) {
            setData({ id: diag.id, empresa: diag.empresa, calculo: diag.calculo, analisis: diag.analisis, respuestas: diag.respuestas })
            sessionStorage.setItem('ecometrix_result', JSON.stringify({ id: diag.id, empresa: diag.empresa, calculo: diag.calculo, analisis: diag.analisis, respuestas: diag.respuestas }))
          }
        } else {
          // Cargar desde sessionStorage
          const stored = sessionStorage.getItem('ecometrix_result')
          if (stored) setData(JSON.parse(stored))
        }
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    loadData()
  }, [id])

  if (loading) return <LoadingScreen />

  if (!data) return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-text-muted mb-4">No hay datos de diagnóstico disponibles.</p>
        <Link to="/questionnaire" className="btn-primary">{t('dashboard.newDiagnosis')}</Link>
      </div>
    </div>
  )

  const { empresa, calculo, analisis } = data
  const nivel = nivelColor[calculo.nivelImpacto] || nivelColor.Moderado

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-brand-400 font-semibold text-sm">EcoMetriX</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted hidden sm:block">{t('report.title')} — {empresa.nombre}</span>
            <button onClick={() => window.print()} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5">
              <IconDownload /> {t('report.downloadPDF')}
            </button>
            <Link to="/dashboard" className="btn-secondary text-sm py-1.5 px-3">{t('report.dashboard360')}</Link>
            <Link to="/csrd" className="btn-secondary text-sm py-1.5 px-3">🇪🇺 CSRD</Link>
            <Link to="/questionnaire" className="btn-primary text-sm py-1.5 px-3">{t('report.newDiagnosis')}</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Hero resultado */}
        <div className={`rounded-2xl border-2 ${nivel.border} ${nivel.bg} p-6 mb-8`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">{t('report.title')}</p>
              <h1 className="text-2xl font-bold text-text-primary mb-1">{empresa.nombre}</h1>
              <p className="text-sm text-text-secondary">{empresa.sector} · {empresa.tamano} · {empresa.pais}</p>
            </div>
            <div className={`px-5 py-3 rounded-xl border-2 ${nivel.border} bg-white text-center flex-shrink-0`}>
              <p className="text-xs text-text-muted mb-1">{t('report.impactLevel')}</p>
              <p className={`text-2xl font-bold ${nivel.text}`}>{calculo.nivelImpacto}</p>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <MetricCard
            label={t('report.totalFootprint')}
            value={calculo.totalTonAnio.toLocaleString()}
            unit="ton CO₂e/año"
            sub={`${calculo.totalKgMes.toLocaleString()} kg/mes`}
            accent
          />
          <MetricCard
            label={t('report.scope1')}
            value={calculo.alcance1.toLocaleString()}
            unit="kg CO₂e/mes"
            sub={t('report.scope1desc')}
          />
          <MetricCard
            label={t('report.scope2')}
            value={calculo.alcance2.toLocaleString()}
            unit="kg CO₂e/mes"
            sub={t('report.scope2desc')}
          />
          {calculo.alcance3 > 0 && (
            <MetricCard
              label={t('report.scope3')}
              value={calculo.alcance3.toLocaleString()}
              unit="kg CO₂e/mes"
              sub={t('report.scope3desc')}
            />
          )}
          <MetricCard
            label={t('report.economicValue')}
            value={`$${(calculo.valorETS_COP / 1000000).toFixed(1)}M`}
            unit="COP/año"
            sub="Equivalente EU ETS"
          />
        </div>

        {/* Resumen ejecutivo */}
        {analisis?.resumen_ejecutivo && (
          <div className="card mb-6">
            <h3 className="font-semibold text-text-primary mb-3">{t('report.executiveSummary')}</h3>
            <p className="text-text-secondary leading-relaxed">{analisis.resumen_ejecutivo}</p>
            {analisis.benchmark && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-text-muted mb-1">{t('report.sectorBenchmark')}</p>
                <p className="text-sm text-text-secondary">{analisis.benchmark}</p>
              </div>
            )}
          </div>
        )}

        {/* Gráficas + detalles */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <AlcanceChart alcance1={calculo.alcance1} alcance2={calculo.alcance2} alcance3={calculo.alcance3 || 0} />
          <DetallesFuentes detalles={calculo.detalles} total={calculo.totalKgMes} />
        </div>

        {/* Plan de acción */}
        {analisis?.plan_accion && (
          <div className="mb-6">
            <PlanAccion acciones={analisis.plan_accion} />
          </div>
        )}

        {/* Siguiente paso */}
        {analisis?.siguiente_paso && (
          <div className="bg-brand-400 rounded-2xl p-6 mb-8 text-white">
            <p className="text-sm font-medium text-white/70 mb-1">Recomendación inmediata</p>
            <p className="text-lg font-semibold mb-4">{analisis.siguiente_paso}</p>
            <Link to="/questionnaire" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-400 font-medium text-sm hover:bg-brand-50 transition-all">
              {t('report.newDiagnosis')} <IconArrow />
            </Link>
          </div>
        )}

        {/* Metodología */}
        <div className="card border-dashed mb-8">
          <h3 className="font-semibold text-text-primary mb-3">{t('report.methodology')}</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              ['GHG Protocol', 'Corporate Standard — Alcances 1 y 2'],
              ['ISO 14064-1', 'Cuantificación de emisiones — Ed. 2018'],
              ['IPCC AR6', 'Factores de emisión — 6° Informe de Evaluación'],
            ].map(([std, desc]) => (
              <div key={std} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5 text-brand-400"><IconCheck /></div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{std}</p>
                  <p className="text-xs text-text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-4 pt-4 border-t border-border">
            Este diagnóstico es una estimación basada en los datos proporcionados. Para una medición certificable se recomienda una auditoría con verificador acreditado ISO 14064-3.
          </p>
        </div>

        {/* Certificación EcoMetriX */}
        <div className="mb-2">
          <h2 className="text-base font-semibold text-text-primary mb-4">🏅 {t('dashboard.certLevel')}</h2>
          <CertificationCard diagnosticoData={data} userId={userId} />
        </div>

      </main>

      <style>{`
        @media print {
          header { position: relative !important; }
          .btn-primary, .btn-secondary { display: none !important; }
        }
      `}</style>

      <ChatAssistant reportData={data} />
    </div>
  )
}
