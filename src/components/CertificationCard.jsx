// src/components/CertificationCard.jsx
import { useEffect, useRef, useState } from 'react'
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
    hexLight: '#6B7280',
  },
  2: {
    name: 'Comprometido',
    color: '#10B981',
    bg: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-400/30',
    ring: '#10B981',
    icon: '♻️',
    hexLight: '#059669',
  },
  3: {
    name: 'Avanzado',
    color: '#059669',
    bg: 'from-green-600/20 to-green-700/10',
    border: 'border-green-500/30',
    ring: '#059669',
    icon: '🌱',
    hexLight: '#047857',
  },
  4: {
    name: 'Líder Sostenible',
    color: '#D97706',
    bg: 'from-amber-500/20 to-yellow-600/10',
    border: 'border-amber-400/30',
    ring: '#D97706',
    icon: '🏆',
    hexLight: '#B45309',
  },
}

const BADGE_META = {
  first_emission: { icon: '🌱', name: 'Primera Huella',   desc: 'Primer registro de emisiones' },
  full_scope:     { icon: '📊', name: 'Alcance Completo', desc: 'Los 3 alcances medidos'       },
  planner:        { icon: '🎯', name: 'Planificador',     desc: 'Plan de acción generado'      },
  low_impact:     { icon: '⚡', name: 'Impacto Bajo',     desc: 'Nivel de impacto bajo'        },
  leader:         { icon: '🏆', name: 'Líder Sostenible', desc: 'Puntaje ≥ 90'                 },
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
        <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-300 w-8 text-right">{value}pt</span>
    </div>
  )
}

// ── Diploma canvas (off-screen, para PDF) ─────────────────────────────────────

function DiplomaCanvas({ cert, level, earnedKeys, canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !cert) return
    const ctx = canvas.getContext('2d')
    const W = 1122 // A4 landscape px @96dpi
    const H = 794
    canvas.width = W
    canvas.height = H

    // Fondo blanco cremoso
    ctx.fillStyle = '#FAFAF8'
    ctx.fillRect(0, 0, W, H)

    // Borde exterior decorativo
    ctx.strokeStyle = level.hexLight
    ctx.lineWidth = 6
    ctx.strokeRect(18, 18, W - 36, H - 36)
    ctx.strokeStyle = level.hexLight + '55'
    ctx.lineWidth = 1.5
    ctx.strokeRect(26, 26, W - 52, H - 52)

    // Esquinas decorativas
    const corner = (x, y, dx, dy) => {
      ctx.beginPath()
      ctx.moveTo(x + dx * 40, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x, y + dy * 40)
      ctx.strokeStyle = level.hexLight
      ctx.lineWidth = 3
      ctx.stroke()
    }
    corner(32, 32, 1, 1)
    corner(W - 32, 32, -1, 1)
    corner(32, H - 32, 1, -1)
    corner(W - 32, H - 32, -1, -1)

    // Header strip
    const grad = ctx.createLinearGradient(0, 0, W, 0)
    grad.addColorStop(0, level.hexLight)
    grad.addColorStop(1, level.hexLight + 'CC')
    ctx.fillStyle = grad
    ctx.fillRect(18, 18, W - 36, 72)

    // Logo texto en header
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 26px Georgia, serif'
    ctx.fillText('🌿 EcoMetriX', 52, 62)

    // Subtítulo header
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '14px Georgia, serif'
    ctx.fillText('Certificado de Sostenibilidad Empresarial', W - 360, 62)

    // Título principal
    ctx.fillStyle = '#1C1917'
    ctx.font = 'bold 38px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText('CERTIFICADO DE DIAGNÓSTICO', W / 2, 158)

    ctx.fillStyle = level.hexLight
    ctx.font = 'italic 20px Georgia, serif'
    ctx.fillText('Huella de Carbono — GHG Protocol + ISO 14064', W / 2, 190)

    // Separador
    ctx.strokeStyle = level.hexLight + '44'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(80, 208); ctx.lineTo(W - 80, 208)
    ctx.stroke()

    // Empresa nombre
    ctx.fillStyle = '#1C1917'
    ctx.font = 'bold 48px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText(cert.certification?.empresa_nombre || '', W / 2, 278)

    // Texto descriptivo
    ctx.fillStyle = '#57534E'
    ctx.font = '16px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText('ha completado satisfactoriamente el diagnóstico de huella de carbono', W / 2, 316)
    ctx.fillText('y ha obtenido la siguiente certificación EcoMetriX:', W / 2, 338)

    // Nivel grande
    ctx.fillStyle = level.hexLight
    ctx.font = `bold 36px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${level.icon}  ${cert.level_name}`, W / 2, 398)

    // Score círculo
    const cx = W / 2, cy = 460, r = 44
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = level.hexLight + '18'
    ctx.fill()
    ctx.strokeStyle = level.hexLight
    ctx.lineWidth = 3
    ctx.stroke()

    // Score arco
    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (cert.score / 100) * Math.PI * 2)
    ctx.strokeStyle = level.hexLight
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.fillStyle = '#1C1917'
    ctx.font = 'bold 28px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText(cert.score, cx, cy + 8)
    ctx.font = '11px Georgia, serif'
    ctx.fillStyle = '#78716C'
    ctx.fillText('/ 100', cx, cy + 24)

    // Línea separadora inferior
    ctx.strokeStyle = level.hexLight + '44'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(80, 528); ctx.lineTo(W - 80, 528)
    ctx.stroke()

    // Badges obtenidos
    ctx.fillStyle = '#78716C'
    ctx.font = '11px Georgia, serif'
    ctx.textAlign = 'left'
    ctx.fillText('LOGROS OBTENIDOS:', 80, 556)

    const badgeEarned = Object.keys(BADGE_META).filter(k => earnedKeys.includes(k))
    let bx = 80
    badgeEarned.forEach(key => {
      const meta = BADGE_META[key]
      ctx.fillStyle = level.hexLight + '22'
      const tw = ctx.measureText(`${meta.icon} ${meta.name}`).width + 20
      roundRect(ctx, bx, 562, tw, 26, 6)
      ctx.fill()
      ctx.strokeStyle = level.hexLight + '66'
      ctx.lineWidth = 1
      roundRect(ctx, bx, 562, tw, 26, 6)
      ctx.stroke()
      ctx.fillStyle = '#1C1917'
      ctx.font = '12px Georgia, serif'
      ctx.fillText(`${meta.icon} ${meta.name}`, bx + 10, 580)
      bx += tw + 10
    })

    // Código verificación
    ctx.fillStyle = '#78716C'
    ctx.font = '11px Georgia, serif'
    ctx.textAlign = 'left'
    ctx.fillText('CÓDIGO DE VERIFICACIÓN:', 80, 628)
    ctx.fillStyle = level.hexLight
    ctx.font = 'bold 14px "Courier New", monospace'
    ctx.fillText(cert.verification_code, 80, 648)

    // Fecha
    const fecha = new Date(cert.certification?.issued_at).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
    ctx.fillStyle = '#78716C'
    ctx.font = '12px Georgia, serif'
    ctx.textAlign = 'right'
    ctx.fillText(`Emitido el ${fecha}`, W - 80, 648)

    // Footer
    ctx.fillStyle = level.hexLight + 'BB'
    ctx.fillRect(18, H - 50, W - 36, 32)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '11px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText('EcoMetriX · GHG Protocol Corporate Standard · ISO 14064-1 · IPCC AR6 · ecometrix-app-one.vercel.app', W / 2, H - 29)

  }, [cert, level, earnedKeys])

  return <canvas ref={canvasRef} style={{ display: 'none' }} />
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CertificationCard({ diagnosticoData, userId, onCertified }) {
  const { t } = useTranslation()
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newBadges, setNewBadges] = useState([])
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const canvasRef = useRef(null)

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

  async function descargarPDF() {
    if (!cert || !canvasRef.current) return
    setPdfLoading(true)
    try {
      // Importar jsPDF dinámicamente
      const { jsPDF } = await import('jspdf')
      const canvas = canvasRef.current
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })
      // A4 landscape: 297 x 210 mm
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210)
      const nombre = cert.certification?.empresa_nombre?.replace(/\s+/g, '_') || 'empresa'
      pdf.save(`EcoMetriX_Certificado_${nombre}_${cert.verification_code}.pdf`)
    } catch (err) {
      console.error('PDF error:', err)
      alert('Error generando el PDF. Intenta de nuevo.')
    } finally {
      setPdfLoading(false)
    }
  }

  const level = LEVELS[cert?.level] || LEVELS[1]
  const earnedKeys = cert?.badges_earned?.map(b => b.badge_key) || []

  const breakdownLabels = {
    alcances_1_2:   'Alcances 1 y 2',
    alcance_3:      'Alcance 3',
    plan_accion:    'Plan de acción',
    nivel_impacto:  'Nivel de impacto',
    perfil_empresa: 'Perfil empresa',
  }
  const breakdownMax = { alcances_1_2: 30, alcance_3: 15, plan_accion: 25, nivel_impacto: 20, perfil_empresa: 10 }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center gap-4 animate-pulse">
        <div className="w-28 h-28 rounded-full bg-white/10" />
        <div className="h-4 w-40 bg-white/10 rounded-full" />
        <div className="h-3 w-56 bg-white/8 rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={obtenerCertificacion} className="mt-3 text-xs text-red-300 underline underline-offset-2">
          Reintentar
        </button>
      </div>
    )
  }

  if (!cert) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-gray-500 text-sm">Completa tu diagnóstico para obtener tu certificación.</p>
      </div>
    )
  }

  return (
    <>
      {/* Canvas off-screen para generar el PDF */}
      <DiplomaCanvas cert={cert} level={level} earnedKeys={earnedKeys} canvasRef={canvasRef} />

      <div className={`
        rounded-2xl border ${level.border} bg-gradient-to-br ${level.bg}
        backdrop-blur-sm p-6 flex flex-col gap-6 transition-all duration-500
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
          onClick={descargarPDF}
          disabled={pdfLoading}
          className="w-full py-3 rounded-xl bg-emerald-600/30 border border-emerald-500/30
            text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2
            hover:bg-emerald-600/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pdfLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>Generando PDF...</span>
            </>
          ) : (
            <>
              <span>📄</span>
              <span>Descargar certificado PDF</span>
            </>
          )}
        </button>
      </div>
    </>
  )
}
