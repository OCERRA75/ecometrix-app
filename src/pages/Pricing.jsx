// src/pages/Pricing.jsx
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase.js'

const PLANES = [
  {
    id: 'basico',
    nombre: 'Básico',
    precio: '$79.000',
    periodo: '/mes',
    descripcion: 'Para PyMEs que quieren medir y certificar su huella.',
    color: 'border-zinc-700',
    badge: null,
    features: [
      'Diagnósticos ilimitados',
      'Reporte PDF descargable',
      'Certificación EcoMetriX',
      'Dashboard 360°',
      'Plan de reducción mensual',
      'Soporte por email',
    ],
    no: ['Módulo CSRD/ESRS', 'Integraciones ERP', 'Acceso API'],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: '$199.000',
    periodo: '/mes',
    descripcion: 'Para empresas que quieren reducir emisiones activamente.',
    color: 'border-emerald-500',
    badge: 'Más popular',
    features: [
      'Todo lo del Básico',
      'Módulo CSRD/ESRS completo',
      'Integraciones ERP (Siigo, Alegra, CSV)',
      'Calculador SBTi v2',
      'Acceso API (1000 req/mes)',
      'Soporte prioritario',
    ],
    no: [],
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio: '$499.000',
    periodo: '/mes',
    descripcion: 'Para grupos empresariales y grandes organizaciones.',
    color: 'border-zinc-700',
    badge: null,
    features: [
      'Todo lo del Pro',
      'Múltiples usuarios',
      'API ilimitada',
      'White-label disponible',
      'Onboarding personalizado',
      'SLA garantizado',
      'Factura electrónica',
    ],
    no: [],
  },
]

// Mapa de accesos por plan — alineado con PlanGuard
const ACCESOS_PLAN = {
  free:       [],
  basico:     ['/plan'],
  pro:        ['/plan', '/csrd', '/integraciones', '/developers', '/sbti'],
  enterprise: ['/plan', '/csrd', '/integraciones', '/developers', '/sbti'],
}

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-emerald-400 flex-shrink-0">
    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-zinc-600 flex-shrink-0">
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
  </svg>
)
const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function Pricing() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [planActual, setPlanActual] = useState(null)
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  const urlParams = new URLSearchParams(window.location.search)
  const pagoExitoso = urlParams.get('pago') === 'exitoso'
  const planPreseleccionado = urlParams.get('plan')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        // Leer desde profiles (tabla correcta) con effective_plan
        supabase
          .from('effective_plan')
          .select('plan_efectivo, role')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setPlanActual(data?.plan_efectivo || 'free')
            setRole(data?.role || 'user')
          })
          .catch(() => {
            // Fallback directo a profiles
            supabase.from('profiles').select('plan, role').eq('id', user.id).single()
              .then(({ data }) => {
                setPlanActual(data?.plan || 'free')
                setRole(data?.role || 'user')
              })
          })
      }
      setLoadingAuth(false)
    })
  }, [])

  useEffect(() => {
    if (planPreseleccionado) {
      setTimeout(() => {
        const el = document.getElementById(`plan-${planPreseleccionado}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [])

  async function handlePagar(plan) {
    if (!user) { navigate('/login'); return }
    setLoading(plan.id)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan_id: plan.id }),
      })

      const json = await res.json()
      if (!json.ok) throw new Error(json.message || json.error)

      // Redirigir a Wompi Checkout
      const params = new URLSearchParams({
        'public-key':           json.public_key,
        currency:               'COP',
        'amount-in-cents':      json.monto,
        reference:              json.referencia,
        'signature:integrity':  json.firma,
        'redirect-url':         `${window.location.origin}/precios?pago=exitoso&plan=${plan.id}`,
        'customer-data:email':  user.email,
      })

      window.location.href = `https://checkout.wompi.co/p/?${params.toString()}`
    } catch (err) {
      alert('Error al iniciar el pago: ' + err.message)
      setLoading(null)
    }
  }

  const esSuperadmin = role === 'superadmin'

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <IconLeaf />
          </div>
          <span className="font-semibold text-sm">EcoMetriX</span>
        </Link>
        <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Dashboard
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Superadmin badge */}
        {esSuperadmin && (
          <div className="mb-6 bg-brand-500/10 border border-brand-500/30 rounded-2xl p-4 text-center">
            <p className="text-emerald-400 font-semibold">⚡ Cuenta superadmin — acceso Enterprise sin restricciones</p>
          </div>
        )}

        {/* Banner pago exitoso */}
        {pagoExitoso && (
          <div className="mb-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <p className="text-emerald-400 font-semibold">✓ Pago procesado correctamente</p>
            <p className="text-zinc-400 text-sm mt-1">Tu plan se activará en los próximos minutos. Revisa tu correo.</p>
            <Link to="/dashboard" className="inline-block mt-3 text-sm text-emerald-400 hover:underline">
              Ir al Dashboard →
            </Link>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">Planes EcoMetriX</h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Elige el plan que mejor se adapta a tu empresa. Todos incluyen diagnóstico gratuito para empezar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANES.map((plan) => {
            const esActual = planActual === plan.id || (esSuperadmin && plan.id === 'enterprise')
            const esPro = plan.id === 'pro'
            const esPreseleccionado = planPreseleccionado === plan.id

            return (
              <div key={plan.id} id={`plan-${plan.id}`}
                className={`relative bg-zinc-900 border-2 rounded-2xl p-6 flex flex-col ${plan.color} ${esPro ? 'shadow-[0_0_30px_rgba(16,185,129,0.12)]' : ''} ${esPreseleccionado ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950' : ''}`}>

                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h2 className="text-lg font-bold mb-1">{plan.nombre}</h2>
                  <p className="text-zinc-500 text-xs mb-4">{plan.descripcion}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.precio}</span>
                    <span className="text-zinc-500 text-sm">{plan.periodo}</span>
                  </div>
                </div>

                <div className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <IconCheck />
                      <span className="text-sm text-zinc-300">{f}</span>
                    </div>
                  ))}
                  {plan.no.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <IconX />
                      <span className="text-sm text-zinc-600">{f}</span>
                    </div>
                  ))}
                </div>

                {esActual ? (
                  <div className="w-full py-2.5 rounded-xl text-center text-sm bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                    ✓ Plan activo
                  </div>
                ) : esSuperadmin ? (
                  <div className="w-full py-2.5 rounded-xl text-center text-sm bg-zinc-800 text-zinc-500 border border-zinc-700">
                    Superadmin — sin pago
                  </div>
                ) : (
                  <button onClick={() => handlePagar(plan)}
                    disabled={loading === plan.id || loadingAuth}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      esPro
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                        : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                    }`}>
                    {loadingAuth ? 'Cargando...' : loading === plan.id ? 'Procesando...' : `Activar ${plan.nombre}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Tabla de accesos */}
        <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 text-center">¿Qué incluye cada plan?</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-400 font-medium pb-3 pr-4">Función</th>
                  <th className="text-center text-zinc-400 font-medium pb-3 px-3">Básico</th>
                  <th className="text-center text-emerald-400 font-medium pb-3 px-3">Pro</th>
                  <th className="text-center text-zinc-400 font-medium pb-3 px-3">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {[
                  { label: 'Diagnósticos ilimitados',      basico: true,  pro: true,  ent: true },
                  { label: 'Reporte PDF + Certificado',    basico: true,  pro: true,  ent: true },
                  { label: 'Dashboard 360°',               basico: true,  pro: true,  ent: true },
                  { label: 'Plan de reducción mensual',    basico: true,  pro: true,  ent: true },
                  { label: 'Módulo CSRD/ESRS',             basico: false, pro: true,  ent: true },
                  { label: 'Integraciones ERP',            basico: false, pro: true,  ent: true },
                  { label: 'Calculador SBTi v2',           basico: false, pro: true,  ent: true },
                  { label: 'Acceso API',                   basico: false, pro: true,  ent: true },
                  { label: 'Multi-usuario / White-label',  basico: false, pro: false, ent: true },
                  { label: 'SLA + Factura electrónica',    basico: false, pro: false, ent: true },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="py-2.5 pr-4 text-zinc-300">{row.label}</td>
                    <td className="py-2.5 px-3 text-center">{row.basico ? <span className="text-emerald-400">✓</span> : <span className="text-zinc-700">—</span>}</td>
                    <td className="py-2.5 px-3 text-center">{row.pro    ? <span className="text-emerald-400">✓</span> : <span className="text-zinc-700">—</span>}</td>
                    <td className="py-2.5 px-3 text-center">{row.ent    ? <span className="text-emerald-400">✓</span> : <span className="text-zinc-700">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
          Pagos procesados de forma segura por Wompi · Acepta tarjetas, PSE y más · Cancela cuando quieras
        </p>
      </div>
    </div>
  )
}
