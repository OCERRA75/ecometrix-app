// M2 — Landing page completa se construye en el siguiente módulo
export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-brand-300 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-brand-400">EcoMetriX</span>
        </div>
        <h1 className="text-3xl font-semibold text-text-primary mb-3">Setup completado ✓</h1>
        <p className="text-text-secondary mb-6">React + Vite + Tailwind funcionando.<br/>Landing page se construye en M2.</p>
        <span className="badge-green">ecometrix-co.netlify.app</span>
      </div>
    </div>
  )
}
