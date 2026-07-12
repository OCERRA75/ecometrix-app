// src/components/ExportarFacturasERP.jsx
// Lista las facturas ya procesadas (extraídas por IA) que aún no se han
// exportado al ERP, permite seleccionarlas y descargar el CSV genérico.
// Al exportar, las marca como 'exportado' para no repetirlas la próxima vez.

import { useEffect, useState } from 'react'
import { supabase, getSession } from '../lib/supabase'

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconSpinner() {
  return <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
}

export default function ExportarFacturasERP() {
  const [facturas, setFacturas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionadas, setSeleccionadas] = useState([])
  const [exportando, setExportando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const cargarPendientes = async () => {
    setCargando(true)
    const { user } = await getSession()
    if (!user) { setCargando(false); return }

    const { data, error } = await supabase
      .from('facturas_procesadas')
      .select('*')
      .eq('user_id', user.id)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setFacturas(data)
      setSeleccionadas(data.map(f => f.id)) // pre-seleccionar todas
    }
    setCargando(false)
  }

  useEffect(() => { cargarPendientes() }, [])

  const toggleSeleccion = (id) => {
    setSeleccionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const exportar = async () => {
    const facturasAExportar = facturas.filter(f => seleccionadas.includes(f.id))
    if (facturasAExportar.length === 0) return

    setExportando(true)
    setMensaje('')
    try {
      const invoices = facturasAExportar.map(f => ({
        clasificacion: f.clasificacion,
        centroCosto: '',
      }))

      const res = await fetch('/api/internal?route=export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Error al generar el CSV')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ecometrix_export_erp.csv'
      a.click()
      URL.revokeObjectURL(url)

      // Marcar como exportadas
      const ids = facturasAExportar.map(f => f.id)
      await supabase.from('facturas_procesadas').update({ estado: 'exportado' }).in('id', ids)

      setMensaje(`${ids.length} factura(s) exportada(s) correctamente.`)
      await cargarPendientes()
    } catch (err) {
      setMensaje(`Error: ${err.message}`)
    } finally {
      setExportando(false)
    }
  }

  if (cargando) {
    return <p className="text-sm text-text-muted">Cargando facturas pendientes...</p>
  }

  if (facturas.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface-secondary/40 p-6 text-center">
        <p className="text-sm text-text-muted">No tienes facturas pendientes de exportar. Súbelas desde "Importar factura" en el cuestionario.</p>
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-text-primary">Exportar facturas a tu ERP</h3>
          <p className="text-sm text-text-muted mt-0.5">
            {facturas.length} factura(s) procesadas, listas para exportar en formato compatible con cualquier ERP (Odoo, Siesa, ICG, SAP B1, etc.).
          </p>
        </div>
        <button
          onClick={exportar}
          disabled={exportando || seleccionadas.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-300 text-white text-sm font-semibold hover:bg-brand-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          {exportando ? <IconSpinner /> : <IconDownload />}
          Exportar ({seleccionadas.length})
        </button>
      </div>

      {mensaje && (
        <p className={`text-sm mb-3 ${mensaje.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>{mensaje}</p>
      )}

      <div className="space-y-2">
        {facturas.map((f) => (
          <label
            key={f.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-surface-secondary/50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={seleccionadas.includes(f.id)}
              onChange={() => toggleSeleccion(f.id)}
              className="w-4 h-4 accent-brand-300"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{f.proveedor || 'Proveedor sin nombre'}</p>
              <p className="text-xs text-text-muted">
                {f.numero_factura ? `Factura ${f.numero_factura} · ` : ''}
                {f.fecha_emision || 'Sin fecha'}
                {f.total ? ` · $${Number(f.total).toLocaleString('es-CO')}` : ''}
              </p>
            </div>
          </label>
        ))}
      </div>
    </section>
  )
}
