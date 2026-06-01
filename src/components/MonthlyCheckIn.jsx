// src/components/MonthlyCheckIn.jsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase.js'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
  </svg>
)

export default function MonthlyCheckIn({ registro, onClose, onGuardado }) {
  const [realKgco2, setRealKgco2] = useState(registro.real_kgco2 ?? '')
  const [nota, setNota] = useState(registro.nota ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const diferencia = realKgco2 !== '' ? registro.meta_kgco2 - Number(realKgco2) : null
  const pctReduccion = diferencia !== null ? ((diferencia / registro.meta_kgco2) * 100).toFixed(1) : null
  const enMeta = diferencia !== null && diferencia >= 0

  async function guardar() {
    if (realKgco2 === '' || isNaN(Number(realKgco2))) {
      setError('Ingresa un valor válido en kg CO₂')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/save-monthly-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          diagnostico_id: registro.diagnostico_id,
          mes: registro.mes,
          anio: registro.anio,
          real_kgco2: Number(realKgco2),
          nota: nota || null,
        }),
      })

      const json = await res.json()
      if (!json.ok) throw new Error(json.message || 'Error al guardar')

      onGuardado()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="font-semibold text-white">Check-in mensual</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{MESES[registro.mes - 1]} {registro.anio}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <IconX />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Meta referencia */}
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <p className="text-xs text-zinc-500">Meta del mes</p>
            <p className="text-lg font-semibold text-white mt-0.5">
              {registro.meta_kgco2?.toLocaleString()} <span className="text-zinc-500 text-sm font-normal">kg CO₂</span>
            </p>
            {registro.acciones?.length > 0 && (
              <p className="text-xs text-zinc-500 mt-1">↳ {registro.acciones[0]}</p>
            )}
          </div>

          {/* Input real */}
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">
              Emisiones reales del mes (kg CO₂)
            </label>
            <input
              type="number"
              min="0"
              value={realKgco2}
              onChange={e => setRealKgco2(e.target.value)}
              placeholder="Ej: 4800"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>

          {/* Vista previa semáforo */}
          {diferencia !== null && (
            <div className={`rounded-xl p-3 border ${
              enMeta
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <p className={`text-sm font-medium ${enMeta ? 'text-emerald-400' : 'text-red-400'}`}>
                {enMeta
                  ? `✓ ${Math.abs(Number(pctReduccion))}% por debajo de la meta`
                  : `↑ ${Math.abs(Number(pctReduccion))}% sobre la meta`
                }
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {enMeta
                  ? `Ahorraste ${diferencia.toLocaleString()} kg CO₂ vs la meta`
                  : `Excediste la meta en ${Math.abs(diferencia).toLocaleString()} kg CO₂`
                }
              </p>
            </div>
          )}

          {/* Nota opcional */}
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">
              Nota (opcional) — ¿qué influyó este mes?
            </label>
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Ej: Aumentamos producción en 15%, por eso subió el consumo de combustible..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar progreso'}
          </button>
        </div>
      </div>
    </div>
  )
}
