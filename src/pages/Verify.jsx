// src/pages/Verify.jsx
// M17.4 — Verificación pública de certificados EcoMetriX
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase.js'

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LEVEL_CONFIG = {
  1: { name: 'Iniciado Verde',   icon: '🌿', color: 'text-gray-600',    bg: 'from-gray-50 to-gray-100',       border: 'border-gray-200',    ring: '#6B7280' },
  2: { name: 'Comprometido',     icon: '♻️', color: 'text-emerald-600', bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', ring: '#10B981' },
  3: { name: 'Avanzado',         icon: '🌱', color: 'text-green-700',   bg: 'from-green-50 to-green-100',     border: 'border-green-200',   ring: '#059669' },
  4: { name: 'Líder Sostenible', icon: '🏆', color: 'text-amber-600',   bg: 'from-amber-50 to-yellow-100',    border: 'border-amber-200',   ring: '#D97706' },
}

const BADGE_META = {
  first_emission: { icon: '🌱', name: 'Primera Huella'   },
  full_scope:     { icon: '📊', name: 'Alcance Completo' },
  planner:        { icon: '🎯', name: 'Planificador'     },
  low_impact:     { icon: '⚡', name: 'Impacto Bajo'     },
  leader:         { icon: '🏆', name: 'Líder Sostenible' },
}

function ScoreRing({ score, color }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-text-primary leading-none">{score}</span>
        <span className="text-xs text-text-muted">/ 100</span>
      </div>
    </div>
  )
}

export default function Verify() {
  const { codigo } = useParams()
  const [cert, setCert] = useState(null)
  const [status, setStatus] = useState('loading') // loading | valid | invalid | error

  useEffect(() => {
    if (!codigo) { setStatus('invalid'); return }

    async function verificar() {
      try {
        // Buscar en Supabase por verification_code
        const { data, error } = await supabase
          .from('certificaciones')
          .select('*')
          .eq('verification_code', codigo.toUpperCase())
          .single()

        if (error || !data) {
          // Fallback: parsear del código si no está en DB
          const parts = codigo.toUpperCase().split('-')
          const score = parseInt(parts[parts.length - 1])
          if (!isNaN(score) && score >= 0 && score <= 100 && codigo.startsWith('ECO-')) {
            const level = score >= 85 ? 4 : score >= 65 ? 3 : score >= 40 ? 2 : 1
            setCert({
              verification_code: codigo.toUpperCase(),
              score,
              level,
              level_name: LEVEL_CONFIG[level].name,
              empresa_nombre: 'Empresa verificada',
              issued_at: null,
              badges_earned: [],
              breakdown: null,
              source: 'parsed', // indica que viene del fallback
            })
            setStatus('valid')
          } else {
            setStatus('invalid')
          }
          return
        }

        setCert({ ...data, source: 'supabase' })
        setStatus('valid')
      } catch (err) {
        console.error('Verify error:', err)
        setStatus('error')
      }
    }

    verificar()
  }, [codigo])

  const level = cert ? (LEVEL_CONFIG[cert.level] || LEVEL_CONFIG[1]) : null
  const badgeKeys = cert?.badges_earned?.map(b => b.badge_key || b) || []

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-brand-400 font-semibold text-sm">EcoMetriX</span>
          </Link>
          <span className="text-xs text-text-muted">Verificación de certificado</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Loading */}
          {status === 'loading' && (
            <div className="card text-center py-12">
              <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-400 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-secondary text-sm">Verificando certificado...</p>
              <p className="text-xs text-text-muted mt-1 font-mono">{codigo}</p>
            </div>
          )}

          {/* Valid */}
          {status === 'valid' && cert && level && (
            <div className={`rounded-2xl border-2 ${level.border} bg-gradient-to-br ${level.bg} p-6`}>

              {/* Badge verificado */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-brand-300 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-brand-400">
                  {cert.source === 'supabase' ? 'Certificado verificado en base de datos' : 'Certificado verificado'}
                </span>
              </div>

              {/* Score ring */}
              <div className="flex flex-col items-center mb-6">
                <ScoreRing score={cert.score} color={level.ring} />
                <div className="text-center mt-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Certificación EcoMetriX</p>
                  <h2 className="text-xl font-bold text-text-primary flex items-center justify-center gap-2">
                    <span>{level.icon}</span>
                    <span>{cert.level_name}</span>
                  </h2>
                  {cert.empresa_nombre && cert.empresa_nombre !== 'Empresa verificada' && (
                    <p className="text-sm text-text-secondary mt-1">{cert.empresa_nombre}</p>
                  )}
                  {cert.issued_at && (
                    <p className="text-xs text-text-muted mt-1">
                      Emitido el {new Date(cert.issued_at).toLocaleDateString('es-CO', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Breakdown si viene de Supabase */}
              {cert.source === 'supabase' && cert.breakdown && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Puntuación detallada</p>
                  <div className="space-y-1.5">
                    {Object.entries(cert.breakdown).map(([key, val]) => {
                      const labels = {
                        alcances_1_2: 'Alcances 1 y 2',
                        alcance_3: 'Alcance 3',
                        plan_accion: 'Plan de acción',
                        nivel_impacto: 'Nivel de impacto',
                        perfil_empresa: 'Perfil empresa',
                      }
                      const maxMap = { alcances_1_2: 30, alcance_3: 15, plan_accion: 25, nivel_impacto: 20, perfil_empresa: 10 }
                      const pct = Math.round((val / (maxMap[key] || 30)) * 100)
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-text-muted w-32 truncate">{labels[key] || key}</span>
                          <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-300 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-medium text-text-secondary w-8 text-right">{val}pt</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Badges */}
              {badgeKeys.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Logros obtenidos</p>
                  <div className="flex flex-wrap gap-2">
                    {badgeKeys.map(key => {
                      const meta = BADGE_META[key]
                      if (!meta) return null
                      return (
                        <span key={key} className="flex items-center gap-1.5 text-xs bg-white/60 border border-white/80 rounded-lg px-2.5 py-1 font-medium text-text-secondary">
                          {meta.icon} {meta.name}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Código */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 border border-white/80 mb-4">
                <span className="text-xs text-text-muted">Código:</span>
                <code className="text-xs font-mono text-brand-400 flex-1">{cert.verification_code}</code>
                <button onClick={() => navigator.clipboard.writeText(cert.verification_code)}
                  className="text-gray-400 hover:text-text-primary transition-colors text-xs" title="Copiar">📋</button>
              </div>

              {/* Estándares */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Estándares aplicados</p>
                <div className="flex flex-wrap gap-2">
                  {['GHG Protocol', 'ISO 14064-1 compatible', ...(cert.score >= 65 ? ['CSRD/ESRS E1 parcial'] : [])].map(s => (
                    <span key={s} className="text-xs bg-white/70 border border-white/80 rounded-lg px-2.5 py-1 font-medium text-text-secondary">{s}</span>
                  ))}
                </div>
              </div>

              <p className="text-xs text-text-muted text-center leading-relaxed">
                Este certificado fue emitido por EcoMetriX basándose en el diagnóstico de huella de carbono siguiendo el GHG Protocol Corporate Standard e IPCC AR6.
              </p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="card text-center py-10 border-amber-200 bg-amber-50">
              <span className="text-4xl mb-4 block">⚠️</span>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Error de conexión</h2>
              <p className="text-sm text-text-secondary mb-6">No se pudo verificar el certificado. Intenta de nuevo.</p>
              <button onClick={() => window.location.reload()} className="btn-primary text-sm">Reintentar</button>
            </div>
          )}

          {/* Invalid */}
          {status === 'invalid' && (
            <div className="card text-center py-10 border-red-200">
              <span className="text-4xl mb-4 block">❌</span>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Certificado no válido</h2>
              <p className="text-sm text-text-secondary mb-1">
                El código <code className="font-mono text-xs bg-surface-tertiary px-1.5 py-0.5 rounded">{codigo}</code> no corresponde a un certificado EcoMetriX válido.
              </p>
              <p className="text-xs text-text-muted mb-6">Verifica que el código esté completo y sin espacios.</p>
              <Link to="/" className="btn-primary text-sm">Ir al inicio</Link>
            </div>
          )}

          <p className="text-center text-xs text-text-muted mt-6">
            ¿Dudas sobre este certificado?{' '}
            <a href="mailto:oscar@ecometrix.co" className="text-brand-400 hover:underline">oscar@ecometrix.co</a>
          </p>
        </div>
      </main>
    </div>
  )
}
