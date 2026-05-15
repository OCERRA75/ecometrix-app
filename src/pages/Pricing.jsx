import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-brand-400">
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PLANES = [
  {
    id: 'free',
    nombre: 'Free',
    precio: '$0',
    periodo: 'siempre',
    desc: 'Para conocer tu huella de carbono por primera vez',
    cta: 'Empezar gratis',
    ctaLink: '/diagnostico',
    destacado: false,
    features: [
      '1 diagnóstico por mes',
      'Alcances 1 y 2',
      'Reporte PDF básico',
      'Entrega por email',
      'Benchmarks sectoriales',
    ],
    noIncluye: [
      'Alcance 3 (cadena de valor)',
      'Dashboard 360°',
      'Módulo CSRD/ESRS',
      'Historial de diagnósticos',
      'Asistente IA conversacional',
      'Soporte prioritario',
    ]
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: '$149.000',
    periodo: 'COP/mes',
    desc: 'Para empresas que quieren gestionar su sostenibilidad activamente',
    cta: 'Iniciar prueba 14 días',
    ctaLink: '/login',
    destacado: true,
    badge: 'Más popular',
    features: [
      'Diagnósticos ilimitados',
      'Alcances 1, 2 y 3 completos',
      'Reporte PDF profesional con IA',
      'Dashboard Sostenibilidad 360°',
      'Módulo CSRD/ESRS',
      'Historial y comparativas',
      'Asistente IA conversacional',
      'Export de datos (PDF, XLSX)',
      'Soporte por email 48h',
    ],
    noIncluye: [
      'White-label / API',
      'Verificación externa',
    ]
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio: 'A medida',
    periodo: '',
    desc: 'Para grupos empresariales, consultoras y organismos',
    cta: 'Contactar ventas',
    ctaLink: 'mailto:oscar@ecometrix.co',
    destacado: false,
    features: [
      'Todo lo de Pro',
      'Multi-empresa (hasta 50 sedes)',
      'White-label con tu marca',
      'API REST documentada',
      'Integración ERP/CRM',
      'Verificación externa incluida',
      'Reporte XBRL para CSRD',
      'SLA garantizado',
      'Account manager dedicado',
    ],
    noIncluye: []
  },
]

const FAQS = [
  ['¿Necesito tarjeta de crédito para el plan Free?', 'No. El plan Free es completamente gratuito y no requiere datos de pago.'],
  ['¿El diagnóstico es preciso sin Claude API?', 'Sí. El cálculo GHG usa factores IPCC AR6 directamente — la IA mejora la narrativa del reporte, pero los números son precisos.'],
  ['¿Puedo cambiar de plan en cualquier momento?', 'Sí. Puedes hacer upgrade o downgrade en cualquier momento desde tu dashboard.'],
  ['¿Los datos de mi empresa son privados?', 'Sí. Cada empresa tiene su propio espacio aislado con Row-Level Security en Supabase. Nadie más puede ver tus datos.'],
  ['¿Aceptan pagos desde Colombia?', 'Aceptamos tarjetas internacionales (Visa, Mastercard) y próximamente PSE y Wompi para Colombia.'],
]

export default function Pricing() {
  const { user, plan } = useAuth()

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-brand-400 font-semibold text-sm">EcoMetriX</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm py-1.5 px-4">Mi dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Iniciar sesión</Link>
                <Link to="/diagnostico" className="btn-primary text-sm py-1.5 px-4">Diagnóstico gratis</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <span className="badge-green mb-4 inline-block">Planes y precios</span>
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Mide, gestiona y reporta<br />tu huella de carbono
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Desde el primer diagnóstico gratuito hasta el cumplimiento CSRD completo.
            Sin contratos largos, sin sorpresas.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANES.map(p => (
            <div key={p.id} className={`relative flex flex-col rounded-2xl border-2 overflow-hidden ${
              p.destacado
                ? 'border-brand-300 shadow-card-hover'
                : 'border-border bg-white'
            }`}>
              {p.badge && (
                <div className="absolute top-0 left-0 right-0 bg-brand-300 text-white text-xs font-semibold text-center py-1.5">
                  {p.badge}
                </div>
              )}

              <div className={`p-6 ${p.destacado ? 'bg-brand-50 pt-10' : 'pt-6'}`}>
                <h3 className="text-lg font-bold text-text-primary mb-1">{p.nombre}</h3>
                <p className="text-sm text-text-secondary mb-4">{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-text-primary">{p.precio}</span>
                  {p.periodo && <span className="text-sm text-text-muted">{p.periodo}</span>}
                </div>

                {p.ctaLink.startsWith('mailto:') ? (
                  <a href={p.ctaLink} className={`w-full flex items-center justify-center py-2.5 rounded-xl font-medium text-sm transition-all ${
                    p.destacado ? 'bg-brand-400 text-white hover:bg-brand-300' : 'bg-surface-tertiary text-text-primary hover:bg-border'
                  }`}>
                    {p.cta}
                  </a>
                ) : (
                  <Link to={p.ctaLink} className={`w-full flex items-center justify-center py-2.5 rounded-xl font-medium text-sm transition-all ${
                    p.destacado ? 'bg-brand-400 text-white hover:bg-brand-300' : 'bg-surface-tertiary text-text-primary hover:bg-border'
                  }`}>
                    {p.cta}
                  </Link>
                )}

                {user && plan === p.id && (
                  <p className="text-center text-xs text-brand-400 font-medium mt-2">✓ Plan actual</p>
                )}
              </div>

              <div className="p-6 flex-1 border-t border-border">
                <p className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wide">Incluye</p>
                <ul className="space-y-2.5 mb-4">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 mt-0.5"><IconCheck /></div>
                      <span className="text-sm text-text-primary">{f}</span>
                    </li>
                  ))}
                </ul>

                {p.noIncluye.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-text-muted mb-2 mt-4 uppercase tracking-wide">No incluye</p>
                    <ul className="space-y-1.5">
                      {p.noIncluye.map(f => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="text-text-muted text-sm flex-shrink-0 mt-0.5">—</span>
                          <span className="text-sm text-text-muted">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-8 text-center mb-16">
          <p className="text-lg font-semibold text-brand-400 mb-2">
            Metodología certificable · GHG Protocol + ISO 14064 + CSRD
          </p>
          <p className="text-text-secondary text-sm">
            Los mismos estándares que usan las empresas Fortune 500, accesibles para cualquier PYME latinoamericana.
          </p>
        </div>

        {/* FAQs */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {FAQS.map(([q, a]) => (
              <div key={q} className="card">
                <p className="font-semibold text-text-primary text-sm mb-2">{q}</p>
                <p className="text-text-secondary text-sm">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="text-center mt-16">
          <p className="text-text-secondary mb-4">¿Tienes preguntas sobre el plan Enterprise?</p>
          <a href="mailto:oscar@ecometrix.co" className="btn-secondary">
            Hablar con ventas →
          </a>
        </div>

      </main>
    </div>
  )
}
