// src/components/PlanGuard.jsx
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase.js'

const PLAN_NIVEL = { free: 0, basico: 1, pro: 2, enterprise: 3 }

const INFO_PAGINA = {
  '/plan': {
    nivel: 1,
    planNombre: 'Plan Básico',
    planId: 'basico',
    icon: '📉',
    titulo: 'Plan de Reducción Mensual',
    descripcion: 'Haz seguimiento mes a mes de tus emisiones reales, reporta tu progreso y trabaja hacia tus metas de reducción con acciones concretas.',
    features: [
      'Seguimiento mensual de emisiones',
      'Metas progresivas personalizadas',
      'Acciones recomendadas por mes',
      'Historial anual de reducción',
    ],
  },
  '/csrd': {
    nivel: 2,
    planNombre: 'Plan Pro',
    planId: 'pro',
    icon: '🇪🇺',
    titulo: 'Módulo CSRD/ESRS',
    descripcion: 'Analiza tu brecha de cumplimiento con la Directiva CSRD de la Unión Europea. Genera roadmap de 4 fases y exporta reporte PDF para auditores.',
    features: [
      'Gap analysis 18 requerimientos ESRS',
      'Roadmap de cumplimiento CSRD',
      'Exportación PDF para auditores',
      'Compatibilidad con ESRS E1, S1, G1',
    ],
  },
  '/integraciones': {
    nivel: 2,
    planNombre: 'Plan Pro',
    planId: 'pro',
    icon: '🔗',
    titulo: 'Integraciones ERP',
    descripcion: 'Conecta tu ERP directamente con EcoMetriX. Importa datos de Siigo, Alegra o CSV para calcular emisiones con datos reales de tu contabilidad.',
    features: [
      'Conector API Siigo',
      'Conector API Alegra',
      'Importador CSV/SIESA',
      'Clasificación automática GHG',
    ],
  },
  '/developers': {
    nivel: 2,
    planNombre: 'Plan Pro',
    planId: 'pro',
    icon: '⚡',
    titulo: 'Acceso API',
    descripcion: 'Integra EcoMetriX en tus propios sistemas. Accede a la API REST v1 con hasta 1000 requests/mes para automatizar mediciones y reportes.',
    features: [
      'API REST v1 documentada',
      '1000 requests/mes incluidos',
      'Webhooks de eventos',
      'Soporte técnico prioritario',
    ],
  },
}

export default function PlanGuard({ children, requiereNivel }) {
  const [planUsuario, setPlanUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [autenticado, setAutenticado] = useState(false)
  const location = useLocation()

  useEffect(() => {
    async function checkPlan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      setAutenticado(true)

      const { data: perfil } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      setPlanUsuario(perfil?.plan || 'free')
      setLoading(false)
    }
    checkPlan()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-100 border-t-brand-300 rounded-full animate-spin" />
    </div>
  )

  const nivelUsuario = PLAN_NIVEL[planUsuario] ?? 0
  const info = INFO_PAGINA[location.pathname] || {}
  const planRequerido = info.planNombre || 'Plan superior'
  const planId = info.planId || 'pro'

  console.log('PlanGuard:', { planUsuario, nivelUsuario, requiereNivel, pathname: location.pathname, info })

  // Si no tiene el nivel requerido → mostrar gate
  if (nivelUsuario < requiereNivel) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          {/* Icono */}
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-6 text-4xl">
            {info.icon || '🔒'}
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {info.titulo || 'Funcionalidad exclusiva'}
          </h2>
          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            🔒 Requiere {planRequerido}
          </div>
          <p className="text-text-secondary mb-6 leading-relaxed">
            {info.descripcion || 'Esta funcionalidad está disponible en un plan superior.'}
          </p>

          {/* Features */}
          {info.features && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8 text-left">
              {info.features.map((f) => (
                <div key={f} className="flex items-center gap-2.5 bg-white border border-border rounded-xl px-3 py-2.5">
                  <span className="w-4 h-4 rounded-full bg-brand-300 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="text-xs text-text-secondary">{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/precios?plan=${planId}`}
              className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm"
            >
              Activar {planRequerido} →
            </Link>
            <Link
              to="/precios"
              className="inline-flex items-center justify-center px-6 py-3 text-sm border border-border rounded-xl text-text-secondary hover:bg-surface-secondary transition-all"
            >
              Ver todos los planes
            </Link>
          </div>

          {/* Si no está autenticado */}
          {!autenticado && (
            <p className="mt-4 text-xs text-text-muted">
              ¿Ya tienes un plan activo?{' '}
              <Link to="/login" className="text-brand-400 hover:underline">Inicia sesión</Link>
            </p>
          )}
        </div>
      </div>
    )
  }

  return children
}
