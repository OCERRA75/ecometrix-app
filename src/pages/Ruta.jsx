// src/pages/Ruta.jsx
// M18 — Dashboard de Seguimiento de Ruta 12 meses
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase.js'
import { useAuth } from '@/hooks/useAuth.jsx'

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function nivelColor(nivel) {
  if (nivel === 'Bajo') return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' }
  if (nivel === 'Moderado') return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' }
  return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
}

function tendencia(actual, anterior) {
  if (!anterior) return null
  const diff = ((actual - anterior) / anterior) * 100
  return Math.round(diff)
}

// ── Mini sparkline SVG ─────────────────────────────────────────────────────
function Sparkline({ values, color = '#10B981' }) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 120, h = 40, pad = 4
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = pad + ((max - v) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-24 h-8">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Barra de progreso de acción ────────────────────────────────────────────
function AccionRow({ accion, index, completadas, onToggle }) {
  const done = completadas.includes(index)
  const dificultadColor = {
    'Fácil': 'bg-emerald-100 text-emerald-700',
    'Media': 'bg-amber-100 text-amber-700',
    'Difícil': 'bg-red-100 text-red-700',
  }
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${done ? 'bg-emerald-50 border-emerald-200 opacity-75' : 'bg-white border-border'}`}>
      <button
        onClick={() => onToggle(index)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'}`}
      >
        {done && <svg viewBox="0 0 12 12" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'line-through text-text-muted' : 'text-text-primary'}`}>{accion.accion}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dificultadColor[accion.dificultad] || 'bg-gray-100 text-gray-600'}`}>{accion.dificultad}</span>
          <span className="text-xs text-text-muted">{accion.plazo}</span>
          <span className="text-xs text-brand-400 font-medium">-{accion.reduccion_pct}% emisiones</span>
        </div>
      </div>
    </div>
  )
}

// ── Timeline de diagnósticos ───────────────────────────────────────────────
function TimelineMes({ diag, anterior, isLast, index }) {
  const fecha = new Date(diag.created_at)
  const mesLabel = `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`
  const ton = diag.calculo?.totalTonAnio
  const tonAnterior = anterior?.calculo?.totalTonAnio
  const delta = tendencia(ton, tonAnterior)
  const nivel = diag.calculo?.nivelImpacto
  const col = nivelColor(nivel)

  return (
    <div className="flex gap-4">
      {/* línea vertical */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${col.dot}`} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-primary">{mesLabel}</span>
          {delta !== null && (
            <span className={`text-xs font-bold ${delta < 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {delta < 0 ? '↓' : '↑'} {Math.abs(delta)}%
            </span>
          )}
        </div>
        <div className="card py-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-text-primary">{ton} <span className="text-sm font-normal text-text-muted">ton CO₂e/año</span></p>
              <p className="text-xs text-text-muted mt-0.5">{diag.empresa?.nombre}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.bg} ${col.text}`}>{nivel}</span>
              <Link to={`/reporte/${diag.id}`} className="text-xs text-brand-400 hover:underline">Ver reporte →</Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
            {[['A1', diag.calculo?.alcance1], ['A2', diag.calculo?.alcance2], ['A3', diag.calculo?.alcance3]].map(([label, val]) => (
              <div key={label} className="text-center">
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm font-semibold text-text-primary">{Math.round(val / 1000 * 10) / 10}t</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Guía de cumplimiento ───────────────────────────────────────────────────
function GuiaCumplimiento({ diagnosticos }) {
  if (diagnosticos.length < 2) return null
  const ultimo = diagnosticos[diagnosticos.length - 1]
  const primero = diagnosticos[0]
  const reduccionTotal = tendencia(ultimo.calculo?.totalTonAnio, primero.calculo?.totalTonAnio)
  const mesesActivos = diagnosticos.length

  const items = [
    {
      ok: mesesActivos >= 1,
      label: 'Primer diagnóstico completado',
      desc: 'Base de emisiones establecida (GHG Protocol)',
    },
    {
      ok: mesesActivos >= 3,
      label: '3 meses de seguimiento consecutivo',
      desc: `Llevas ${mesesActivos} mes${mesesActivos !== 1 ? 'es' : ''}`,
    },
    {
      ok: reduccionTotal !== null && reduccionTotal < 0,
      label: 'Tendencia de reducción activa',
      desc: reduccionTotal !== null ? `${reduccionTotal < 0 ? '↓' : '↑'} ${Math.abs(reduccionTotal)}% vs. diagnóstico inicial` : 'Aún sin cambio medible',
    },
    {
      ok: mesesActivos >= 6,
      label: '6 meses continuos',
      desc: 'Requerido para certificación ISO 14064',
    },
    {
      ok: mesesActivos >= 12,
      label: 'Ruta completa (12 meses)',
      desc: 'Apto para reporte GHG Protocol anual',
    },
  ]

  return (
    <div className="card">
      <h3 className="font-semibold text-text-primary mb-4">🎯 Guía de cumplimiento</h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${item.ok ? 'bg-emerald-50' : 'bg-surface-secondary'}`}>
            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${item.ok ? 'bg-emerald-500' : 'bg-gray-200'}`}>
              {item.ok
                ? <svg viewBox="0 0 12 12" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                : <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              }
            </div>
            <div>
              <p className={`text-sm font-medium ${item.ok ? 'text-emerald-700' : 'text-text-secondary'}`}>{item.label}</p>
              <p className="text-xs text-text-muted">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function Ruta() {
  const { user, loading: authLoading, plan } = useAuth()
  const navigate = useNavigate()
  const [diagnosticos, setDiagnosticos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completadas, setCompletadas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ecm_acciones_completadas') || '[]') } catch { return [] }
  })

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!user) return
    const fetchDiagnosticos = async () => {
      setLoading(true)
      try {
        const { data, error: err } = await supabase
          .from('diagnosticos')
          .select('id, created_at, empresa, calculo, analisis')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
        if (err) throw err
        setDiagnosticos(data || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDiagnosticos()
  }, [user])

  const toggleAccion = (index) => {
    const nuevas = completadas.includes(index)
      ? completadas.filter(i => i !== index)
      : [...completadas, index]
    setCompletadas(nuevas)
    localStorage.setItem('ecm_acciones_completadas', JSON.stringify(nuevas))
  }

  const ultimoDiag = diagnosticos[diagnosticos.length - 1]
  const planAccion = ultimoDiag?.analisis?.plan_accion || []
  const tonValues = diagnosticos.map(d => d.calculo?.totalTonAnio || 0)
  const primerTon = tonValues[0]
  const ultimoTon = tonValues[tonValues.length - 1]
  const reduccionTotal = tendencia(ultimoTon, primerTon)
  const accionesCompletadasPct = planAccion.length > 0 ? Math.round((completadas.length / planAccion.length) * 100) : 0

  // ── Estados de carga ──────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-300 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted text-sm">Cargando tu ruta...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="card max-w-sm text-center">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm">Reintentar</button>
        </div>
      </div>
    )
  }

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
            <Link to="/dashboard" className="btn-ghost text-sm py-1.5 px-3">Dashboard 360°</Link>
            <Link to="/diagnostico" className="btn-primary text-sm py-1.5 px-3">+ Nuevo diagnóstico</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Título */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-1">Tu ruta de sostenibilidad</h1>
          <p className="text-text-secondary text-sm">Seguimiento mensual de emisiones · Plan de acción · Guía de cumplimiento</p>
        </div>

        {/* Sin diagnósticos */}
        {diagnosticos.length === 0 && (
          <div className="card text-center py-16 max-w-lg mx-auto">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Aún no tienes diagnósticos guardados</h2>
            <p className="text-text-secondary text-sm mb-6">
              Para iniciar tu ruta de sostenibilidad necesitas iniciar sesión antes de completar el diagnóstico. Así guardamos tu historial mes a mes.
            </p>
            <Link to="/diagnostico" className="btn-primary inline-flex">Hacer mi primer diagnóstico →</Link>
          </div>
        )}

        {diagnosticos.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Columna izquierda — métricas + timeline */}
            <div className="lg:col-span-2 space-y-6">

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card text-center py-4">
                  <p className="text-2xl font-bold text-brand-400">{diagnosticos.length}</p>
                  <p className="text-xs text-text-muted mt-1">Diagnósticos</p>
                </div>
                <div className="card text-center py-4">
                  <p className={`text-2xl font-bold ${reduccionTotal !== null && reduccionTotal < 0 ? 'text-emerald-600' : reduccionTotal > 0 ? 'text-red-500' : 'text-text-primary'}`}>
                    {reduccionTotal !== null ? `${reduccionTotal > 0 ? '+' : ''}${reduccionTotal}%` : '—'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Variación total</p>
                </div>
                <div className="card text-center py-4">
                  <p className="text-2xl font-bold text-text-primary">{ultimoTon}</p>
                  <p className="text-xs text-text-muted mt-1">ton CO₂e/año actual</p>
                </div>
              </div>

              {/* Sparkline tendencia */}
              {tonValues.length >= 2 && (
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-text-primary text-sm">Tendencia de emisiones</h3>
                    <Sparkline values={tonValues} color={reduccionTotal !== null && reduccionTotal < 0 ? '#10B981' : '#F59E0B'} />
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {diagnosticos.map((d, i) => {
                      const fecha = new Date(d.created_at)
                      const prev = diagnosticos[i - 1]
                      const delta = tendencia(d.calculo?.totalTonAnio, prev?.calculo?.totalTonAnio)
                      return (
                        <div key={d.id} className="flex-shrink-0 text-center">
                          <div className="text-xs text-text-muted">{MESES[fecha.getMonth()]}</div>
                          <div className="text-sm font-semibold text-text-primary">{d.calculo?.totalTonAnio}t</div>
                          {delta !== null && (
                            <div className={`text-xs font-medium ${delta < 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {delta < 0 ? '↓' : '↑'}{Math.abs(delta)}%
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {/* Meses futuros vacíos hasta completar 12 */}
                    {Array.from({ length: Math.max(0, 12 - diagnosticos.length) }).map((_, i) => {
                      const fechaBase = new Date(diagnosticos[diagnosticos.length - 1].created_at)
                      const mes = (fechaBase.getMonth() + 1 + i) % 12
                      return (
                        <div key={`future-${i}`} className="flex-shrink-0 text-center opacity-25">
                          <div className="text-xs text-text-muted">{MESES[mes]}</div>
                          <div className="w-8 h-3 bg-border rounded mt-1 mx-auto" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="card">
                <h3 className="font-semibold text-text-primary mb-5">Historial de diagnósticos</h3>
                {diagnosticos.map((diag, i) => (
                  <TimelineMes
                    key={diag.id}
                    diag={diag}
                    anterior={diagnosticos[i - 1]}
                    isLast={i === diagnosticos.length - 1}
                    index={i}
                  />
                ))}
                {/* CTA próximo diagnóstico */}
                <div className="flex gap-4 mt-2">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full border-2 border-dashed border-brand-300 flex-shrink-0 mt-1" />
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm text-text-muted mb-2">Próximo diagnóstico</p>
                    <Link to="/diagnostico" className="btn-primary text-sm py-2 px-4 inline-flex">
                      + Agregar mes {MESES[(new Date(diagnosticos[diagnosticos.length - 1].created_at).getMonth() + 1) % 12]}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha — plan + guía */}
            <div className="space-y-6">

              {/* Plan de acción */}
              {planAccion.length > 0 && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-text-primary">Plan de acción</h3>
                    <span className="text-xs font-bold text-brand-400">{accionesCompletadasPct}% completado</span>
                  </div>
                  {/* Barra progreso */}
                  <div className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-brand-300 rounded-full transition-all duration-500" style={{ width: `${accionesCompletadasPct}%` }} />
                  </div>
                  <div className="space-y-2">
                    {planAccion.map((accion, i) => (
                      <AccionRow key={i} accion={accion} index={i} completadas={completadas} onToggle={toggleAccion} />
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-3">Marca las acciones que ya implementaste. Se guardan localmente.</p>
                </div>
              )}

              {/* Siguiente paso IA */}
              {ultimoDiag?.analisis?.siguiente_paso && (
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-400 mb-2">Recomendación IA</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{ultimoDiag.analisis.siguiente_paso}</p>
                </div>
              )}

              {/* Guía de cumplimiento */}
              <GuiaCumplimiento diagnosticos={diagnosticos} />

              {/* Upgrade CTA si es free */}
              {plan === 'free' && (
                <div className="bg-gradient-to-br from-brand-400 to-emerald-700 rounded-xl p-5 text-white">
                  <p className="font-semibold mb-1">Desbloquea la ruta completa</p>
                  <p className="text-white/80 text-xs mb-4">Plan Pro incluye historial ilimitado, PDF certificado, sincronización ERP y alertas mensuales automáticas.</p>
                  <Link to="/precios" className="block text-center bg-white text-brand-400 font-semibold text-sm py-2 rounded-lg hover:bg-brand-50 transition-colors">
                    Ver planes →
                  </Link>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
