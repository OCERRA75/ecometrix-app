// src/pages/ReductionPlan.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase.js'
import MonthlyCheckIn from '@/components/MonthlyCheckIn'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M19 12H5M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

function estadoColor(estado) {
  if (estado === 'completado') return 'bg-emerald-500'
  if (estado === 'en_curso') return 'bg-yellow-400'
  if (estado === 'atrasado') return 'bg-red-500'
  return 'bg-zinc-700'
}

function semaforo(real, meta) {
  if (real === null || real === undefined) return null
  const pct = ((meta - real) / meta) * 100
  if (pct >= 0) return { color: 'text-emerald-400', label: 'En meta', icon: '✓' }
  if (pct >= -10) return { color: 'text-yellow-400', label: 'Cerca', icon: '~' }
  return { color: 'text-red-400', label: 'Sobre meta', icon: '↑' }
}

export default function ReductionPlan() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState([])
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [diagnosticoId, setDiagnosticoId] = useState(null)
  const [anio] = useState(new Date().getFullYear())
  const [checkInMes, setCheckInMes] = useState(null)
  const mesActual = new Date().getMonth() + 1

  const [planUsuario, setPlanUsuario] = useState(null)

  useEffect(() => {
    loadPlan()
  }, [])

  async function loadPlan() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      // Verificar plan del usuario
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('plan')
        .eq('user_id', session.user.id)
        .single()

      const plan = perfil?.plan || 'free'
      setPlanUsuario(plan)

      if (plan === 'free') { setLoading(false); return }

      // Obtener último diagnóstico del usuario
      const { data: diag } = await supabase
        .from('diagnosticos')
        .select('id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!diag) { setLoading(false); return }
      setDiagnosticoId(diag.id)

      const res = await fetch(
        `/api/get-reduction-plan?diagnostico_id=${diag.id}&anio=${anio}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      const json = await res.json()

      if (json.plan && json.plan.length > 0) {
        setPlan(json.plan)
        setResumen(json.resumen)
      } else {
        // Generar plan vacío con metas progresivas si no existe
        await generarPlanInicial(session, diag.id)
        await loadPlan()
        return
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function generarPlanInicial(session, diagId) {
    // Obtener total CO2 del diagnóstico
    const { data: diag } = await supabase
      .from('diagnosticos')
      .select('calculo')
      .eq('id', diagId)
      .single()

    const totalKg = diag?.calculo?.total_kg_mes || 5000
    // Meta: reducir 20% en 12 meses de forma progresiva
    const registros = Array.from({ length: 12 }, (_, i) => ({
      user_id: session.user.id,
      diagnostico_id: diagId,
      mes: i + 1,
      anio,
      meta_kgco2: Math.round(totalKg * (1 - (i * 0.018))),
      estado: i + 1 < mesActual ? 'pendiente' : 'pendiente',
      acciones: accionesPorMes(i + 1),
    }))

    await supabase.from('planes_de_reduccion').insert(registros)
  }

  function accionesPorMes(mes) {
    const banco = [
      'Auditar consumo energético por área',
      'Revisar contratos de proveedores clave',
      'Capacitar al equipo en prácticas sostenibles',
      'Optimizar rutas de logística',
      'Medir residuos generados por proceso',
      'Evaluar proveedores alternativos locales',
      'Revisar consumo de combustible de flota',
      'Implementar política de impresión cero',
      'Medir huella del trabajo remoto',
      'Evaluar renovables para instalaciones',
      'Reporte interno de avance Q3',
      'Preparar certificación anual',
    ]
    return [banco[(mes - 1) % banco.length]]
  }

  function handleCheckInGuardado() {
    setCheckInMes(null)
    loadPlan()
  }

  const estadoGeneral = resumen?.estado_general
  const etiquetaEstado = {
    en_meta: { label: 'En meta', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
    en_progreso: { label: 'En progreso', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
    atrasado: { label: 'Atrasado', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
    revisar: { label: 'Revisar', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
  }[estadoGeneral] || { label: 'Sin datos', color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' }

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <IconLeaf />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Plan de Reducción</h1>
              <p className="text-sm text-zinc-500">Seguimiento mensual {anio}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Dashboard <IconArrow />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
            Cargando plan...
          </div>
        ) : planUsuario === 'free' ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-8 h-8 text-emerald-400">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Plan de Reducción</h2>
            <p className="text-zinc-400 text-sm max-w-sm mb-2">
              El seguimiento mensual de emisiones está disponible en el <span className="text-emerald-400 font-medium">Plan Básico</span> o superior.
            </p>
            <p className="text-zinc-600 text-xs max-w-sm mb-8">
              Activa tu plan para hacer seguimiento mes a mes, reportar emisiones reales y ver tu progreso hacia la reducción.
            </p>

            {/* Preview de los 3 primeros meses */}
            <div className="w-full max-w-md space-y-3 mb-8 relative">
              <div className="space-y-3" style={{ filter: 'blur(2px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}>
                {['Enero', 'Febrero', 'Marzo'].map((mes) => (
                  <div key={mes} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{mes}</p>
                      <p className="text-xs text-zinc-500">Meta: 5.000 kg CO₂ · ↳ Acción del mes</p>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-600">Reportar</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/precios?plan=basico"
                className="bg-emerald-500 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-emerald-400 transition-all"
              >
                Activar desde $79.000/mes →
              </a>
              <a
                href="/precios"
                className="border border-zinc-700 text-zinc-400 text-sm font-medium px-6 py-3 rounded-xl hover:bg-zinc-900 transition-all"
              >
                Ver todos los planes
              </a>
            </div>
          </div>
        ) : plan.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 text-sm">
            No hay diagnóstico registrado. Completa tu diagnóstico primero.
          </div>
        ) : (
          <>
            {/* Resumen */}
            {resumen && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 mb-1">Meses reportados</p>
                  <p className="text-2xl font-bold text-white">{resumen.meses_reportados}<span className="text-zinc-600 text-base font-normal">/12</span></p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 mb-1">Reducción acumulada</p>
                  <p className="text-2xl font-bold text-emerald-400">{resumen.reduccion_acumulada_pct}%</p>
                </div>
                <div className={`border rounded-2xl p-4 ${etiquetaEstado.bg}`}>
                  <p className="text-xs text-zinc-500 mb-1">Estado general</p>
                  <p className={`text-lg font-semibold ${etiquetaEstado.color}`}>{etiquetaEstado.label}</p>
                </div>
              </div>
            )}

            {/* Timeline de 12 meses */}
            <div className="space-y-3">
              {plan.map((registro) => {
                const semaf = semaforo(registro.real_kgco2, registro.meta_kgco2)
                const esMesActual = registro.mes === mesActual
                const esPasado = registro.mes < mesActual
                const sinReporte = registro.real_kgco2 === null

                return (
                  <div
                    key={registro.mes}
                    className={`bg-zinc-900 border rounded-2xl p-4 transition-all ${
                      esMesActual
                        ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                        : 'border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Indicador de mes */}
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${estadoColor(registro.estado)} ${esMesActual ? 'ring-2 ring-emerald-500/40' : ''}`} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {MESES[registro.mes - 1]}
                            </span>
                            {esMesActual && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                Mes actual
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Meta: {registro.meta_kgco2?.toLocaleString()} kg CO₂
                            {registro.real_kgco2 !== null && (
                              <> · Real: <span className={semaf?.color}>{registro.real_kgco2?.toLocaleString()} kg</span></>
                            )}
                          </p>
                          {registro.acciones?.length > 0 && (
                            <p className="text-xs text-zinc-600 mt-1">↳ {registro.acciones[0]}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {semaf && (
                          <span className={`text-xs font-medium ${semaf.color}`}>
                            {semaf.icon} {semaf.label}
                          </span>
                        )}
                        {(esMesActual || (esPasado && sinReporte)) && (
                          <button
                            onClick={() => setCheckInMes(registro)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                              esMesActual
                                ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            }`}
                          >
                            {sinReporte ? 'Reportar' : 'Editar'}
                          </button>
                        )}
                        {!sinReporte && !esMesActual && (
                          <span className="text-xs text-zinc-600">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal Check-in */}
      {checkInMes && (
        <MonthlyCheckIn
          registro={checkInMes}
          onClose={() => setCheckInMes(null)}
          onGuardado={handleCheckInGuardado}
        />
      )}
    </div>
  )
}
