import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '@/components/LanguageSelector.jsx'

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

const FAQS = [
  ['pricing.faq1q', 'pricing.faq1a'],
  ['pricing.faq2q', 'pricing.faq2a'],
  ['pricing.faq3q', 'pricing.faq3a'],
  ['pricing.faq4q', 'pricing.faq4a'],
  ['pricing.faq5q', 'pricing.faq5a'],
]

export default function Pricing() {
  const { user, plan } = useAuth()
  const { t } = useTranslation()

  const PLANES = [
    {
      id: 'free',
      nombre: 'Free',
      precio: '$0',
      periodo: t('pricing.always'),
      desc: t('pricing.freeDesc'),
      cta: t('pricing.startFree'),
      ctaLink: '/diagnostico',
      destacado: false,
      features: [
        t('pricing.free_f1'), t('pricing.free_f2'), t('pricing.free_f3'),
        t('pricing.free_f4'), t('pricing.free_f5'),
      ],
      noIncluye: [
        t('pricing.free_n1'), t('pricing.free_n2'), t('pricing.free_n3'),
        t('pricing.free_n4'), t('pricing.free_n5'), t('pricing.free_n6'),
      ]
    },
    {
      id: 'pro',
      nombre: 'Pro',
      precio: '$149.000',
      periodo: 'COP/mes',
      desc: t('pricing.proDesc'),
      cta: t('pricing.startTrial'),
      ctaLink: '/login',
      destacado: true,
      badge: t('pricing.popular'),
      features: [
        t('pricing.pro_f1'), t('pricing.pro_f2'), t('pricing.pro_f3'),
        t('pricing.pro_f4'), t('pricing.pro_f5'), t('pricing.pro_f6'),
        t('pricing.pro_f7'), t('pricing.pro_f8'), t('pricing.pro_f9'),
      ],
      noIncluye: [t('pricing.pro_n1'), t('pricing.pro_n2')]
    },
    {
      id: 'enterprise',
      nombre: 'Enterprise',
      precio: t('pricing.custom'),
      periodo: '',
      desc: t('pricing.enterpriseDesc'),
      cta: t('pricing.contactSales'),
      ctaLink: 'mailto:oscar@ecometrix.co',
      destacado: false,
      features: [
        t('pricing.ent_f1'), t('pricing.ent_f2'), t('pricing.ent_f3'),
        t('pricing.ent_f4'), t('pricing.ent_f5'), t('pricing.ent_f6'),
        t('pricing.ent_f7'), t('pricing.ent_f8'), t('pricing.ent_f9'),
      ],
      noIncluye: []
    },
  ]

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-brand-400 font-semibold text-sm">EcoMetriX</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm py-1.5 px-4">{t('nav.dashboard')}</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">{t('nav.login')}</Link>
                <Link to="/diagnostico" className="btn-primary text-sm py-1.5 px-4">{t('nav.freeDiagnosis')}</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <span className="badge-green mb-4 inline-block">{t('pricing.badge')}</span>
          <h1 className="text-4xl font-bold text-text-primary mb-4">{t('pricing.title')}</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANES.map(p => (
            <div key={p.id} className={`relative flex flex-col rounded-2xl border-2 overflow-hidden ${
              p.destacado ? 'border-brand-300 shadow-card-hover' : 'border-border bg-white'
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
                  }`}>{p.cta}</a>
                ) : (
                  <Link to={p.ctaLink} className={`w-full flex items-center justify-center py-2.5 rounded-xl font-medium text-sm transition-all ${
                    p.destacado ? 'bg-brand-400 text-white hover:bg-brand-300' : 'bg-surface-tertiary text-text-primary hover:bg-border'
                  }`}>{p.cta}</Link>
                )}
                {user && plan === p.id && (
                  <p className="text-center text-xs text-brand-400 font-medium mt-2">✓ {t('pricing.currentPlan')}</p>
                )}
              </div>
              <div className="p-6 flex-1 border-t border-border">
                <p className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wide">{t('pricing.includes')}</p>
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
                    <p className="text-xs font-semibold text-text-muted mb-2 mt-4 uppercase tracking-wide">{t('pricing.notIncludes')}</p>
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

        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-8 text-center mb-16">
          <p className="text-lg font-semibold text-brand-400 mb-2">{t('pricing.methodology')}</p>
          <p className="text-text-secondary text-sm">{t('pricing.methodologyDesc')}</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">{t('pricing.faq')}</h2>
          <div className="space-y-4">
            {FAQS.map(([qKey, aKey]) => (
              <div key={qKey} className="card">
                <p className="font-semibold text-text-primary text-sm mb-2">{t(qKey)}</p>
                <p className="text-text-secondary text-sm">{t(aKey)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-text-secondary mb-4">{t('pricing.enterpriseQuestion')}</p>
          <a href="mailto:oscar@ecometrix.co" className="btn-secondary">{t('pricing.contactSales')} →</a>
        </div>
      </main>
    </div>
  )
}
