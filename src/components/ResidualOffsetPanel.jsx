// src/components/ResidualOffsetPanel.jsx
// Sección informativa dentro del dashboard ESG: muestra la huella residual
// y enlaza a programas de compensación certificados externos (ACORN, Verra).
// No procesa pagos ni transacciones — solo informa y redirige, sin
// responsabilidad de intermediación para EcoMetriX.

const PROGRAMAS = [
  {
    nombre: 'ACORN (Rabobank)',
    descripcion: 'Créditos de carbono generados por pequeños agricultores en transición a agroforestería, verificados con imágenes satelitales y certificados por Plan Vivo.',
    url: 'https://acorn.rabobank.com/en/',
    etiqueta: 'Agroforestería · Plan Vivo',
  },
  {
    nombre: 'Verra (VCS / VM0047)',
    descripcion: 'El estándar de créditos de carbono voluntario más usado globalmente. VM0047 certifica proyectos de forestación, reforestación y revegetación.',
    url: 'https://verra.org/methodologies/vm0047-afforestation-reforestation-and-revegetation-v1-1/',
    etiqueta: 'Forestación · VCS',
  },
]

function IconLeaf() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path d="M11 20A7 7 0 0 1 4 13V8a2 2 0 0 1 2-2h1a7 7 0 0 1 7 7v1a2 2 0 0 1-2 2h-1z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 20v-9" strokeLinecap="round"/>
      <path d="M4 4a16 16 0 0 1 16 16" strokeLinecap="round"/>
    </svg>
  )
}

function IconExternalLink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// huellaResidualTon: número en toneladas de CO2e que quedan después de reducciones aplicadas
export default function ResidualOffsetPanel({ huellaResidualTon }) {
  if (!huellaResidualTon || huellaResidualTon <= 0) return null

  return (
    <section className="rounded-2xl border border-border bg-surface-secondary/40 p-6">
      <div className="flex items-start gap-3 mb-1">
        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <IconLeaf />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Compensación de tu huella residual</h3>
          <p className="text-sm text-text-muted mt-0.5">
            Tu empresa emite actualmente{' '}
            <span className="font-semibold text-text-primary">{huellaResidualTon.toLocaleString('es-CO')} ton CO2e</span>{' '}
            al año. Estos son programas certificados donde puedes compensarla comprando créditos de carbono directamente.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {PROGRAMAS.map((p) => (
          <a
            key={p.nombre}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-border bg-white p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">{p.nombre}</span>
              <span className="text-text-muted group-hover:text-emerald-600 transition-colors">
                <IconExternalLink />
              </span>
            </div>
            <span className="inline-block mt-1.5 mb-2 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {p.etiqueta}
            </span>
            <p className="text-xs text-text-muted leading-relaxed">{p.descripcion}</p>
          </a>
        ))}
      </div>

      <p className="text-xs text-text-muted mt-4">
        Estos son programas de terceros, independientes de EcoMetriX. No procesamos ni intermediamos la compra de
        créditos — solo te conectamos con la información oficial de cada uno.
      </p>
    </section>
  )
}
