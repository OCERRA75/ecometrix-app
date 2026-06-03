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

function Navbar({ scrolled }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const navLinks = [
    [t('landing.nav.howItWorks'), '#como-funciona'],
    [t('landing.nav.standards'), '#estandares'],
    [t('landing.nav.sectors'), '#sectores'],
    ['Precios', '#precios'],
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-border shadow-card' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-300 flex items-center justify-center shadow-sm"><IconLeaf /></div>
          <span className={`text-lg font-semibold transition-colors ${scrolled ? 'text-brand-400' : 'text-white'}`}>EcoMetriX</span>
        </div>
        <div className="hidden md:flex items-center gap-5">
          {navLinks.map(([label, href]) => (
            <a key={href} href={href} className={`text-sm font-medium transition-colors ${scrolled ? 'text-text-secondary hover:text-brand-400' : 'text-white/80 hover:text-white'}`}>{label}</a>
          ))}
          <a href="/precios" className={`text-sm font-medium transition-colors ${scrolled ? 'text-text-secondary hover:text-brand-400' : 'text-white/80 hover:text-white'}`}>{t('landing.nav.pricing')}</a>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <LanguageSelector dark={!scrolled} />
          <a href="/diagnostico" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-300 text-white text-sm font-medium hover:bg-brand-400 transition-all active:scale-95">
            {t('landing.nav.cta')} <IconArrow />
          </a>
        </div>
        <button onClick={() => setOpen(!open)} className={`md:hidden ${scrolled ? 'text-text-primary' : 'text-white'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d={open ? "M18 6L6 18M6 6l12 12" : "M3 12h18M3 6h18M3 18h18"} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-white border-b border-border px-6 py-4 flex flex-col gap-4">
          {navLinks.map(([label, href]) => (
            <a key={href} href={href} className="text-sm font-medium text-text-secondary" onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a href="/diagnostico" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-300 text-white text-sm font-medium">{t('landing.nav.cta')}</a>
        </div>
      )}
    </nav>
  )
}

function Hero() {
  const { t } = useTranslation()
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
            {t('landing.badge')}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {t('landing.headline')}{' '}
            <span className="text-brand-100">{t('landing.headlineAccent')}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/75 leading-relaxed mb-10 max-w-2xl">
            {t('landing.subheadline')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-14">
            <a href="/diagnostico" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-brand-400 text-base font-semibold hover:bg-brand-50 transition-all active:scale-95 shadow-lg">
              {t('landing.ctaPrimary')} <IconArrow />
            </a>
            <a href="#como-funciona" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white text-base font-medium hover:bg-white/20 transition-all">
              {t('landing.ctaSecondary')}
            </a>
          </div>
          <div className="flex flex-wrap gap-6">
            {[
              [t('landing.free'), t('landing.freeDesc')],
              [t('landing.fast'), t('landing.fastDesc')],
              [t('landing.pdf'), t('landing.pdfDesc')],
            ].map(([val, label]) => (
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
  const { t } = useTranslation()
  const stats = [
    { value: '15', unit: 'min', label: t('landing.statsMin') },
    { value: '3', unit: t('landing.statsScopes'), label: 'GHG Protocol' },
    { value: '100%', unit: '', label: t('landing.statsStandards') },
    { value: '$0', unit: '', label: t('landing.statsCost') },
  ]
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
  const { t } = useTranslation()
  const cards = [
    { emoji: '📊', title: t('landing.problem.card1Title'), desc: t('landing.problem.card1Desc'), accent: 'border-l-red-400' },
    { emoji: '💸', title: t('landing.problem.card2Title'), desc: t('landing.problem.card2Desc'), accent: 'border-l-amber-400' },
    { emoji: '📋', title: t('landing.problem.card3Title'), desc: t('landing.problem.card3Desc'), accent: 'border-l-purple-400' },
  ]
  return (
    <section className="py-20 bg-surface-secondary">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="badge-amber mb-4 inline-block">{t('landing.problem.badge')}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-5">{t('landing.problem.title')}</h2>
          <p className="text-text-secondary text-lg leading-relaxed">{t('landing.problem.desc')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map(({ emoji, title, desc, accent }) => (
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
  const { t } = useTranslation()
  const steps = [
    { num: '01', title: t('landing.steps.s1Title'), desc: t('landing.steps.s1Desc'), icon: '📋', time: '10 min' },
    { num: '02', title: t('landing.steps.s2Title'), desc: t('landing.steps.s2Desc'), icon: '🧮', time: t('landing.steps.auto') },
    { num: '03', title: t('landing.steps.s3Title'), desc: t('landing.steps.s3Desc'), icon: '📄', time: '< 2 min' },
  ]
  return (
    <section id="como-funciona" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="badge-green mb-4 inline-block">{t('landing.steps.badge')}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-5">{t('landing.steps.title')}</h2>
          <p className="text-text-secondary text-lg">{t('landing.steps.desc')}</p>
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
  const { t } = useTranslation()
  const standards = [
    { name: 'GHG Protocol', label: 'Corporate Standard', color: 'bg-brand-50 text-brand-400 border-brand-100' },
    { name: 'ISO 14064-1', label: '2018 Edition', color: 'bg-brand-50 text-brand-400 border-brand-100' },
    { name: 'CSRD / ESRS', label: 'EU Regulation', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { name: 'EU Taxonomy', label: 'Sustainable Finance', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { name: 'IPCC AR6', label: 'Emission Factors', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  ]
  const reportItems = [
    [t('landing.standards.scope1'), t('landing.standards.scope1Desc')],
    [t('landing.standards.scope2'), t('landing.standards.scope2Desc')],
    [t('landing.standards.benchmark'), t('landing.standards.benchmarkDesc')],
    [t('landing.standards.plan'), t('landing.standards.planDesc')],
    [t('landing.standards.valuation'), t('landing.standards.valuationDesc')],
  ]
  return (
    <section id="estandares" className="py-20 bg-surface-secondary">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="badge-gray mb-4 inline-block">{t('landing.standards.badge')}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-5">{t('landing.standards.title')}</h2>
            <p className="text-text-secondary text-lg leading-relaxed mb-8">{t('landing.standards.desc')}</p>
            <div className="flex flex-wrap gap-3 mb-6">
              {standards.map(({ name, label, color }) => (
                <div key={name} className={`inline-flex flex-col px-4 py-2.5 rounded-xl border ${color}`}>
                  <span className="font-semibold text-sm">{name}</span>
                  <span className="text-xs opacity-70">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-text-muted">{t('landing.standards.coming')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-8 shadow-card">
            <h3 className="font-semibold text-text-primary mb-6">{t('landing.standards.reportTitle')}</h3>
            <div className="space-y-4">
              {reportItems.map(([title, desc]) => (
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
  const { t } = useTranslation()
  const sectors = [
    t('landing.sectors.manufacturing'), t('landing.sectors.retail'),
    t('landing.sectors.logistics'), t('landing.sectors.services'),
    t('landing.sectors.food'), t('landing.sectors.construction'),
    t('landing.sectors.tech'), t('landing.sectors.health'),
  ]
  const benefits = [
    t('landing.benefits.b1'), t('landing.benefits.b2'),
    t('landing.benefits.b3'), t('landing.benefits.b4'),
    t('landing.benefits.b5'), t('landing.benefits.b6'),
  ]
  return (
    <section id="sectores" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="badge-green mb-4 inline-block">{t('landing.benefits.badge')}</span>
            <h2 className="text-3xl font-bold text-text-primary mb-5">{t('landing.benefits.title')}</h2>
            <p className="text-text-secondary leading-relaxed mb-8">{t('landing.benefits.desc')}</p>
            <div className="grid grid-cols-4 gap-2">
              {sectors.map(s => (
                <div key={s} className="px-3 py-2 rounded-lg bg-surface-tertiary text-text-secondary text-xs font-medium text-center">{s}</div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {benefits.map(b => (
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


function SocialProof() {
  const testimonials = [
    {
      quote: 'En menos de 15 minutos tuvimos nuestro reporte de huella de carbono listo. Nunca pensé que fuera tan fácil.',
      name: 'María González',
      role: 'Gerente de Operaciones',
      company: 'Textiles del Norte',
      sector: 'Manufactura',
      initial: 'M',
    },
    {
      quote: 'El certificado EcoMetriX nos abrió puertas en licitaciones donde antes nos pedían reportes de sostenibilidad carísimos.',
      name: 'Carlos Ramos',
      role: 'Director General',
      company: 'LogiCaribe S.A.S.',
      sector: 'Logística',
      initial: 'C',
    },
    {
      quote: 'Lo usamos cada mes para rastrear nuestras emisiones. El plan de reducción nos ayudó a bajar un 18% en 6 meses.',
      name: 'Luisa Herrera',
      role: 'Coordinadora ESG',
      company: 'Grupo Comercial Andino',
      sector: 'Retail',
      initial: 'L',
    },
  ]

  return (
    <section className="py-20 bg-surface-secondary">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="badge-green mb-4 inline-block">Casos de éxito</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-5">
            PyMEs colombianas ya miden su impacto
          </h2>
          <p className="text-text-secondary text-lg">
            Más de 100 empresas han generado su reporte de sostenibilidad con EcoMetriX.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name, role, company, sector, initial }) => (
            <div key={name} className="bg-white rounded-2xl border border-border p-6 shadow-card flex flex-col">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="#10b981" className="w-4 h-4">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-1">"{quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-300 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{name}</p>
                  <p className="text-xs text-text-muted">{role} · {company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-50">
          {['GHG Protocol', 'ISO 14064', 'CSRD/ESRS', 'IPCC AR6', 'Science Based Targets'].map(s => (
            <span key={s} className="text-sm font-semibold text-text-muted">{s}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingPreview() {
  const planes = [
    {
      nombre: 'Básico',
      precio: '$79.000',
      desc: 'Para PyMEs que quieren medir y certificar su huella.',
      features: ['Diagnósticos ilimitados', 'Reporte PDF', 'Certificación EcoMetriX', 'Dashboard 360°'],
      cta: 'Empezar con Básico',
      highlight: false,
    },
    {
      nombre: 'Pro',
      precio: '$199.000',
      desc: 'Para empresas que quieren reducir emisiones activamente.',
      features: ['Todo lo del Básico', 'Plan de reducción mensual', 'Módulo CSRD/ESRS', 'Acceso API'],
      cta: 'Empezar con Pro',
      highlight: true,
      badge: 'Más popular',
    },
    {
      nombre: 'Enterprise',
      precio: '$499.000',
      desc: 'Para grupos empresariales y grandes organizaciones.',
      features: ['Todo lo del Pro', 'Múltiples usuarios', 'API ilimitada', 'SLA garantizado'],
      cta: 'Contactar ventas',
      highlight: false,
    },
  ]

  return (
    <section id="precios" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="badge-gray mb-4 inline-block">Precios</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-5">
            Planes para cada etapa
          </h2>
          <p className="text-text-secondary text-lg">
            Empieza gratis. Escala cuando lo necesites.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {planes.map((plan) => (
            <div
              key={plan.nombre}
              className={`relative rounded-2xl p-6 flex flex-col border-2 ${
                plan.highlight
                  ? 'border-brand-300 bg-brand-400 text-white shadow-xl'
                  : 'border-border bg-white'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-100 text-brand-400 text-xs font-semibold px-3 py-1 rounded-full border border-brand-200">
                    {plan.badge}
                  </span>
                </div>
              )}
              <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-text-primary'}`}>
                {plan.nombre}
              </h3>
              <p className={`text-xs mb-4 ${plan.highlight ? 'text-white/70' : 'text-text-muted'}`}>
                {plan.desc}
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-text-primary'}`}>
                  {plan.precio}
                </span>
                <span className={`text-sm ${plan.highlight ? 'text-white/60' : 'text-text-muted'}`}>/mes</span>
              </div>
              <div className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? 'white' : '#10b981'} strokeWidth={2.5} className="w-4 h-4 flex-shrink-0">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={`text-sm ${plan.highlight ? 'text-white/90' : 'text-text-secondary'}`}>{f}</span>
                  </div>
                ))}
              </div>
              <a
                href="/precios"
                className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all ${
                  plan.highlight
                    ? 'bg-white text-brand-400 hover:bg-brand-50'
                    : 'bg-brand-300 text-white hover:bg-brand-400'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-text-muted text-xs mt-8">
          Diagnóstico gratuito para empezar · Sin tarjeta de crédito · Cancela cuando quieras
        </p>
      </div>
    </section>
  )
}

function CTASection() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [sector, setSector] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const sectors = [
    t('landing.sectors.manufacturing'), t('landing.sectors.retail'),
    t('landing.sectors.logistics'), t('landing.sectors.services'),
    t('landing.sectors.food'), t('landing.sectors.construction'),
    t('landing.sectors.tech'), t('landing.sectors.health'),
  ]

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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">{t('landing.cta.title')}</h2>
          <p className="text-white/75 text-lg leading-relaxed">{t('landing.cta.desc')}</p>
        </div>
        <div className="max-w-lg mx-auto">
          {submitted ? (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-white font-semibold text-xl mb-2">{t('landing.cta.successTitle')}</h3>
              <p className="text-white/70 text-sm">{t('landing.cta.successDesc')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/10 border border-white/20 rounded-2xl p-8 space-y-4 backdrop-blur-sm">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">{t('landing.cta.companyLabel')}</label>
                <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder={t('landing.cta.companyPlaceholder')} required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition" />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">{t('landing.cta.emailLabel')}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.com" required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition" />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">{t('landing.cta.sectorLabel')}</label>
                <select value={sector} onChange={e => setSector(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition">
                  <option value="" className="text-gray-800">{t('landing.cta.sectorPlaceholder')}</option>
                  {sectors.map(s => <option key={s} value={s} className="text-gray-800">{s}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-white text-brand-400 font-semibold text-sm hover:bg-brand-50 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" /> : <>{t('landing.cta.submit')} <IconArrow /></>}
              </button>
              <p className="text-white/50 text-xs text-center">{t('landing.cta.privacy')}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-brand-500 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-white font-semibold">EcoMetriX</span>
          </div>
          <p className="text-white/50 text-sm text-center">{t('landing.footer.tagline')}</p>
          <div className="flex items-center gap-4">
            <LanguageSelector dark={true} />
            <span className="text-white/20">·</span>
            <a href="mailto:oscar@ecometrix.co" className="text-white/60 hover:text-white text-sm transition-colors">oscar@ecometrix.co</a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-white/30 text-xs">{t('landing.footer.copy')}</p>
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
      <SocialProof />
      <PricingPreview />
      <CTASection />
      <Footer />
    </div>
  )
}
