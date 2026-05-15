import { useState } from 'react'
import { Link } from 'react-router-dom'

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconCopy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round"/>
  </svg>
)

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/health',
    desc: 'Estado del servicio — sin autenticación',
    auth: false,
    response: `{
  "status": "ok",
  "version": "1.0.0",
  "service": "EcoMetriX API",
  "endpoints": [
    "GET  /api/v1/health",
    "GET  /api/v1/factors",
    "POST /api/v1/calculate"
  ]
}`,
    ejemplo: null,
  },
  {
    method: 'GET',
    path: '/api/v1/factors',
    desc: 'Factores de emisión IPCC AR6 — sin autenticación',
    auth: false,
    response: `{
  "combustibles": {
    "diesel":     { "factor": 10.15, "unidad": "kg CO2e/galón" },
    "gasolina":   { "factor": 8.78,  "unidad": "kg CO2e/galón" },
    "gas_natural":{ "factor": 5.49,  "unidad": "kg CO2e/m³" }
  },
  "electricidad": {
    "Colombia": { "factor": 0.126, "unidad": "kg CO2e/kWh" },
    "Mexico":   { "factor": 0.454, "unidad": "kg CO2e/kWh" }
  },
  "metodologia": "GHG Protocol + IPCC AR6"
}`,
    ejemplo: null,
  },
  {
    method: 'POST',
    path: '/api/v1/calculate',
    desc: 'Calcula la huella de carbono — requiere API key',
    auth: true,
    body: `{
  "empresa": {
    "nombre": "Textiles del Norte SAS",
    "sector": "Manufactura",
    "pais": "Colombia"
  },
  "datos": {
    "combustible": {
      "tipo": "diesel",
      "cantidad": 200
    },
    "flota": {
      "galones": 300
    },
    "electricidad": {
      "kwh": 1500
    }
  }
}`,
    response: `{
  "id": "ecm_api_1716000000000",
  "empresa": { "nombre": "Textiles del Norte SAS", ... },
  "resultado": {
    "alcance1_kg_mes": 5105,
    "alcance2_kg_mes": 189,
    "total_kg_mes": 5294,
    "total_ton_anio": 63.5,
    "detalles": [
      { "alcance": 1, "categoria": "Combustibles", "kgCO2e": 2030 },
      { "alcance": 1, "categoria": "Flota vehicular", "kgCO2e": 3045 },
      { "alcance": 2, "categoria": "Electricidad", "kgCO2e": 189 }
    ],
    "metodologia": "GHG Protocol Corporate Standard + IPCC AR6"
  },
  "creditos_usados": 1
}`,
  },
]

const SDKS = [
  {
    lang: 'JavaScript / Node.js',
    icon: '🟨',
    code: `const response = await fetch('https://ecometrix-co.netlify.app/api/v1/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'ecm_tu_api_key_aqui'
  },
  body: JSON.stringify({
    empresa: { nombre: 'Mi Empresa', sector: 'Manufactura', pais: 'Colombia' },
    datos: {
      combustible: { tipo: 'diesel', cantidad: 200 },
      electricidad: { kwh: 1500 }
    }
  })
})
const data = await response.json()
console.log(data.resultado.total_ton_anio, 'ton CO2e/año')`,
  },
  {
    lang: 'Python',
    icon: '🐍',
    code: `import requests

response = requests.post(
    'https://ecometrix-co.netlify.app/api/v1/calculate',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'ecm_tu_api_key_aqui'
    },
    json={
        'empresa': {'nombre': 'Mi Empresa', 'sector': 'Manufactura', 'pais': 'Colombia'},
        'datos': {
            'combustible': {'tipo': 'diesel', 'cantidad': 200},
            'electricidad': {'kwh': 1500}
        }
    }
)
data = response.json()
print(f"{data['resultado']['total_ton_anio']} ton CO2e/año")`,
  },
  {
    lang: 'cURL',
    icon: '💻',
    code: `curl -X POST https://ecometrix-co.netlify.app/api/v1/calculate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ecm_tu_api_key_aqui" \\
  -d '{
    "empresa": {"nombre": "Mi Empresa", "pais": "Colombia"},
    "datos": {
      "combustible": {"tipo": "diesel", "cantidad": 200},
      "electricidad": {"kwh": 1500}
    }
  }'`,
  },
]

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
      <button onClick={copy} className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-gray-300 text-xs transition-colors">
        <IconCopy />
        {copied ? 'Copiado ✓' : 'Copiar'}
      </button>
    </div>
  )
}

function Playground() {
  const [apiKey, setApiKey] = useState('ecm_demo_key')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [combustible, setCombustible] = useState('200')
  const [kwh, setKwh] = useState('1500')
  const [pais, setPais] = useState('Colombia')

  const run = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/.netlify/functions/api-v1/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({
          empresa: { nombre: 'Demo empresa', pais },
          datos: {
            combustible: { tipo: 'diesel', cantidad: parseFloat(combustible) || 0 },
            electricidad: { kwh: parseFloat(kwh) || 0 },
          }
        })
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-text-primary mb-4">🧪 Playground — Prueba la API</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">API Key</label>
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} className="input text-xs font-mono" placeholder="ecm_..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">País</label>
          <select value={pais} onChange={e => setPais(e.target.value)} className="input text-xs">
            {['Colombia', 'Mexico', 'Argentina', 'Chile', 'Peru', 'Ecuador', 'Espana'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Diésel flota (galones/mes)</label>
          <input type="number" value={combustible} onChange={e => setCombustible(e.target.value)} className="input text-xs" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Electricidad (kWh/mes)</label>
          <input type="number" value={kwh} onChange={e => setKwh(e.target.value)} className="input text-xs" />
        </div>
      </div>
      <button onClick={run} disabled={loading} className="btn-primary text-sm mb-4">
        {loading ? 'Calculando...' : 'Ejecutar POST /calculate →'}
      </button>
      {result && (
        <div>
          <p className="text-xs font-medium text-text-muted mb-2">Respuesta:</p>
          <CodeBlock code={JSON.stringify(result, null, 2)} />
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}

export default function Developers() {
  const [activeTab, setActiveTab] = useState('endpoints')
  const [activeSdk, setActiveSdk] = useState(0)

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-brand-400 font-semibold text-sm">EcoMetriX</span>
            <span className="text-text-muted text-sm">/</span>
            <span className="text-text-secondary text-sm font-medium">Developers</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/precios" className="btn-ghost text-sm py-1.5 px-3">Planes</Link>
            <a href="mailto:oscar@ecometrix.co" className="btn-primary text-sm py-1.5 px-3">Solicitar API key</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-brand-400 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white/90 text-xs font-medium mb-4">API v1.0</span>
            <h1 className="text-3xl font-bold mb-3">EcoMetriX API</h1>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              Integra cálculo de huella de carbono en tu plataforma. REST API con factores IPCC AR6 y GHG Protocol.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm">GHG Protocol</div>
              <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm">ISO 14064</div>
              <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm">IPCC AR6</div>
              <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm">REST + JSON</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Quick start */}
        <div className="card mb-8">
          <h2 className="font-semibold text-text-primary mb-1">Base URL</h2>
          <div className="font-mono text-sm bg-surface-tertiary rounded-lg px-4 py-2.5 text-brand-400 mt-2">
            https://ecometrix-co.netlify.app
          </div>
          <p className="text-xs text-text-muted mt-2">Autenticación: header <code className="bg-surface-tertiary px-1.5 py-0.5 rounded text-brand-400">X-API-Key: ecm_...</code></p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          {[['endpoints', 'Endpoints'], ['sdks', 'Ejemplos de código'], ['playground', 'Playground']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-brand-50 text-brand-400 border border-brand-200' : 'text-text-secondary hover:bg-surface-tertiary'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Endpoints */}
        {activeTab === 'endpoints' && (
          <div className="space-y-4">
            {ENDPOINTS.map(ep => (
              <div key={ep.path} className="card">
                <div className="flex items-start gap-3 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                    ep.method === 'GET' ? 'bg-brand-50 text-brand-400' : 'bg-purple-50 text-purple-700'
                  }`}>{ep.method}</span>
                  <div className="flex-1">
                    <code className="text-sm font-mono text-text-primary">{ep.path}</code>
                    <p className="text-xs text-text-secondary mt-1">{ep.desc}</p>
                  </div>
                  {ep.auth && <span className="badge-amber text-xs flex-shrink-0">Requiere auth</span>}
                  {!ep.auth && <span className="badge-green text-xs flex-shrink-0">Público</span>}
                </div>

                {ep.body && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-text-muted mb-1.5">Request body:</p>
                    <CodeBlock code={ep.body} />
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-text-muted mb-1.5">Response:</p>
                  <CodeBlock code={ep.response} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SDKs */}
        {activeTab === 'sdks' && (
          <div>
            <div className="flex gap-2 mb-4">
              {SDKS.map((s, i) => (
                <button key={i} onClick={() => setActiveSdk(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSdk === i ? 'bg-brand-50 text-brand-400 border border-brand-200' : 'text-text-secondary hover:bg-surface-tertiary'}`}>
                  <span>{s.icon}</span>{s.lang}
                </button>
              ))}
            </div>
            <CodeBlock code={SDKS[activeSdk].code} />

            <div className="card mt-6">
              <h3 className="font-semibold text-text-primary mb-3">Obtener tu API key</h3>
              <p className="text-sm text-text-secondary mb-4">
                Las API keys están disponibles en el plan Pro y Enterprise. Cada key tiene el formato <code className="bg-surface-tertiary px-1.5 py-0.5 rounded text-brand-400">ecm_xxxxxxxxxxxxxxxx</code>.
              </p>
              <a href="mailto:oscar@ecometrix.co?subject=Solicitud API key EcoMetriX"
                className="btn-primary text-sm">
                Solicitar API key →
              </a>
            </div>
          </div>
        )}

        {/* Playground */}
        {activeTab === 'playground' && (
          <div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
              <p className="text-sm text-amber-700">
                <strong>Demo:</strong> Usa la key <code className="bg-amber-100 px-1.5 py-0.5 rounded">ecm_demo_key</code> para probar. En producción, usa tu key real del plan Pro.
              </p>
            </div>
            <Playground />
          </div>
        )}

        {/* Rate limits */}
        <div className="card mt-8">
          <h3 className="font-semibold text-text-primary mb-4">Rate limits por plan</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted text-xs uppercase tracking-wide border-b border-border">
                  <th className="pb-2 pr-4">Plan</th>
                  <th className="pb-2 pr-4">Requests/hora</th>
                  <th className="pb-2 pr-4">Requests/mes</th>
                  <th className="pb-2">SLA</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {[
                  ['Free', '—', '—', '—'],
                  ['Pro', '100', '5.000', '99%'],
                  ['Enterprise', '1.000', 'Ilimitado', '99.9%'],
                ].map(([plan, h, m, sla]) => (
                  <tr key={plan} className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-text-primary">{plan}</td>
                    <td className="py-2 pr-4 text-text-secondary">{h}</td>
                    <td className="py-2 pr-4 text-text-secondary">{m}</td>
                    <td className="py-2 text-text-secondary">{sla}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
