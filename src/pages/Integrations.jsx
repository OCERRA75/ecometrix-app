// src/pages/Integrations.jsx
// M16 — Integraciones ERP: Siigo, Alegra, SIESA, CSV genérico
import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── CONNECTOR CONFIG ─────────────────────────────────────────────────────────
const CONNECTORS = [
  {
    id: 'siigo', name: 'Siigo', logo: '🟦', type: 'api', color: 'blue',
    desc: 'Importa facturas de compra, gastos por categoría y consumos directamente desde tu cuenta Siigo.',
    alcances: ['Alcance 1', 'Alcance 2', 'Alcance 3'],
    fields: [
      { key: 'username', label: 'Usuario (email)', type: 'email', placeholder: 'tu@empresa.com' },
      { key: 'access_key', label: 'Access Key', type: 'password', placeholder: 'Tu clave de API Siigo' },
      { key: 'partner_id', label: 'Partner ID', type: 'text', placeholder: 'EcoMetriX' },
    ],
    helpUrl: 'https://developer.siigo.com/docs/autenticacion',
    dataTypes: ['Facturas de compra', 'Gastos operativos', 'Servicios públicos', 'Combustibles'],
  },
  {
    id: 'alegra', name: 'Alegra', logo: '🟧', type: 'api', color: 'amber',
    desc: 'Conecta tu cuenta Alegra para importar gastos, compras a proveedores y servicios automáticamente.',
    alcances: ['Alcance 1', 'Alcance 2', 'Alcance 3'],
    fields: [
      { key: 'email', label: 'Email de la cuenta', type: 'email', placeholder: 'tu@empresa.com' },
      { key: 'token', label: 'Token de API', type: 'password', placeholder: 'Tu token de Alegra' },
    ],
    helpUrl: 'https://developer.alegra.com/docs/autenticacion',
    dataTypes: ['Gastos por categoría', 'Compras a proveedores', 'Facturas de servicios', 'Nómina'],
  },
  {
    id: 'siesa', name: 'SIESA Enterprise', logo: '🟩', type: 'csv', color: 'green',
    desc: 'Exporta el reporte de compras o gastos desde SIESA en Excel y cárgalo aquí. Compatible con SIESA 8.5 y Enterprise.',
    alcances: ['Alcance 1', 'Alcance 2', 'Alcance 3'],
    fields: [], helpUrl: null,
    dataTypes: ['Órdenes de compra', 'Gastos por centro de costo', 'Servicios públicos', 'Logística'],
    csvTemplate: {
      columns: ['fecha', 'descripcion', 'categoria', 'valor_cop', 'unidad', 'cantidad', 'proveedor'],
      example: '2026-01-15,Electricidad enero,electricidad,450000,kWh,1500,ENEL',
    },
  },
  {
    id: 'csv', name: 'CSV / Excel genérico', logo: '📄', type: 'csv', color: 'gray',
    desc: 'Importa datos desde cualquier ERP o sistema contable exportando a CSV o Excel. Usa nuestra plantilla o mapea tus columnas.',
    alcances: ['Alcance 1', 'Alcance 2', 'Alcance 3'],
    fields: [], helpUrl: null,
    dataTypes: ['Cualquier gasto categorizable', 'Consumos energéticos', 'Compras', 'Logística'],
    csvTemplate: {
      columns: ['fecha', 'descripcion', 'categoria', 'valor_cop', 'unidad', 'cantidad', 'proveedor'],
      example: '2026-01-15,Gas natural enero,gas_natural,320000,m3,450,Vanti',
    },
  },
]

const COLOR_MAP = {
  blue:  { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
  amber: { bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700', btn: 'bg-amber-500 hover:bg-amber-600 text-white' },
  green: { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700', btn: 'bg-green-600 hover:bg-green-700 text-white' },
  gray:  { bg: 'bg-gray-50',   border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-700',   btn: 'bg-gray-700 hover:bg-gray-800 text-white' },
}

const GHG_CATEGORIES = [
  { value: 'electricidad',         label: 'Electricidad',                       alcance: 2 },
  { value: 'gas_natural',          label: 'Gas natural',                        alcance: 1 },
  { value: 'combustible_diesel',   label: 'Combustible (diésel)',               alcance: 1 },
  { value: 'combustible_gasolina', label: 'Combustible (gasolina)',             alcance: 1 },
  { value: 'refrigerantes',        label: 'Refrigerantes / HFCs',              alcance: 1 },
  { value: 'transporte_aereo',     label: 'Transporte aéreo',                  alcance: 3 },
  { value: 'transporte_terrestre', label: 'Transporte terrestre',              alcance: 3 },
  { value: 'compras_bienes',       label: 'Compra de bienes',                  alcance: 3 },
  { value: 'compras_servicios',    label: 'Compra de servicios',               alcance: 3 },
  { value: 'residuos',             label: 'Gestión de residuos',               alcance: 3 },
  { value: 'agua',                 label: 'Agua y aguas residuales',           alcance: 3 },
  { value: 'nomina',               label: 'Nómina / desplazamiento empleados', alcance: 3 },
]

// ─── API CONNECTOR CARD ───────────────────────────────────────────────────────
function APIConnectorCard({ connector, onSuccess }) {
  const { t } = useTranslation()
  const c = COLOR_MAP[connector.color]
  const [credentials, setCredentials] = useState({})
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)

  async function handleConnect() {
    setStatus('connecting')
    setError(null)
    try {
      const res = await fetch(`/api/${connector.id}-connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setResult(data)
      setStatus('success')
      if (onSuccess) onSuccess(connector.id, data)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-5`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">{connector.logo}</span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-text-primary">{connector.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{t('integrations.connectApi')}</span>
            </div>
            <p className="text-sm text-text-secondary">{connector.desc}</p>
          </div>
        </div>
        {status === 'success' && (
          <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-full px-3 py-1 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-brand-300" />
            <span className="text-xs font-medium text-brand-400">{t('integrations.connected')}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {connector.alcances.map(a => <span key={a} className="badge-green text-xs">{a}</span>)}
        {connector.dataTypes.slice(0, 3).map(d => <span key={d} className="badge-gray text-xs">{d}</span>)}
      </div>

      <div className="space-y-3 mb-4">
        {connector.fields.map(field => (
          <div key={field.key}>
            <label className="text-xs font-medium text-text-secondary block mb-1">{field.label}</label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={credentials[field.key] || ''}
              onChange={e => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}

      {status === 'success' && result && (
        <div className="bg-white border border-brand-200 rounded-xl p-3 mb-3">
          <p className="text-xs font-semibold text-brand-400 mb-2">{t('integrations.importSuccess')}</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{result.total_registros || 0}</p>
              <p className="text-xs text-text-muted">{t('integrations.rowsImported')}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-brand-400">{result.alcance1_items || 0}</p>
              <p className="text-xs text-text-muted">Alcance 1</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-600">{result.alcance2_items || 0}</p>
              <p className="text-xs text-text-muted">Alcance 2</p>
            </div>
          </div>
          {result.resumen && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-brand-400 mt-2 hover:underline">
              {expanded ? 'Ocultar detalle' : `${t('integrations.preview')} →`}
            </button>
          )}
          {expanded && result.resumen && (
            <div className="mt-3 space-y-1.5">
              {result.resumen.map((r, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-text-secondary">{r.categoria}</span>
                  <span className="font-medium text-text-primary">{r.total_cop?.toLocaleString()} COP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleConnect}
          disabled={status === 'connecting' || connector.fields.some(f => !credentials[f.key])}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${c.btn}`}
        >
          {status === 'connecting' ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{t('integrations.connecting')}</span></>
          ) : status === 'success' ? (
            <><span>✓</span><span>{t('integrations.importData')}</span></>
          ) : (
            <span>{t('integrations.connect')} {connector.name}</span>
          )}
        </button>
        {connector.helpUrl && (
          <a href={connector.helpUrl} target="_blank" rel="noopener noreferrer"
            className="px-3 py-2.5 rounded-xl border border-border text-xs text-text-secondary hover:bg-surface-tertiary transition-colors">
            {t('integrations.helpDocs')}
          </a>
        )}
      </div>
    </div>
  )
}

// ─── CSV IMPORTER CARD ────────────────────────────────────────────────────────
function CSVImporterCard({ connector, onSuccess }) {
  const { t } = useTranslation()
  const c = COLOR_MAP[connector.color]
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [csvText, setCsvText] = useState('')
  const [rows, setRows] = useState([])
  const [mapping, setMapping] = useState({})
  const [step, setStep] = useState('upload')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [headers, setHeaders] = useState([])

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      setCsvText(text)
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) { setError('El archivo debe tener al menos una fila de datos'); return }
      // Auto-detectar delimitador: punto y coma o coma
      const firstLine = lines[0]
      const delimiter = firstLine.includes(';') ? ';' : ','
      const hdrs = firstLine.split(delimiter).map(h => h.trim().replace(/^["\']|["\']$/g, ''))
      const data = lines.slice(1, 6).map(l => l.split(delimiter).map(v => v.trim().replace(/^["\']|["\']$/g, '')))
      setHeaders(hdrs)
      setRows(data)
      // Auto-mapear columnas inteligentemente
      const autoMap = {}
      const patterns = {
        fecha:       ['fecha', 'date', 'f_emision', 'fec'],
        descripcion: ['descripcion', 'descripción', 'concepto', 'detalle', 'glosa', 'nombre'],
        valor_cop:   ['valor', 'total', 'monto', 'importe', 'debito', 'débito'],
        cantidad:    ['cantidad', 'qty', 'consumo', 'volumen'],
        unidad:      ['unidad', 'unit', 'ud', 'medida'],
        proveedor:   ['proveedor', 'vendor', 'empresa', 'tercero', 'beneficiario'],
      }
      hdrs.forEach(h => {
        const hl = h.toLowerCase()
        for (const [field, kws] of Object.entries(patterns)) {
          if (!autoMap[field] && kws.some(kw => hl.includes(kw))) autoMap[field] = h
        }
      })
      setMapping(autoMap)
      setStep('map')
      setError(null)
    }
    reader.readAsText(f)
  }

  const requiredMappings = ['fecha', 'descripcion', 'valor_cop']

  async function handleImport() {
    if (requiredMappings.some(r => !mapping[r])) {
      setError('Debes mapear al menos: fecha, descripción y valor COP')
      return
    }
    setStatus('importing')
    setError(null)
    try {
      // Enviar csv_text + column_mapping como JSON (lo que espera el backend)
      const res = await fetch('/api/csv-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csv_text: csvText,
          column_mapping: mapping,
          connector_id: connector.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setResult(data)
      setStep('done')
      setStatus('success')
      if (onSuccess) onSuccess(connector.id, data)
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  function downloadTemplate() {
    const cols = connector.csvTemplate.columns.join(',')
    const example = connector.csvTemplate.example
    const blob = new Blob([`${cols}\n${example}\n`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plantilla_${connector.id}_ecometrix.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-5`}>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl flex-shrink-0">{connector.logo}</span>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-text-primary">{connector.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{t('integrations.uploadCsv')}</span>
          </div>
          <p className="text-sm text-text-secondary">{connector.desc}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {connector.alcances.map(a => <span key={a} className="badge-green text-xs">{a}</span>)}
        {connector.dataTypes.slice(0, 3).map(d => <span key={d} className="badge-gray text-xs">{d}</span>)}
      </div>

      {step === 'upload' && (
        <div>
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-all mb-3">
            <p className="text-2xl mb-2">📂</p>
            <p className="text-sm font-medium text-text-primary mb-1">{t('integrations.uploadFile')}</p>
            <p className="text-xs text-text-muted">{t('integrations.supportedFormats')}</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={downloadTemplate}
            className="w-full py-2 rounded-xl border border-border text-xs text-text-secondary hover:bg-surface-tertiary transition-colors flex items-center justify-center gap-2">
            <span>⬇</span> {t('integrations.downloadTemplate')} {connector.name}
          </button>
        </div>
      )}

      {step === 'map' && (
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
            {t('integrations.mapColumns')} — {file?.name}
          </p>
          <div className="space-y-2 mb-4">
            {[
              { key: 'fecha',         label: t('integrations.columnDate'),     required: true },
              { key: 'descripcion',   label: t('integrations.columnDesc'),     required: true },
              { key: 'valor_cop',     label: t('integrations.columnValue'),    required: true },
              { key: 'cantidad',      label: t('integrations.columnQty'),      required: false },
              { key: 'unidad',        label: t('integrations.columnUnit'),     required: false },
              { key: 'proveedor',     label: t('integrations.columnSupplier'), required: false },
            ].map(field => (
              <div key={field.key} className="flex items-center gap-2">
                <span className={`text-xs w-36 flex-shrink-0 ${field.required ? 'font-medium text-text-primary' : 'text-text-muted'}`}>
                  {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
                <select value={mapping[field.key] || ''}
                  onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-300">
                  <option value="">{t('integrations.selectColumn')}</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto mb-4">
            <p className="text-xs text-text-muted mb-1">{t('integrations.preview')} (5 filas):</p>
            <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
              <thead className="bg-surface-tertiary">
                <tr>{headers.map(h => <th key={h} className="px-2 py-1.5 text-left text-text-muted font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-surface-secondary'}>
                    {row.map((cell, j) => <td key={j} className="px-2 py-1.5 text-text-secondary">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => { setStep('upload'); setFile(null); setHeaders([]); setRows([]) }}
              className="px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-tertiary transition-colors">
              {t('common.cancel')}
            </button>
            <button onClick={handleImport} disabled={status === 'importing'}
              className="flex-1 py-2.5 rounded-xl bg-brand-300 hover:bg-brand-400 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
              {status === 'importing' ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{t('integrations.importing')}</span></>
              ) : (
                <span>{t('integrations.importData')}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="bg-white border border-brand-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-brand-300 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3.5 h-3.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-sm font-semibold text-brand-400">{t('integrations.importSuccess')}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-surface-secondary rounded-lg">
              <p className="text-xl font-bold text-text-primary">{result.total_registros}</p>
              <p className="text-xs text-text-muted">{t('integrations.rowsImported')}</p>
            </div>
            <div className="text-center p-2 bg-surface-secondary rounded-lg">
              <p className="text-xl font-bold text-brand-400">{result.total_cop?.toLocaleString()}</p>
              <p className="text-xs text-text-muted">COP total</p>
            </div>
            <div className="text-center p-2 bg-brand-50 border border-brand-100 rounded-lg">
              <p className="text-xl font-bold text-brand-400">{result.total_kg_co2e?.toFixed(1)}</p>
              <p className="text-xs text-text-muted">kg CO₂e</p>
            </div>
          </div>
          {result.categorias && (
            <div className="space-y-1.5 mb-3">
              {result.categorias.map((cat, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-text-secondary">{cat.categoria} · Alcance {cat.alcance}</span>
                  <span className="font-medium">{cat.kg_co2e?.toFixed(1)} kg CO₂e</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setStep('upload'); setFile(null); setHeaders([]); setRows([]); setResult(null) }}
              className="flex-1 py-2 rounded-xl border border-border text-xs text-text-secondary hover:bg-surface-tertiary transition-colors">
              {t('integrations.importAnother')}
            </button>
            <Link to="/questionnaire" className="flex-1 py-2 rounded-xl bg-brand-300 text-white text-xs font-semibold text-center hover:bg-brand-400 transition-colors">
              {t('dashboard.newDiagnosis')} →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Integrations() {
  const { t } = useTranslation()
  const [connectedSystems, setConnectedSystems] = useState({})
  const navigate = useNavigate()

  function handleSuccess(connectorId, data) {
    setConnectedSystems(prev => ({ ...prev, [connectorId]: data }))
    const existing = JSON.parse(sessionStorage.getItem('ecometrix_integrations') || '{}')
    existing[connectorId] = data
    sessionStorage.setItem('ecometrix_integrations', JSON.stringify(existing))
  }

  const connectedCount = Object.keys(connectedSystems).length

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-brand-400 font-semibold text-sm">EcoMetriX</span>
          </Link>
          <div className="flex items-center gap-3">
            {connectedCount > 0 && (
              <span className="text-xs bg-brand-50 border border-brand-200 text-brand-400 rounded-full px-3 py-1 font-medium">
                {connectedCount} {t('integrations.connected')}
              </span>
            )}
            <Link to="/dashboard" className="btn-ghost text-sm py-1.5 px-3">{t('csrd.backDashboard')}</Link>
            <Link to="/questionnaire" className="btn-primary text-sm py-1.5 px-3">{t('dashboard.newDiagnosis')}</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-green">{t('integrations.badge')}</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">{t('integrations.title')}</h1>
          <p className="text-text-secondary max-w-2xl">{t('integrations.subtitle')}</p>
        </div>

        {/* Cómo funciona */}
        <div className="card mb-8 border-brand-200 bg-brand-50">
          <h2 className="font-semibold text-text-primary mb-3">{t('manual.comoFunciona.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: '1', title: t('integrations.connectApi'), desc: t('integrations.howStep1'), icon: '🔗' },
              { n: '2', title: t('integrations.mapColumns'), desc: t('integrations.howStep2'), icon: '🗂' },
              { n: '3', title: t('integrations.importData'), desc: t('integrations.howStep3'), icon: '📊' },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-300 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">{step.n}</div>
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-0.5">{step.icon} {step.title}</p>
                  <p className="text-xs text-text-secondary">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-base font-semibold text-text-primary mb-4">{t('integrations.connectApi')}</h2>
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {CONNECTORS.filter(c => c.type === 'api').map(connector => (
            <APIConnectorCard key={connector.id} connector={connector} onSuccess={handleSuccess} />
          ))}
        </div>

        <h2 className="text-base font-semibold text-text-primary mb-4">{t('integrations.uploadCsv')}</h2>
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {CONNECTORS.filter(c => c.type === 'csv').map(connector => (
            <CSVImporterCard key={connector.id} connector={connector} onSuccess={handleSuccess} />
          ))}
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-brand-400 to-brand-300 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">{t('integrations.customErpTitle')}</p>
              <h3 className="text-lg font-bold mb-2">{t('integrations.customErpHeadline')}</h3>
              <p className="text-white/80 text-sm mb-4">
                {t('integrations.customErpDesc')}
              </p>
              <a href="mailto:oscar@ecometrix.co?subject=Integración ERP personalizada"
                className="bg-white text-brand-400 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors inline-block">
                {t('integrations.customErpCta')}
              </a>
            </div>
            <span className="text-5xl flex-shrink-0 hidden sm:block">🔌</span>
          </div>
        </div>
      </main>
    </div>
  )
}
