// src/pages/ExportarERP.jsx
import { Link } from 'react-router-dom'
import ExportarFacturasERP from '@/components/ExportarFacturasERP.jsx'

export default function ExportarERP() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-semibold text-text-primary">EcoMetriX</span>
          </div>
          <Link to="/dashboard" className="text-sm text-text-muted hover:text-text-primary transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-1">Exportar facturas a tu ERP</h1>
          <p className="text-text-secondary text-sm">
            Facturas de proveedores procesadas con IA, listas para inyectar a Odoo, Siesa, ICG, SAP Business One u otro ERP con importación CSV.
          </p>
        </div>

        <ExportarFacturasERP />
      </main>
    </div>
  )
}
