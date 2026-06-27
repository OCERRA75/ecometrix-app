// src/components/InvoiceImporter.jsx
// Modal para importar datos desde facturas PDF/imagen
// Usa AWS Textract + Claude para extraer y clasificar emisiones

import { useState, useRef, useCallback } from 'react'

const CAMPO_MAP = {
  consumo_electricidad:  { key: 'electricidad_kwh',    label: 'Consumo eléctrico (kWh)' },
  consumo_gas_natural:   { key: 'gas_natural_m3',      label: 'Gas natural (m³)' },
  consumo_gasolina:      { key: 'gasolina_galones',    label: 'Gasolina (galones)' },
  consumo_diesel:        { key: 'diesel_galones',      label: 'Diésel (galones)' },
  consumo_acpm:          { key: 'acpm_galones',        label: 'ACPM (galones)' },
  consumo_gas_propano:   { key: 'gas_propano_kg',      label: 'Gas propano (kg)' },
  km_carga:              { key: 'transporte_carga_km', label: 'Transporte de carga (km)' },
  km_empleados:          { key: 'transporte_empleados_km', label: 'Transporte empleados (km)' },
}

const ALCANCE_COLOR = {
  1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  2: 'bg-purple-50 text-purple-700 border-purple-200',
  3: 'bg-blue-50 text-blue-700 border-blue-200',
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-text-muted">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
    </svg>
  )
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconSpinner() {
  return <span className="w-5 h-5 border-2 border-brand-300/30 border-t-brand-300 rounded-full animate-spin inline-block" />
}

export default function InvoiceImporter({ onImport, onClose }) {
  const [fase, setFase] = useState('upload') // upload | procesando | resultado | error
  const [dragging, setDragging] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [seleccionados, setSeleccionados] = useState([])
  const inputRef = useRef()

  const procesarArchivo = useCallback(async (file) => {
    if (!file) return
    const maxMB = 5
    if (file.size > maxMB * 1024 * 1024) {
      setErrorMsg(`El archivo supera los ${maxMB}MB. Usa una versión más liviana.`)
      setFase('error')
      return
    }

    setFase('procesando')

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1]
      try {
        const res = await fetch('/api/extract-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mimeType: file.type }),
        })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error || 'Error al procesar')

        setResultado(data.clasificacion)
        // Pre-seleccionar todos los items con campo_cuestionario mapeado
        const presel = data.clasificacion.items
          .filter(i => i.campo_cuestionario && CAMPO_MAP[i.campo_cuestionario] && i.cantidad)
          .map((_, idx) => idx)
        setSeleccionados(presel)
        setFase('resultado')
      } catch (err) {
        setErrorMsg(err.message)
        setFase('error')
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) procesarArchivo(file)
  }, [procesarArchivo])

  const toggleSeleccion = (idx) => {
    setSeleccionados(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const aplicar = () => {
    const campos = {}
    resultado.items.forEach((item, idx) => {
      if (!seleccionados.includes(idx)) return
      const map = CAMPO_MAP[item.campo_cuestionario]
      if (map && item.cantidad) {
        campos[map.key] = item.cantidad
      }
    })
    onImport(campos, resultado.resumen)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-text-primary">Importar desde factura</h2>
            <p className="text-xs text-text-muted mt-0.5">Sube una factura PDF o imagen y extraemos los datos automáticamente</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-text-muted">
            <IconX />
          </button>
        </div>

        <div className="p-5">

          {/* FASE: upload */}
          {fase === 'upload' && (
            <div>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                  dragging ? 'border-brand-300 bg-brand-50' : 'border-border hover:border-brand-200 hover:bg-surface-secondary'
                }`}
              >
                <IconUpload />
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">Arrastra tu factura aquí</p>
                  <p className="text-xs text-text-muted mt-1">o haz clic para seleccionar</p>
                </div>
                <p className="text-xs text-text-muted">PDF, JPG o PNG · máx. 5MB</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => procesarArchivo(e.target.files[0])}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {['Factura de gas', 'Recibo de luz', 'Factura combustible', 'Ticket transporte'].map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-surface-secondary text-text-muted text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* FASE: procesando */}
          {fase === 'procesando' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <IconSpinner />
              <div className="text-center">
                <p className="font-medium text-text-primary">Analizando documento...</p>
                <p className="text-sm text-text-muted mt-1">Extrayendo texto y clasificando emisiones con IA</p>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-brand-300 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* FASE: resultado */}
          {fase === 'resultado' && resultado && (
            <div>
              {/* Resumen */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-white">
                    <IconCheck />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-800">{resultado.proveedor || 'Documento analizado'}</p>
                    <p className="text-xs text-emerald-700 mt-0.5">{resultado.resumen}</p>
                    {resultado.confianza && (
                      <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border ${
                        resultado.confianza === 'alta' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        resultado.confianza === 'media' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        Confianza {resultado.confianza}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <p className="text-xs font-medium text-text-muted mb-3">Selecciona los datos a importar:</p>
              <div className="space-y-2 mb-5">
                {resultado.items.map((item, idx) => {
                  const map = item.campo_cuestionario ? CAMPO_MAP[item.campo_cuestionario] : null
                  const importable = map && item.cantidad
                  const sel = seleccionados.includes(idx)
                  return (
                    <div
                      key={idx}
                      onClick={() => importable && toggleSeleccion(idx)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        importable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                      } ${sel ? 'border-brand-300 bg-brand-50' : 'border-border'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                        sel ? 'bg-brand-300 border-brand-300 text-white' : 'border-border'
                      }`}>
                        {sel && <IconCheck />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{item.descripcion}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.cantidad && (
                            <span className="text-xs text-text-secondary">
                              {item.cantidad} {item.unidad || ''}
                            </span>
                          )}
                          {map && (
                            <span className="text-xs text-brand-400">→ {map.label}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${ALCANCE_COLOR[item.alcance_ghg] || 'bg-surface-secondary text-text-muted border-border'}`}>
                        Alc. {item.alcance_ghg}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setFase('upload'); setResultado(null); setSeleccionados([]) }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  Subir otro
                </button>
                <button
                  onClick={aplicar}
                  disabled={seleccionados.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-brand-300 text-white text-sm font-semibold hover:bg-brand-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Aplicar {seleccionados.length > 0 ? `(${seleccionados.length})` : ''}
                </button>
              </div>
            </div>
          )}

          {/* FASE: error */}
          {fase === 'error' && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl">⚠️</div>
              <div>
                <p className="font-medium text-text-primary">No se pudo procesar el documento</p>
                <p className="text-sm text-text-muted mt-1">{errorMsg}</p>
              </div>
              <button
                onClick={() => { setFase('upload'); setErrorMsg('') }}
                className="px-5 py-2.5 rounded-xl bg-brand-300 text-white text-sm font-semibold hover:bg-brand-400 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
