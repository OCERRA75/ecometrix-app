// src/components/CertificationCard.jsx
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

// ── Configuración de niveles ──────────────────────────────────────────────────

const LEVELS = {
  1: {
    name: 'Iniciado Verde',
    color: '#6B7280',
    bg: 'from-gray-500/20 to-gray-600/10',
    border: 'border-gray-400/30',
    ring: '#6B7280',
    icon: '🌿',
  },
  2: {
    name: 'Comprometido',
    color: '#10B981',
    bg: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-400/30',
    ring: '#10B981',
    icon: '♻️',
  },
  3: {
    name: 'Avanzado',
    color: '#059669',
    bg: 'from-green-600/20 to-green-700/10',
    border: 'border-green-500/30',
    ring: '#059669',
    icon: '🌱',
  },
  4: {
    name: 'Líder Sostenible',
    color: '#D97706',
    bg: 'from-amber-500/20 to-yellow-600/10',
    border: 'border-amber-400/30',
    ring: '#D97706',
    icon: '🏆',
  },
}

const BADGE_META = {
  first_emission: { icon: '🌱', name: 'Primera Huella',     desc: 'Primer registro de emisiones' },
  full_scope:     { icon: '📊', name: 'Alcance Completo',   desc: 'Los 3 alcances medidos'       },
  planner:        { icon: '🎯', name: 'Planificador',       desc: 'Plan de acción generado'      },
  low_impact:     { icon: '⚡', name: 'Impacto Bajo',       desc: 'Nivel de impacto bajo'        },
  leader:         { icon: '🏆', name: 'Líder Sostenible',   desc: 'Puntaje ≥ 90'                 },
}

// ── Score ring SVG ────────────────────────────────────────────────────────────

function ScoreRing({ score, color }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1F2937" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white leading-none">{score}</span>
        <span className="text-xs text-gray-400 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ── Badge pill ────────────────────────────────────────────────────────────────

function BadgePill({ badgeKey, earned = false, isNew = false }) {
  const meta = BADGE_META[badgeKey]
  if (!meta) return null
  return (
    <div
      title={meta.desc}
      className={`
        relative flex items-center gap-2 px-3 py-2 rounded-xl border text-sm
        transition-all duration-300
        ${earned
          ? 'bg-white/10 border-white/20 text-white'
          : 'bg-white/4 border-white/8 text-gray-600 grayscale opacity-40'
        }
      `}
    >
      <span className="text-base">{meta.icon}</span>
      <span className="font-medium">{meta.name}</span>
      {isNew && (
        <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none animate-bounce">
          NEW
        </span>
      )}
    </div>
  )
}

// ── Breakdown bar ─────────────────────────────────────────────────────────────

function BreakdownBar({ label, value, max }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-32 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-300 w-8 text-right">{value}pt</span>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CertificationCard({ diagnosticoData, userId, onCertified }) {
  const { t } = useTranslation()
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newBadges, setNewBadges] = useState([])
  const [showBreakdown, setShowBreakdown] = useState(false)

  const allBadgeKeys = Object.keys(BADGE_META)

  async function obtenerCertificacion() {
    if (!diagnosticoData || !userId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/get-certification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnostico_id: diagnosticoData.id,
          user_id: userId,
          empresa: diagnosticoData.empresa,
          calculo: diagnosticoData.calculo,
          analisis: diagnosticoData.analisis,
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setCert(data)
      setNewBadges(data.new_badges || [])
      if (onCertified) onCertified(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (diagnosticoData) obtenerCertificacion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnosticoData?.id])

  const level = LEVELS[cert?.level] || LEVELS[1]
  const earnedKeys = cert?.badges_earned?.map(b => b.badge_key) || []

  const breakdownLabels = {
    alcances_1_2:    'Alcances 1 y 2',
    alcance_3:       'Alcance 3',
    plan_accion:     'Plan de acción',
    nivel_impacto:   'Nivel de impacto',
    perfil_empresa:  'Perfil empresa',
  }
  const breakdownMax = { alcances_1_2: 30, alcance_3: 15, plan_accion: 25, nivel_impacto: 20, perfil_empresa: 10 }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center gap-4 animate-pulse">
        <div className="w-28 h-28 rounded-full bg-white/10" />
        <div className="h-4 w-40 bg-white/10 rounded-full" />
        <div className="h-3 w-56 bg-white/8 rounded-full" />
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={obtenerCertificacion}
          className="mt-3 text-xs text-red-300 underline underline-offset-2"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!cert) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-gray-500 text-sm">Completa tu diagnóstico para obtener tu certificación.</p>
      </div>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className={`
      rounded-2xl border ${level.border} bg-gradient-to-br ${level.bg}
      backdrop-blur-sm p-6 flex flex-col gap-6
      transition-all duration-500
    `}>

      {/* Header — nivel + score */}
      <div className="flex items-center gap-5">
        <ScoreRing score={cert.score} color={level.color} />
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Certificación EcoMetriX
          </span>
          <h3 className="text-xl font-bold text-white leading-tight flex items-center gap-2">
            <span>{level.icon}</span>
            <span>{cert.level_name}</span>
          </h3>
          <span className="text-sm text-gray-300 truncate">
            {cert.certification?.empresa_nombre}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(cert.certification?.issued_at).toLocaleDateString('es-CO', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Código de verificación */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
        <span className="text-xs text-gray-400">Código:</span>
        <code className="text-xs font-mono text-emerald-400 flex-1">{cert.verification_code}</code>
        <button
          onClick={() => navigator.clipboard.writeText(cert.verification_code)}
          className="text-gray-500 hover:text-white transition-colors text-xs"
          title="Copiar código"
        >
          📋
        </button>
      </div>

      {/* Desglose de puntuación */}
      <div>
        <button
          onClick={() => setShowBreakdown(v => !v)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2"
        >
          <span>{showBreakdown ? '▾' : '▸'}</span>
          <span>Desglose de puntuación</span>
        </button>
        {showBreakdown && cert.breakdown && (
          <div className="flex flex-col gap-2 pl-3 border-l border-white/10">
            {Object.entries(cert.breakdown).map(([key, val]) => (
              <BreakdownBar
                key={key}
                label={breakdownLabels[key] || key}
                value={val}
                max={breakdownMax[key] || 30}
              />
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Logros obtenidos
        </p>
        <div className="flex flex-wrap gap-2">
          {allBadgeKeys.map(key => (
            <BadgePill
              key={key}
              badgeKey={key}
              earned={earnedKeys.includes(key)}
              isNew={newBadges.includes(key)}
            />
          ))}
        </div>
      </div>

      {/* CTA PDF */}
      <button
        disabled
        className="w-full py-3 rounded-xl bg-emerald-600/30 border border-emerald-500/30
          text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2
          hover:bg-emerald-600/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>📄</span>
        <span>Descargar certificado PDF</span>
        <span className="text-xs font-normal text-emerald-400/60 ml-1">(próximamente)</span>
      </button>
    </div>
  )
}
