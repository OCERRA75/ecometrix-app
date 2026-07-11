import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ChatAssistant from '@/components/ChatAssistant.jsx'
import CertificationCard from '@/components/CertificationCard'
import ResidualOffsetPanel from '@/components/ResidualOffsetPanel'
import { supabase } from '@/lib/supabase.js'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, Legend
} from 'recharts'

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─── SCORE GAUGE SVG ──────────────────────────────────────────────────────────
function ScoreGauge({ score, label, color = '#1D9E75', size = 120 }) {
  const r = 44
  const cx = 60
  const cy = 60
  const circumference = 2 * Math.PI * r
  const pct = Math.min(score / 100, 1)
  const dash = pct * circumference
  const gap = circumference - dash

  const getColor = (s) => {
    if (s >= 70) return '#1D9E75'
    if (s >= 40) return '#BA7517'
    return '#993C1D'
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 120 120">
        {/* Background track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F3" strokeWidth="10" />
        {/* Score arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={circumference * 0.25}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
          fontSize="24" fontWeight="700" fill={getColor(score)}>
          {score}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="10" fill="#8BA898">
          / 100
        </text>
      </svg>
      <p className="text-xs font-medium text-text-secondary text-center mt-1">{label}</p>
    </div>
  )
}

// ─── SCORE BADGE ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  if (score >= 70) return <span className="badge-green">Bueno</span>
  if (score >= 40) return <span className="bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2.5 py-0.5 text-xs font-medium">Moderado</span>
  return <span className="bg-red-50 text-red-700 border border-red-100 rounded-full px-2.5 py-0.5 text-xs font-medium">Crítico</span>
}

// ─── GREENWASHING DETECTOR ────────────────────────────────────────────────────
function GreenwashingAlert({ score, respuestas }) {
  const flags = []

  // Detectar inconsistencias
  if (respuestas) {
    const motivacion = respuestas['a2_principal_motivacion']
    const metas = respuestas['a2_metas_sostenibilidad']
    const renovables = respuestas['a2_fuentes_renovables']

    if (motivacion === 'Diferenciarnos en el mercado' && metas === 'No, este es nuestro primer paso') {
      flags.push('Motivación comercial sin historial de acción sostenible verificable.')
    }
    if (renovables && renovables.includes('solar') && score < 40) {
      flags.push('Inversión en renovables pero huella de carbono aún alta — comunicar con cautela.')
    }
  }

  if (flags.length === 0) return (
    <div className="flex items-center gap-2 px-4 py-3 bg-brand-50 border border-brand-100 rounded-xl">
      <svg className="w-5 h-5 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round"/></svg>
        <p className="text-sm text-brand-400 font-medium">Sin alertas de greenwashing detectadas</p>
    </div>
  )

  return (
    <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
      <p className="text-sm font-medium text-amber-700 mb-2">⚠️ Alertas de comunicación responsable</p>
      {flags.map((f, i) => <p key={i} className="text-xs text-amber-600">{f}</p>)}
    </div>
  )
}

// ─── TIMELINE CHART ───────────────────────────────────────────────────────────
function TimelineChart({ totalKgMes, planAccion }) {
  // Genera proyección de 12 meses basada en el plan de acción
  const reduccionTotal = planAccion?.reduce((acc, a) => acc + (a.reduccion_pct || 0), 0) || 50
  const reduccionMensual = reduccionTotal / 24 // distribuido en 2 años

  const data = Array.from({ length: 12 }, (_, i) => {
    const mes = new Date()
    mes.setMonth(mes.getMonth() + i)
    const label = mes.toLocaleDateString('es-CO', { month: 'short' })
    const actual = i === 0 ? totalKgMes : null
    const proyectado = Math.round(totalKgMes * (1 - (reduccionMensual / 100) * i))
    return { mes: label, actual, proyectado }
  })

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradProyectado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F3" />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#8BA898' }} />
        <YAxis tick={{ fontSize: 11, fill: '#8BA898' }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D6E8E0' }}
          formatter={(v, n) => [`${v?.toLocaleString()} kg`, n === 'proyectado' ? 'Proyección' : 'Real']}
        />
        <Area type="monotone" dataKey="proyectado" stroke="#1D9E75" strokeWidth={2}
          fill="url(#gradProyectado)" strokeDasharray="5 5" dot={false} />
        <Area type="monotone" dataKey="actual" stroke="#0F6E56" strokeWidth={3}
          fill="none" dot={{ fill: '#0F6E56', r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── BENCHMARK CHART ─────────────────────────────────────────────────────────
function BenchmarkChart({ empresa, totalTonAnio }) {
  const benchmarks = {
    'Manufactura': { p25: 15, p50: 45, p75: 120 },
    'Retail / Comercio': { p25: 5, p50: 18, p75: 60 },
    'Logística / Transporte': { p25: 30, p50: 80, p75: 200 },
    'Servicios profesionales': { p25: 2, p50: 8, p75: 25 },
    'Alimentos y bebidas': { p25: 20, p50: 55, p75: 150 },
    'Construcción': { p25: 25, p50: 70, p75: 180 },
    'Tecnología / Software': { p25: 1, p50: 5, p75: 18 },
    'Salud / Farmacéutico': { p25: 8, p50: 22, p75: 65 },
    'Agropecuario': { p25: 40, p50: 110, p75: 300 },
    'Otro': { p25: 10, p50: 30, p75: 90 },
  }

  const bench = benchmarks[empresa?.sector] || benchmarks['Otro']

  const data = [
    { name: 'P25 sector', value: bench.p25, color: '#9FE1CB' },
    { name: 'Mediana sector', value: bench.p50, color: '#1D9E75' },
    { name: 'P75 sector', value: bench.p75, color: '#0F6E56' },
    { name: empresa?.nombre || 'Tu empresa', value: totalTonAnio, color: totalTonAnio > bench.p75 ? '#993C1D' : totalTonAnio > bench.p50 ? '#BA7517' : '#1D9E75' },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8BA898' }} />
        <YAxis tick={{ fontSize: 11, fill: '#8BA898' }} unit=" t" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D6E8E0' }}
          formatter={(v) => [`${v} ton CO₂e/año`]}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── RADAR CHART ──────────────────────────────────────────────────────────────
function RadarSostenibilidad({ scores }) {
  const data = [
    { dimension: 'Carbono', score: scores.carbono },
    { dimension: 'Energía', score: scores.energia },
    { dimension: 'Circular', score: scores.circular },
    { dimension: 'Gobernanza', score: scores.gobernanza },
    { dimension: 'Social', score: scores.social },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="#D6E8E0" />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#4A6358' }} />
        <Radar dataKey="score" stroke="#1D9E75" fill="#1D9E75" fillOpacity={0.2} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ─── QUADRANT CARD ────────────────────────────────────────────────────────────
function QuadrantCard({ title, score, icon, description, actions, color }) {
  const [expanded, setExpanded] = useState(false)
  const colorMap = {
    green: { bg: 'bg-brand-50', border: 'border-brand-200', text: 'text-brand-400' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  }
  const c = colorMap[color] || colorMap.green

  return (
    <div className={`card border-2 ${c.border} cursor-pointer hover:shadow-card-hover transition-all`}
      onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
            <ScoreBadge score={score} />
          </div>
        </div>
        <ScoreGauge score={score} size={80} />
      </div>
      <p className="text-xs text-text-secondary leading-relaxed mb-3">{description}</p>
      {expanded && actions && (
        <div className="pt-3 border-t border-border space-y-2">
          {actions.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className={`w-4 h-4 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={`w-2.5 h-2.5 ${c.text}`}>
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs text-text-secondary">{a}</p>
            </div>
          ))}
        </div>
      )}
      <p className={`text-xs ${c.text} mt-2 font-medium`}>{expanded ? '▲ Ver menos' : '▼ Ver acciones'}</p>
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

// ── Historial Comparativo ─────────────────────────────────────────────────────
function HistorialComparativo({ historial, diagActualId }) {
  if (!historial || historial.length < 2) return null

  // Calcular score ESG para cada diagnóstico del historial
  const items = historial.map(d => {
    const c = d.calculo || {}
    const totalKg = (c.alcance1 || 0) + (c.alcance2 || 0) + (c.alcance3 || 0)
    const totalTon = totalKg / 1000
    const nivel = c.nivelImpacto || (totalTon > 100 ? 'Alto' : totalTon > 30 ? 'Moderado' : 'Bajo')
    const scoreBase = nivel === 'Bajo' ? 75 : nivel === 'Moderado' ? 50 : 25
    const score = Math.min(100, Math.max(10, scoreBase + Math.round(Math.random() * 10 - 5)))
    return {
      id: d.id,
      empresa: d.empresa?.nombre || 'Diagnóstico',
      fecha: new Date(d.created_at),
      totalTon: Math.round(totalTon * 10) / 10,
      alcance1: Math.round((c.alcance1 || 0) / 100) / 10,
      alcance2: Math.round((c.alcance2 || 0) / 100) / 10,
      alcance3: Math.round((c.alcance3 || 0) / 100) / 10,
      score,
      nivel,
      esActual: d.id === diagActualId,
    }
  }).sort((a, b) => a.fecha - b.fecha)

  const maxTon = Math.max(...items.map(i => i.totalTon), 1)
  const tendencia = items.length >= 2
    ? items[items.length - 1].totalTon - items[items.length - 2].totalTon
    : 0
  const mejorando = tendencia <= 0

  const labelFecha = (fecha) => fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Historial comparativo</h2>
          <p className="text-xs text-text-muted mt-0.5">{items.length} diagnósticos — evolución de emisiones</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          mejorando
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {mejorando ? '↓' : '↑'}
          {Math.abs(tendencia).toFixed(1)} ton CO₂e
          <span className="font-normal opacity-70">{mejorando ? 'reducción' : 'aumento'}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Gráfica de evolución */}
        <div className="card md:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Emisiones totales por diagnóstico</h3>
          <p className="text-xs text-text-muted mb-5">ton CO₂e · Alcances 1+2+3</p>
          <div className="flex items-end gap-3 h-40">
            {items.map((item, idx) => {
              const heightPct = maxTon > 0 ? (item.totalTon / maxTon) * 100 : 10
              const isLast = idx === items.length - 1
              return (
                <div key={item.id} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold text-text-primary">{item.totalTon}</span>
                  <div className="w-full relative group">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        item.esActual
                          ? 'bg-brand-300'
                          : isLast && mejorando
                          ? 'bg-emerald-400'
                          : 'bg-brand-100'
                      }`}
                      style={{ height: `${Math.max(heightPct, 8)}%`, minHeight: '8px', maxHeight: '120px' }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap">
                        <p className="font-semibold">{item.totalTon} ton CO₂e</p>
                        <p className="opacity-70">Alc1: {item.alcance1}t · Alc2: {item.alcance2}t · Alc3: {item.alcance3}t</p>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-text-muted text-center leading-tight">{labelFecha(item.fecha)}</span>
                  {item.esActual && (
                    <span className="text-[9px] bg-brand-50 text-brand-400 px-1.5 py-0.5 rounded-full border border-brand-100 font-medium">actual</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Leyenda alcances */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-border">
            {[
              { label: 'Alcance 1', color: 'bg-emerald-400' },
              { label: 'Alcance 2', color: 'bg-brand-300' },
              { label: 'Alcance 3', color: 'bg-brand-100' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                <span className="text-xs text-text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla comparativa */}
        <div className="card">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Comparativa de scores</h3>
          <p className="text-xs text-text-muted mb-4">Score ESG por diagnóstico</p>
          <div className="space-y-3">
            {items.map((item, idx) => {
              const prev = idx > 0 ? items[idx - 1].score : null
              const diff = prev !== null ? item.score - prev : null
              return (
                <div key={item.id} className={`flex items-center justify-between py-2 px-3 rounded-xl ${
                  item.esActual ? 'bg-brand-50 border border-brand-100' : 'bg-surface-secondary'
                }`}>
                  <div>
                    <p className="text-xs font-medium text-text-primary">{labelFecha(item.fecha)}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{item.nivel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {diff !== null && (
                      <span className={`text-[10px] font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {diff >= 0 ? '+' : ''}{diff}
                      </span>
                    )}
                    <span className={`text-base font-bold ${item.esActual ? 'text-brand-400' : 'text-text-primary'}`}>
                      {item.score}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumen tendencia */}
          <div className={`mt-4 pt-4 border-t border-border p-3 rounded-xl ${mejorando ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className={`text-xs font-semibold ${mejorando ? 'text-emerald-700' : 'text-red-700'}`}>
              {mejorando ? '✓ Tendencia positiva' : '⚠ Tendencia a revisar'}
            </p>
            <p className={`text-[10px] mt-0.5 ${mejorando ? 'text-emerald-600' : 'text-red-600'}`}>
              {mejorando
                ? `Redujiste ${Math.abs(tendencia).toFixed(1)} ton CO₂e desde el diagnóstico anterior.`
                : `Aumentaste ${tendencia.toFixed(1)} ton CO₂e desde el diagnóstico anterior.`
              }
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Dashboard360() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [historial, setHistorial] = useState([])
  const [diagSeleccionado, setDiagSeleccionado] = useState(null)

  useEffect(() => {
    async function loadData() {
      // 1. Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      if (user) {
        // 2. Cargar historial de diagnósticos del usuario
        const { data: todos } = await supabase
          .from('diagnosticos')
          .select('id, empresa, calculo, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (todos && todos.length > 0) {
          setHistorial(todos)

          // 3. Verificar si sessionStorage tiene un diagnóstico válido de este usuario
          const stored = sessionStorage.getItem('ecometrix_result')
          const storedData = stored ? JSON.parse(stored) : null
          const storedEsValido = storedData &&
            (storedData.user_id === user.id || todos.some(d => d.id === storedData.id))

          if (storedEsValido) {
            // Vincular si era anónimo
            if (storedData.id && !storedData.user_id) {
              await supabase
                .from('diagnosticos')
                .update({ user_id: user.id })
                .eq('id', storedData.id)
                .is('user_id', null)
              storedData.user_id = user.id
              sessionStorage.setItem('ecometrix_result', JSON.stringify(storedData))
            }
            setData(storedData)
          } else {
            // 4. sessionStorage vacío o de otro usuario → cargar el más reciente desde Supabase
            const { data: diag } = await supabase
              .from('diagnosticos')
              .select('id, empresa, calculo, analisis, respuestas')
              .eq('id', todos[0].id)
              .single()
            if (diag) {
              const result = {
                id: diag.id,
                empresa: diag.empresa,
                calculo: diag.calculo,
                analisis: diag.analisis,
                respuestas: diag.respuestas,
                user_id: user.id,
              }
              setData(result)
              sessionStorage.setItem('ecometrix_result', JSON.stringify(result))
            }
          }
        } else {
          // Usuario sin diagnósticos aún — revisar sessionStorage
          const stored = sessionStorage.getItem('ecometrix_result')
          if (stored) setData(JSON.parse(stored))
        }
      } else {
        // Sin sesión — solo sessionStorage
        const stored = sessionStorage.getItem('ecometrix_result')
        if (stored) setData(JSON.parse(stored))
      }

      setLoading(false)
    }
    loadData()
  }, [])

  async function cargarDiagnostico(id) {
    setLoading(true)
    const { data: diag } = await supabase
      .from('diagnosticos')
      .select('id, empresa, calculo, analisis, respuestas')
      .eq('id', id)
      .single()
    if (diag) {
      const result = { id: diag.id, empresa: diag.empresa, calculo: diag.calculo, analisis: diag.analisis, respuestas: diag.respuestas }
      setData(result)
      setDiagSeleccionado(id)
      sessionStorage.setItem('ecometrix_result', JSON.stringify(result))
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-100 border-t-brand-300 rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-brand-400">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Tu Dashboard de Sostenibilidad</h2>
        <p className="text-text-secondary mb-2 leading-relaxed">
          Aquí verás tu perfil ESG completo: huella de carbono, eficiencia energética, economía circular y gobernanza.
        </p>
        <p className="text-sm text-text-muted mb-8">
          Completa tu diagnóstico en menos de 10 minutos para activar el dashboard.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
          {[
            { icon: '📊', label: 'Radar ESG 5 dimensiones' },
            { icon: '🔍', label: 'Detector de greenwashing' },
            { icon: '📈', label: 'Proyección 12 meses' },
            { icon: '🏅', label: 'Certificado verificable' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 bg-white border border-border rounded-xl px-3 py-2.5">
              <span className="text-lg">{icon}</span>
              <span className="text-xs text-text-secondary font-medium">{label}</span>
            </div>
          ))}
        </div>
        <Link to="/diagnostico" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm">
          Iniciar diagnóstico gratis →
        </Link>
      </div>
    </div>
  )

  const { empresa, calculo, analisis } = data

  // ── Calcular scores por cuadrante ─────────────────────────────────────────
  const calcularScores = () => {
    const r = data.respuestas || {}

    // Score carbono (inverso de nivel de impacto)
    const nivelMap = { Bajo: 80, Moderado: 50, Alto: 25 }
    const carbono = nivelMap[calculo.nivelImpacto] || 50

    // Score energía (renovables, eficiencia)
    let energia = 40
    const renovables = r['a2_fuentes_renovables']
    if (renovables === 'No') energia = 30
    if (renovables?.includes('parcial')) energia = 55
    if (renovables?.includes('50%')) energia = 70
    if (renovables?.includes('RECs')) energia = 85

    // Score circular (procesos, sector)
    let circular = 45
    if (empresa.sector === 'Tecnología / Software') circular = 70
    if (empresa.sector === 'Manufactura') circular = 35
    const procesos = r['a1_procesos_industriales']
    if (procesos === 'No aplica a nuestro negocio') circular += 10

    // Score gobernanza
    let gobernanza = 40
    const metas = r['a2_metas_sostenibilidad']
    if (metas?.includes('política')) gobernanza = 65
    if (metas?.includes('certificados')) gobernanza = 80
    if (metas?.includes('Reportamos')) gobernanza = 75
    if (metas === 'No, este es nuestro primer paso') gobernanza = 25

    // Score social (teletrabajo, empleados)
    let social = 50
    const teletrabajo = r['a2_teletrabajo']
    if (teletrabajo?.includes('100%')) social = 75
    if (teletrabajo?.includes('75%')) social = 65
    if (teletrabajo === 'Todos presenciales (0%)') social = 40

    return { carbono, energia, circular, gobernanza, social }
  }

  const scores = calcularScores()
  const scoreTotal = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5)

  const cuadrantes = [
    {
      title: 'Huella de Carbono',
      score: scores.carbono,
      icon: '🌍',
      color: 'green',
      description: `Alcance 1 + 2: ${calculo.totalTonAnio} ton CO₂e/año. Nivel ${calculo.nivelImpacto} para el sector ${empresa.sector}.`,
      actions: analisis?.plan_accion?.slice(0, 3).map(a => a.accion) || ['Medir emisiones regularmente', 'Reducir consumo energético'],
    },
    {
      title: 'Gestión Energética',
      score: scores.energia,
      icon: '⚡',
      color: 'amber',
      description: 'Eficiencia en el uso de energía y adopción de fuentes renovables en operaciones.',
      actions: ['Auditoría energética de instalaciones', 'Evaluar contrato de energía renovable', 'Instalar medidores inteligentes por área'],
    },
    {
      title: 'Economía Circular',
      score: scores.circular,
      icon: '♻️',
      color: 'purple',
      description: 'Gestión de residuos, reutilización de materiales y diseño de procesos circulares.',
      actions: ['Programa de separación y reciclaje', 'Reducir empaques plásticos', 'Política de compras sostenibles'],
    },
    {
      title: 'Gobernanza ESG',
      score: scores.gobernanza,
      icon: '📋',
      color: 'blue',
      description: 'Políticas de sostenibilidad, Reportes formales y cumplimiento de estándares internacionales.',
      actions: ['Documentar política de sostenibilidad', 'Definir metas anuales de reducción', 'Preparar Reporte CSRD (si aplica)'],
    },
  ]

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-brand-400 font-semibold text-sm">EcoMetriX</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to={`/reporte/${data.id}`} className="btn-ghost text-sm py-1.5 px-3">← Reporte</Link>
            <Link to="/plan" className="btn-secondary text-sm py-1.5 px-3">📅 Plan de reducción</Link>
            <Link to="/csrd" className="btn-secondary text-sm py-1.5 px-3">🇪🇺 CSRD</Link>
            <Link to="/diagnostico" className="btn-primary text-sm py-1.5 px-3">Nuevo diagnóstico</Link>
          </div>
        </div>
      </header>

      {/* Sub-header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-text-primary">Dashboard Sostenibilidad 360°</h1>
            <p className="text-sm text-text-secondary">{empresa.nombre} · {empresa.sector} · {empresa.pais}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Selector de historial */}
            {historial.length > 1 && (
              <select
                value={diagSeleccionado || data.id}
                onChange={e => cargarDiagnostico(e.target.value)}
                className="text-xs border border-border rounded-lg px-3 py-1.5 text-text-secondary bg-white focus:outline-none focus:ring-1 focus:ring-brand-300"
              >
                {historial.map((d, i) => (
                  <option key={d.id} value={d.id}>
                    {i === 0 ? '📍 ' : ''}{d.empresa?.nombre || 'Diagnóstico'} · {new Date(d.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </option>
                ))}
              </select>
            )}
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-400">{scoreTotal}</p>
              <p className="text-xs text-text-muted">Score ESG</p>
            </div>
            <ScoreBadge score={scoreTotal} />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* 4 Cuadrantes */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-4">Los 4 pilares de sostenibilidad</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cuadrantes.map(q => <QuadrantCard key={q.title} {...q} />)}
          </div>
        </section>

        {/* Historial Comparativo */}
        <HistorialComparativo historial={historial} diagActualId={diagSeleccionado || data?.id} />

        {/* Radar + Greenwashing */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-text-primary mb-1">Perfil de sostenibilidad</h3>
            <p className="text-xs text-text-muted mb-4">5 dimensiones ESG evaluadas</p>
            <RadarSostenibilidad scores={scores} />
            <div className="grid grid-cols-5 gap-2 mt-2">
              {Object.entries(scores).map(([k, v]) => (
                <div key={k} className="text-center">
                  <p className="text-sm font-bold text-brand-400">{v}</p>
                  <p className="text-xs text-text-muted capitalize">{k}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-text-primary mb-1">Detector de Greenwashing</h3>
            <p className="text-xs text-text-muted mb-4">Análisis de consistencia entre acciones y comunicaciones</p>
            <GreenwashingAlert score={scoreTotal} respuestas={data.respuestas} />
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-text-primary mb-2">Recomendaciones de comunicación</p>
              <ul className="space-y-1.5">
                {[
                  'Usa datos verificables en tus comunicaciones de sostenibilidad',
                  'Reporta tanto logros como áreas de mejora para mayor credibilidad',
                  'Actualiza tu diagnóstico cada 6 meses para mostrar progreso real',
                ].map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-brand-300 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-xs text-text-secondary">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Timeline proyección */}
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-1">Proyección de reducción — 12 meses</h3>
          <p className="text-xs text-text-muted mb-4">Basada en el plan de acción recomendado (línea punteada = proyección)</p>
          <TimelineChart totalKgMes={calculo.totalKgMes} planAccion={analisis?.plan_accion} />
        </div>

        {/* Benchmark sectorial */}
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-1">Benchmark sectorial</h3>
          <p className="text-xs text-text-muted mb-4">Tu huella vs empresas del sector {empresa.sector} (ton CO₂e/año)</p>
          <BenchmarkChart empresa={empresa} totalTonAnio={calculo.totalTonAnio} />
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
            {[
              { label: 'P25 (mejor 25%)', color: 'bg-brand-100' },
              { label: 'Mediana sector', color: 'bg-brand-300' },
              { label: 'P75 (peor 25%)', color: 'bg-brand-400' },
              { label: 'Tu empresa', color: 'bg-amber-400' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-xs text-text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compensación de huella residual */}
        <ResidualOffsetPanel
          huellaResidualTon={
            calculo.totalTonAnio * (1 - ((analisis?.plan_accion?.reduce((acc, a) => acc + (a.reduccion_pct || 0), 0) || 50) / 100))
          }
        />

        {/* CTA siguiente paso */}
        <div className="bg-brand-400 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/70 mb-1">Siguiente paso recomendado</p>
              <h3 className="text-lg font-semibold mb-1">{analisis?.siguiente_paso || 'Iniciar auditoría energética'}</h3>
              <p className="text-sm text-white/70">Actualiza tu diagnóstico en 3 meses para medir el progreso real.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link to="/diagnostico" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-400 font-medium text-sm hover:bg-brand-50 transition-all">
                Nuevo diagnóstico
              </Link>
            </div>
          </div>
        </div>

        {/* Certificación M15 */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-4">🏅 Tu Certificación EcoMetriX</h2>
          <div className="max-w-2xl">
            <CertificationCard
              diagnosticoData={data}
              userId={userId}
            />
          </div>
        </section>

      </main>

      {/* Chat assistant flotante */}
      <ChatAssistant reportData={data} />
    </div>
  )
}
