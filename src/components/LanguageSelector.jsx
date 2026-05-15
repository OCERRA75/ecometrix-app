import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/lib/i18n.js'

export default function LanguageSelector({ dark = false }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  const change = (code) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          dark
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
        }`}
      >
        <span>{current.flag}</span>
        <span className="hidden sm:block">{current.code.toUpperCase()}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-border rounded-xl shadow-modal z-50 overflow-hidden">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => change(lang.code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-surface-tertiary ${
                  lang.code === i18n.language ? 'text-brand-400 font-medium bg-brand-50' : 'text-text-primary'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                {lang.code === i18n.language && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3 ml-auto text-brand-400">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
