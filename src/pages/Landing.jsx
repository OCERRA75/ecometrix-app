import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '@/components/LanguageSelector.jsx'

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconCheck = ({ white }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={white ? "white" : "currentColor"} strokeWidth={2.5} className="w-3.5 h-3.5">
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const steps = [
  { num: '01', title: 'Responde el cuestionario', desc: 'La IA te hace 15 preguntas inteligentes adaptadas a tu sector. Sin tecnicismos, sin hojas de cálculo.', icon: '📋', time: '10 min' },
  { num: '02', title: 'Calculamos tu huella', desc: 'El motor calcula tus emisiones en Alcances 1 y 2 usando factores IPCC AR6 y el GHG Protocol Corporate Standard.', icon: '🧮', time: 'Automático' },
  { num: '03', title: 'Recibes tu reporte PDF', desc: 'Diagnóstico completo, benchmark sectorial y un plan de reducción con 5 acciones priorizadas por ROI.', icon: '📄', time: '< 2 min' },
]

const standards = [
  { name: 'GHG Protocol', label: 'Corporate Standard', color: 'bg-brand-50 text-brand-400 border-brand-100' },
  { name: 'ISO 14064-1', label: '2018 Edition', color: 'bg-brand-50 text-brand-400 border-brand-100' },
  { name: 'CSRD / ESRS', label: 'EU Regulation', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { name: 'EU Taxonomy', label: 'Sustainable Finance', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { name: 'IPCC AR6', label: 'Emission Factors', color: 'bg-amber-50 text-amber-700 border-amber-100' },
]

const sectors = ['Manufactura', 'Retail', 'Logística', 'Servicios', 'Alimentos', 'Construcción', 'Tecnología', 'Salud']

const stats = [
  { value: '15', unit: 'min', label: 'Para completar el diagnóstico' },
  { value: '3', unit: 'Alcances', label: 'GHG Protocol cubiertos' },
  { value: '100%', unit: '', label: 'Estándares internacionales' },
  { value: '$0', unit: '', label: 'Costo del piloto' },
]

function Navbar({ scrolled }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-border shadow-card' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-300 flex items-center justify-center shadow-sm"><IconLeaf /></div>
          <span className={`text-lg font-semibold transition-colors ${scrolled ? 'text-brand-400' : 'text-white'}`}>EcoMetriX</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Cómo funciona', 'Estándares', 'Sectores'].map(item => (
            <a key={item} href="#" className={`text-sm font-medium transition-colors ${scrolled ? 'text-text-secondary hover:text-brand-400' : 'text-white/80 hover:text-white'}`}>{item}</a>
          ))}
          <a href="/precios" className={`text-sm font-medium transition-colors ${scrolled ? 'text-text-secondary hover:text-brand-400' : 'text-white/80 hover:text-white'}`}>Precios</a>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <LanguageSelector dark={!scrolled} />
          <a href="/diagnostico" className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-300 text-white text-sm font-medium hover:bg-brand-400 transition-all active:scale-95">
          Diagnóstico gratis <IconArrow />
        </a>
        <button onClick={() => setOpen(!open)} className={`md:hidden ${scrolled ? 'text-text-primary' : 'text-white'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d={open ? "M18 6L6 18M6 6l12 12" : "M3 12h18M3 6h18M3 18h18"} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-white border-b border-border px-6 py-4 flex flex-col gap-4">
          {['Cómo funciona', 'Estándares', 'Sectores'].map(item => (
            <a key={item} href="#" className="text-sm font-medium text-text-secondary">{item}</a>
          ))}
          <a href="/diagnostico" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-300 text-white text-sm font-medium">Diagnóstico gratis</a>
        </div>
      )}
    </nav>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-400">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1200 800" className="absolute -top-20 -right-40 w-[700px] opacity-10" fill="white">
          <ellipse cx="600" cy="400" rx="350" ry="300"/>
        </svg>
        <svg viewBox="0 0 800 600" className="absolute -bottom-20 -left-20 w-[500px] opacity-10" fill="white">
          <ellipse cx="400" cy="300" rx="300" ry="250"/>
        </svg>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-100 animate-pulse" />
            GHG Protocol · ISO 14064 · CSRD Ready
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Mide tu huella de carbono{' '}
            <span className="text-brand-100">en 10 minutos</span>
          </h1>
          <p className="text-lg md:text-xl text-white/75 leading-relaxed mb-10 max-w-2xl">
            EcoMetriX diagnostica las emisiones de tu empresa usando inteligencia artificial y los estándares más rigurosos del mundo. Obtén un reporte profesional listo para clientes, inversores y reguladores.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-14">
            <a href="/diagnostico" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-brand-400 text-base font-semibold hover:bg-brand-50 transition-all active:scale-95 shadow-lg">
              Iniciar diagnóstico gratis <IconArrow />
            </a>
            <a href="#como-funciona" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white text-base font-medium hover:bg-white/20 transition-all">
              Ver cómo funciona
            </a>
          </div>
          <div className="flex flex-wrap gap-6">
            {[['Sin costo', 'Piloto gratuito'], ['< 15 min', 'Para completar'], ['PDF incluido', 'Reporte profesional']].map(([val, label]) => (
              <div key={val} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><IconCheck white /></div>
                <span className="text-white font-semibold text-sm">{val}</span>
                <span className="text-white/60 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsBar() {
  return (
    <section className="bg-white border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, unit, label }) => (
            <div key={label} className="text-center">
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-3xl font-bold text-brand-400">{value}</span>
                {unit && <span className="text-sm font-medium text-brand-300">{unit}</span>}
              </div>
              <p className="text-sm text-text-secondary">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Problem() {
  return (
    <section className="py-20 bg-surface-secondary">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="badge-amber mb-4 inline-block">El problema</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-5">Medir la huella de carbono era complicado y costoso</h2>
          <p className="text-text-secondary text-lg leading-relaxed">Las PYMEs no tienen consultores de sostenibilidad ni presupuestos para certificaciones. Pero clientes, inversores y reguladores cada vez exigen más.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { emoji: '📊', title: 'Hojas de cálculo complejas', desc: 'Los métodos tradicionales requieren semanas de trabajo manual con fórmulas del GHG Protocol que pocos entienden.', accent: 'border-l-red-400' },
            { emoji: '💸', title: 'Consultorías inaccesibles', desc: 'Una consultoría de huella de carbono cuesta entre $5.000 y $30.000 USD. Fuera del alcance de la mayoría de PYMEs.', accent: 'border-l-amber-400' },
            { emoji: '📋', title: 'Regulación que avanza', desc: 'La CSRD europea ya obliga a reportar sostenibilidad. Colombia y Latam avanzan en la misma dirección.', accent: 'border-l-purple-400' },
          ].map(({ emoji, title, desc, accent }) => (
            <div key={title} className={`card border-l-4 ${accent}`}>
              <span className="text-3xl mb-4 block">{emoji}</span>
              <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="badge-green mb-4 inline-block">Cómo funciona</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-5">De cero a reporte profesional en 3 pasos</h2>
          <p className="text-text-secondary text-lg">Sin consultores, sin hojas de cálculo. Solo responde y la IA hace el resto.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ title, desc, icon, time }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 border-2 border-brand-100 flex items-center justify-center mb-6 text-3xl">{icon}</div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-400 text-xs font-medium mb-3">
                <span className="w-1 h-1 rounded-full bg-brand-300" />{time}
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">{title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Standards() {
  return (
    <section id="estandares" className="py-20 bg-surface-secondary">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="badge-gray mb-4 inline-block">Estándares internacionales</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-5">Metodología de clase mundial, accesible para tu empresa</h2>
            <p className="text-text-secondary text-lg leading-relaxed mb-8">EcoMetriX aplica los mismos estándares que usan las empresas Fortune 500, adaptados para que cualquier PYME pueda cumplirlos.</p>
            <div className="flex flex-wrap gap-3 mb-6">
              {standards.map(({ name, label, color }) => (
                <div key={name} className={`inline-flex flex-col px-4 py-2.5 rounded-xl border ${color}`}>
                  <span className="font-semibold text-sm">{name}</span>
                  <span className="text-xs opacity-70">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-text-muted">Próximamente: CDP Climate Disclosure · SBTi · GRI Standards</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-8 shadow-card">
            <h3 className="font-semibold text-text-primary mb-6">Tu reporte incluye</h3>
            <div className="space-y-4">
              {[
                ['Alcance 1', 'Emisiones directas — combustibles, flota, refrigerantes'],
                ['Alcance 2', 'Energía indirecta — electricidad, vapor, calor'],
                ['Benchmark', 'Comparativa con empresas de tu sector'],
                ['Plan de acción', '5 acciones priorizadas por ROI y facilidad'],
                ['Valoración económica', 'Tu huella en toneladas CO2e y valor EU ETS'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-brand-400"><IconCheck /></div>
                  <p className="text-sm text-text-primary"><span className="font-medium">{title}</span><span className="text-text-muted"> — {desc}</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Benefits() {
  return (
    <section id="sectores" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="badge-green mb-4 inline-block">Para empresas</span>
            <h2 className="text-3xl font-bold text-text-primary mb-5">Diseñado para cualquier sector</h2>
            <p className="text-text-secondary leading-relaxed mb-8">Nuestro cuestionario adaptativo detecta tu sector y ajusta preguntas y factores de emisión correspondientes.</p>
            <div className="grid grid-cols-4 gap-2">
              {sectors.map(s => (
                <div key={s} className="px-3 py-2 rounded-lg bg-surface-tertiary text-text-secondary text-xs font-medium text-center">{s}</div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {[
              'Diagnóstico completo en menos de 15 minutos',
              'Reporte PDF profesional entregado por email',
              'Metodología GHG Protocol + ISO 14064 certificable',
              'Plan de reducción personalizado por sector',
              'Sin instalación, sin contratos, sin complicaciones',
              'Preparado para cumplimiento CSRD europeo',
            ].map(b => (
              <div key={b} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-300 flex items-center justify-center flex-shrink-0 mt-0.5"><IconCheck white /></div>
                <p className="text-text-primary text-sm leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const [email, setEmail] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [sector, setSector] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !empresa) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <section id="diagnostico" className="py-20 bg-brand-400">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">Únete al piloto gratuito</h2>
          <p className="text-white/75 text-lg leading-relaxed">Sé una de las primeras empresas en medir su huella de carbono con EcoMetriX. Sin costo, sin compromiso. Solo resultados.</p>
        </div>
        <div className="max-w-lg mx-auto">
          {submitted ? (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-white font-semibold text-xl mb-2">¡Listo! Te contactamos pronto</h3>
              <p className="text-white/70 text-sm">Revisaremos tu solicitud y te enviaremos el acceso al diagnóstico en menos de 24 horas.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/10 border border-white/20 rounded-2xl p-8 space-y-4 backdrop-blur-sm">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">Nombre de tu empresa *</label>
                <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Ej: Textiles del Norte SAS" required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition" />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">Correo corporativo *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.com" required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition" />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">Sector</label>
                <select value={sector} onChange={e => setSector(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition">
                  <option value="" className="text-gray-800">Selecciona tu sector</option>
                  {sectors.map(s => <option key={s} value={s} className="text-gray-800">{s}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-white text-brand-400 font-semibold text-sm hover:bg-brand-50 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" /> : <>Solicitar diagnóstico gratuito <IconArrow /></>}
              </button>
              <p className="text-white/50 text-xs text-center">Sin spam. Solo te contactamos para coordinar el diagnóstico.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-brand-500 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-white font-semibold">EcoMetriX</span>
          </div>
          <p className="text-white/50 text-sm text-center">Plataforma de huella de carbono basada en GHG Protocol e ISO 14064</p>
          <div className="flex items-center gap-4">
            <a href="mailto:oscar@ecometrix.co" className="text-white/60 hover:text-white text-sm transition-colors">oscar@ecometrix.co</a>
            <span className="text-white/20">·</span>
            <span className="text-white/60 text-sm">ecometrix-co.netlify.app</span>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-white/30 text-xs">© 2026 EcoMetriX · Barranquilla, Colombia · Todos los derechos reservados</p>
        </div>
      </div>
    </footer>
  )
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <div className="min-h-screen">
      <Navbar scrolled={scrolled} />
      <Hero />
      <StatsBar />
      <Problem />
      <HowItWorks />
      <Standards />
      <Benefits />
      <CTASection />
      <Footer />
    </div>
  )
}
