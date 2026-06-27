// src/pages/Pricing.jsx
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase.js'

const PLANES = [
  {
    id: 'basico',
    nombre: 'Básico',
    precioMes: 79000,
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
    precioMes: 199000,
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
    precioMes: 499000,
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

const ACCESOS_PLAN = {
  free:       [],
  basico:     ['/plan'],
  pro:        ['/plan', '/csrd', '/integraciones', '/developers', '/sbti'],
  enterprise: ['/plan', '/csrd', '/integraciones', '/developers', '/sbti'],
}

const FAQ_PRECIOS = [
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí. No hay contratos ni permanencia mínima. Puedes cancelar desde tu perfil y tu plan seguirá activo hasta el fin del periodo pagado.',
  },
  {
    q: '¿Emiten factura electrónica?',
    a: 'Los planes Enterprise incluyen factura electrónica. Para Básico y Pro puedes solicitarla escribiéndonos a oscar@ecometrix.co.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Aceptamos tarjetas débito/crédito Visa, Mastercard, American Express y transferencia PSE, procesados de forma segura por Wompi.',
  },
  {
    q: '¿El descuento anual aplica desde el primer mes?',
    a: 'Sí. Al elegir facturación anual se aplica el 20% de descuento sobre el total del año, pagado en un solo cobro.',
  },
  {
    q: '¿Puedo cambiar de plan después?',
    a: 'Claro. Puedes subir o bajar de plan en cualquier momento. El cambio aplica al siguiente ciclo de facturación.',
  },
  {
    q: '¿Los datos de mi empresa están seguros?',
    a: 'Sí. Todos los datos se almacenan cifrados en Supabase (infraestructura AWS) y nunca son compartidos con terceros.',
  },
]

function formatCOP(value) {
  return '$' + value.toLocaleString('es-CO')
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
const IconChevron = ({ open }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}>
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

function BillingToggle({ anual, setAnual }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      <span className={`text-sm font-medium transition-colors ${!anual ? 'text-white' : 'text-zinc-500'}`}>Mensual</span>
      <button
        onClick={() => setAnual(!anual)}
        className={`relative w-12 h-6 rounded-full transition-colors ${anual ? 'bg-emerald-500' : 'bg-zinc-700'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${anual ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
      <span className={`text-sm font-medium transition-colors ${anual ? 'text-white' : 'text-zinc-500'}`}>
        Anual
        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">−20%</span>
      </span>
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/50 transition-colors"
      >
        <span className="text-sm font-medium text-white pr-4">{q}</span>
        <IconChevron open={open} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-zinc-400 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function Pricing() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [planActual, setPlanActual] = useState(null)
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [anual, setAnual] = useState(false)

  const urlParams = new URLSearchParams(window.location.search)
  const pagoExitoso = urlParams.get('pago') === 'exitoso'
  const planPreseleccionado = urlParams.get('plan')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
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
      const precioFinal = anual ? Math.round(plan.precioMes * 12 * 0.8) : plan.precioMes
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan_id: plan.id, monto_override: precioFinal * 100, periodo: anual ? 'anual' : 'mensual' }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.message || json.error)
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
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
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

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Planes EcoMetriX</h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Elige el plan que mejor se adapta a tu empresa. Todos incluyen diagnóstico gratuito para empezar.
          </p>
        </div>

        {/* Toggle anual/mensual */}
        <BillingToggle anual={anual} setAnual={setAnual} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANES.map((plan) => {
            const esActual = planActual === plan.id || (esSuperadmin && plan.id === 'enterprise')
            const esPro = plan.id === 'pro'
            const esEnterprise = plan.id === 'enterprise'
            const esPreseleccionado = planPreseleccionado === plan.id
            const precioFinal = anual ? Math.round(plan.precioMes * 12 * 0.8) : plan.precioMes
            const precioOriginal = anual ? plan.precioMes * 12 : null

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
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{formatCOP(precioFinal)}</span>
                    <span className="text-zinc-500 text-sm">{anual ? '/año' : '/mes'}</span>
                  </div>
                  {anual && (
                    <p className="text-xs text-zinc-600 mt-1 line-through">{formatCOP(precioOriginal)}/año</p>
                  )}
                  {anual && (
                    <p className="text-xs text-emerald-400 mt-0.5">Ahorras {formatCOP(precioOriginal - precioFinal)}/año</p>
                  )}
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
                ) : esEnterprise ? (
                  <a
                    href="https://wa.me/573001234567?text=Hola%2C%20me%20interesa%20el%20plan%20Enterprise%20de%20EcoMetriX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
                  >
                    <IconWhatsApp />
                    Contactar ventas
                  </a>
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

        {/* FAQ */}
        <div className="mt-12">
          <h3 className="font-semibold text-white mb-6 text-center text-xl">Preguntas frecuentes</h3>
          <div className="space-y-3 max-w-2xl mx-auto">
            {FAQ_PRECIOS.map((item) => (
              <FAQItem key={item.q} {...item} />
            ))}
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-10">
          Pagos procesados de forma segura por Wompi · Acepta tarjetas, PSE y más · Cancela cuando quieras
        </p>
      </div>
    </div>
  )
}
