import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase.js'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '@/components/LanguageSelector.jsx'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import ChatAssistant from '@/components/ChatAssistant.jsx'
import CertificationCard from '@/components/CertificationCard.jsx'

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
        <h2 className="text-xl font-semibold text-text-primary mb-2">Calculando tu huella</h2>
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
    { label: t('report.scope1short'), desc: t('report.scope1desc'),  value: alcance1, pct: Math.round(alcance1 / total * 100), color: 'bg-brand-300' },
    { label: t('report.scope2short'), desc: t('report.scope2desc'),   value: alcance2, pct: Math.round(alcance2 / total * 100), color: 'bg-purple-500' },
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
                <span className="text-text-muted text-xs ml-1">kg COâ''e/mes</span>
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
                  <div className="h-full bg-brand-300 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                {d.cantidad && <p className="text-xs text-text-muted mt-0.5">{d.cantidad} {d.factorUsado ? `· Factor: ${d.factorUsado}` : ''}</p>}
              </div>
              <span className="text-xs font-medium text-text-secondary w-10 text-right flex-shrink-0">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAIN REPORT ──────────────────────────────────────────────────────────────
export default function Report() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const stored = sessionStorage.getItem('ecometrix_result')
        if (stored) {
          const parsed = JSON.parse(stored)
          setData(parsed)
          setLoading(false)
          // Enviar email automáticamente (solo una vez)
          const emailSent = sessionStorage.getItem('ecometrix_email_sent')
          if (!emailSent) {
            sessionStorage.setItem('ecometrix_email_sent', '1')
            fetch('/.netlify/functions/send-report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                empresa: parsed.empresa,
                calculo: parsed.calculo,
                analisis: parsed.analisis,
                reporteId: parsed.id,
              }),
            }).catch(err => console.warn('Email send failed:', err))
          }
          return
        }
        // Fallback: cargar desde Supabase
        if (id && id !== 'preview') {
          try {
            const { data: dbData, error: dbError } = await supabase
              .from('diagnosticos')
              .select('*')
              .eq('id', id)
              .single()

            if (dbData && !dbError) {
              setData(dbData)
              setEmpresa(dbData.empresa)
              setCalculo(dbData.calculo)
              setAnalisis(dbData.analisis)
              setLoading(false)
              return
            }
          } catch (e) {
            console.warn('Supabase fallback failed:', e)
          }
        }
        navigate('/diagnostico')
      } catch (err) {
        setError('Error cargando el reporte')
        setLoading(false)
      }
    }
    setTimeout(load, 2200)
  }, [id])

  if (loading) return <LoadingScreen />
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-danger mb-4">{error}</p>
        <Link to="/diagnostico" className="btn-primary">{t('report.newDiagnosis')}</Link>
      </div>
    </div>
  )
  if (!data) return null

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
            <button
              onClick={() => window.print()}
              className="btn-secondary text-sm py-1.5 px-3"
            >
              <IconDownload /> {t('report.downloadPDF')}
            </button>
            <Link to="/dashboard" className="btn-secondary text-sm py-1.5 px-3">
              Dashboard 360°
            </Link>
            <Link to="/csrd" className="btn-secondary text-sm py-1.5 px-3">
              🇪🇺 CSRD
            </Link>
            <Link to="/diagnostico" className="btn-primary text-sm py-1.5 px-3">
              Nuevo diagnóstico
            </Link>
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
            unit="kg COâ''e/mes"
            sub="Emisiones directas"
          />
          <MetricCard
            label={t('report.scope2')}
            value={calculo.alcance2.toLocaleString()}
            unit="kg COâ''e/mes"
            sub="Electricidad indirecta"
          />
          {calculo.alcance3 > 0 && (
            <MetricCard
              label={t('report.scope3')}
              value={calculo.alcance3.toLocaleString()}
              unit="kg COâ''e/mes"
              sub="Cadena de valor"
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
            <Link to="/diagnostico" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-400 font-medium text-sm hover:bg-brand-50 transition-all">
              Repetir diagnóstico <IconArrow />
            </Link>
          </div>
        )}

        {/* Metodología + Badge estándares M17.3 */}
        <div className="card border-dashed">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">{t('report.methodology')}</h3>
            <a href="/estandares" className="text-xs text-brand-400 hover:underline">Ver comparativa →</a>
          </div>

          {/* Badges de cobertura */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[
              { std: 'GHG Protocol', desc: 'Alcances 1, 2 y 3', status: 'full', icon: '🌍' },
              { std: 'ISO 14064-1', desc: 'Metodología compatible', status: 'full', icon: '📋' },
              { std: 'IPCC AR6', desc: 'Factores de emisión', status: 'full', icon: '📊' },
              {
                std: 'CSRD / ESRS E1',
                desc: calculo?.alcance1 > 0 && calculo?.alcance2 > 0 && calculo?.alcance3 > 0
                  ? 'Alcances 1+2+3 medidos' : 'Alcances parciales',
                status: calculo?.alcance1 > 0 && calculo?.alcance2 > 0 && calculo?.alcance3 > 0
                  ? 'partial' : 'pending',
                icon: '🇪🇺',
              },
              {
                std: 'SBTi Baseline',
                desc: calculo?.totalTonAnio > 0 ? `${calculo.totalTonAnio} ton CO₂e/año` : 'Baseline disponible',
                status: calculo?.totalTonAnio > 0 ? 'full' : 'pending',
                icon: '🎯',
              },
              {
                std: 'GRI 305',
                desc: 'Indicadores de emisiones',
                status: calculo?.alcance1 > 0 ? 'partial' : 'pending',
                icon: '📈',
              },
            ].map(({ std, desc, status, icon }) => (
              <div key={std} className={`rounded-xl border p-3 flex items-start gap-2.5 ${
                status === 'full'    ? 'bg-brand-50 border-brand-200' :
                status === 'partial' ? 'bg-amber-50 border-amber-200' :
                'bg-surface-tertiary border-border opacity-60'
              }`}>
                <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-xs font-semibold text-text-primary truncate">{std}</p>
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                      status === 'full'    ? 'bg-brand-300' :
                      status === 'partial' ? 'bg-amber-400' :
                      'bg-gray-300'
                    }`}>
                      {status === 'full' && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {status === 'partial' && <span className="text-white text-xs font-bold leading-none">~</span>}
                      {status === 'pending' && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-tight">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-3 h-3 rounded-full bg-brand-300 flex-shrink-0" /> Cubierto
            </span>
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" /> Parcial
            </span>
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0" /> Requiere más datos
            </span>
          </div>

          <p className="text-xs text-text-muted pt-4 border-t border-border">
            Este diagnóstico es una estimación basada en los datos proporcionados. Para una medición certificable se recomienda una auditoría con verificador acreditado ISO 14064-3.
          </p>
        </div>


        {/* Certificación EcoMetriX — M15 */}
        <div className="mt-8 mb-2">
          <h2 className="text-base font-semibold text-text-primary mb-4">🏅 Tu Certificación EcoMetriX</h2>
          <CertificationCard diagnosticoData={data} userId={data?.id} />
        </div>

      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          header { position: relative !important; }
          .btn-primary, .btn-secondary { display: none !important; }
        }
      `}</style>

      {/* Chat assistant flotante */}
      <ChatAssistant reportData={data} />
    </div>
  )
}
