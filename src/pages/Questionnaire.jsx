import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuestionnaire } from '@/store/questionnaire.js'
import {
  SECTORES, TAMANOS,
  preguntasAlcance1, preguntasAlcance2,
  getPreguntasFiltradas, getProgreso
} from '@/lib/questions.js'

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconArrow = ({ left }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d={left ? "M19 12H5M12 19l-7-7 7-7" : "M5 12h14M12 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" strokeLinecap="round"/>
  </svg>
)

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, step }) {
  const steps = [
    { id: 'onboarding', label: 'Tu empresa' },
    { id: 'alcance1',   label: 'Alcance 1' },
    { id: 'alcance2',   label: 'Alcance 2' },
    { id: 'resumen',    label: 'Resumen' },
  ]
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        {steps.map((s, i) => {
          const currentIdx = steps.findIndex(x => x.id === step)
          const done = i < currentIdx
          const active = i === currentIdx
          return (
            <div key={s.id} className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-brand-300 text-white' :
                active ? 'bg-brand-400 text-white ring-4 ring-brand-100' :
                'bg-surface-tertiary text-text-muted'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block transition-colors ${
                active ? 'text-brand-400' : done ? 'text-brand-300' : 'text-text-muted'
              }`}>{s.label}</span>
              {i < steps.length - 1 && (
                <div className={`h-px w-8 sm:w-16 mx-1 transition-all ${done ? 'bg-brand-300' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="w-full h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
        <div className="h-full bg-brand-300 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-right text-xs text-text-muted mt-1">{pct}% completado</p>
    </div>
  )
}

// ─── ONBOARDING SCREEN ────────────────────────────────────────────────────────
function OnboardingScreen({ onNext }) {
  const { empresa, setEmpresa } = useQuestionnaire()
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!empresa.nombre.trim()) e.nombre = 'Campo requerido'
    if (!empresa.email.trim()) e.email = 'Campo requerido'
    if (!empresa.sector) e.sector = 'Selecciona un sector'
    if (!empresa.tamano) e.tamano = 'Selecciona el tamaño'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <span className="badge-green mb-3 inline-block">Paso 1 de 4</span>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Cuéntanos sobre tu empresa</h1>
        <p className="text-text-secondary text-sm">Esta información nos permite adaptar las preguntas a tu sector y calcular benchmarks relevantes.</p>
      </div>

      <div className="space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Nombre de la empresa *</label>
          <input
            type="text"
            value={empresa.nombre}
            onChange={e => setEmpresa({ nombre: e.target.value })}
            placeholder="Ej: Textiles del Norte SAS"
            className={`input ${errors.nombre ? 'border-danger ring-1 ring-danger' : ''}`}
          />
          {errors.nombre && <p className="text-danger text-xs mt-1">{errors.nombre}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Correo corporativo *</label>
          <input
            type="email"
            value={empresa.email}
            onChange={e => setEmpresa({ email: e.target.value })}
            placeholder="tu@empresa.com"
            className={`input ${errors.email ? 'border-danger ring-1 ring-danger' : ''}`}
          />
          {errors.email && <p className="text-danger text-xs mt-1">{errors.email}</p>}
        </div>

        {/* NIT opcional */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">NIT / RUT <span className="text-text-muted font-normal">(opcional)</span></label>
          <input
            type="text"
            value={empresa.nit}
            onChange={e => setEmpresa({ nit: e.target.value })}
            placeholder="Ej: 900.123.456-7"
            className="input"
          />
        </div>

        {/* Sector */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Sector *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SECTORES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setEmpresa({ sector: s })}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-all ${
                  empresa.sector === s
                    ? 'bg-brand-50 border-brand-300 text-brand-400'
                    : 'bg-white border-border text-text-secondary hover:border-brand-200 hover:bg-brand-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.sector && <p className="text-danger text-xs mt-1">{errors.sector}</p>}
        </div>

        {/* Tamaño */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Tamaño de la empresa *</label>
          <div className="grid grid-cols-2 gap-2">
            {TAMANOS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setEmpresa({ tamano: t.value })}
                className={`px-4 py-3 rounded-lg border text-left transition-all ${
                  empresa.tamano === t.value
                    ? 'bg-brand-50 border-brand-300'
                    : 'bg-white border-border hover:border-brand-200 hover:bg-brand-50'
                }`}
              >
                <p className={`text-sm font-medium ${empresa.tamano === t.value ? 'text-brand-400' : 'text-text-primary'}`}>{t.label}</p>
                <p className="text-xs text-text-muted">{t.desc}</p>
              </button>
            ))}
          </div>
          {errors.tamano && <p className="text-danger text-xs mt-1">{errors.tamano}</p>}
        </div>

        {/* País */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">País de operación</label>
          <select value={empresa.pais} onChange={e => setEmpresa({ pais: e.target.value })} className="input">
            {['Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'España', 'Otro'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleNext} className="btn-primary w-full justify-center py-3 text-base">
          Comenzar diagnóstico <IconArrow />
        </button>
        <p className="text-center text-xs text-text-muted mt-3">
          Tus datos son confidenciales y solo se usan para generar tu reporte.
        </p>
      </div>
    </div>
  )
}

// ─── QUESTION CARD ────────────────────────────────────────────────────────────
function QuestionCard({ pregunta, value, onChange }) {
  const [showAyuda, setShowAyuda] = useState(false)
  const [numValue, setNumValue] = useState(
    pregunta.tipo === 'opciones_con_numero' && value?.num ? value.num : ''
  )

  if (pregunta.tipo === 'opciones') {
    return (
      <div>
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-text-primary leading-snug">{pregunta.pregunta}</h2>
          {pregunta.ayuda && (
            <button onClick={() => setShowAyuda(!showAyuda)} className="flex-shrink-0 text-text-muted hover:text-brand-400 transition-colors mt-1">
              <IconInfo />
            </button>
          )}
        </div>
        {showAyuda && (
          <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 mb-5 text-sm text-text-secondary">
            {pregunta.ayuda}
          </div>
        )}
        <div className="space-y-2.5">
          {pregunta.opciones.map(op => (
            <button
              key={op}
              type="button"
              onClick={() => onChange(op)}
              className={`w-full text-left px-5 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                value === op
                  ? 'bg-brand-50 border-brand-300 text-brand-400'
                  : 'bg-white border-border text-text-primary hover:border-brand-200 hover:bg-brand-50'
              }`}
            >
              <span className={`mr-3 inline-flex w-5 h-5 rounded-full border-2 items-center justify-center transition-all flex-shrink-0 align-middle ${
                value === op ? 'bg-brand-300 border-brand-300' : 'border-border'
              }`}>
                {value === op && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
              {op}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (pregunta.tipo === 'numero') {
    return (
      <div>
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-text-primary leading-snug">{pregunta.pregunta}</h2>
          {pregunta.ayuda && (
            <button onClick={() => setShowAyuda(!showAyuda)} className="flex-shrink-0 text-text-muted hover:text-brand-400 transition-colors mt-1">
              <IconInfo />
            </button>
          )}
        </div>
        {showAyuda && (
          <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 mb-5 text-sm text-text-secondary">
            {pregunta.ayuda}
          </div>
        )}
        <div className="relative">
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={pregunta.placeholder}
            min="0"
            className="input pr-28 text-lg py-4"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted font-medium">
            {pregunta.unidad}
          </span>
        </div>
        {!pregunta.requerido && (
          <p className="text-xs text-text-muted mt-2">Campo opcional — si no lo tienes, estimaremos con un valor promedio.</p>
        )}
      </div>
    )
  }

  if (pregunta.tipo === 'opciones_con_numero') {
    return (
      <div>
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-text-primary leading-snug">{pregunta.pregunta}</h2>
          {pregunta.ayuda && (
            <button onClick={() => setShowAyuda(!showAyuda)} className="flex-shrink-0 text-text-muted hover:text-brand-400 transition-colors mt-1">
              <IconInfo />
            </button>
          )}
        </div>
        {showAyuda && (
          <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 mb-5 text-sm text-text-secondary">
            {pregunta.ayuda}
          </div>
        )}
        <div className="space-y-2.5 mb-4">
          {pregunta.opciones.map(op => (
            <button
              key={op}
              type="button"
              onClick={() => onChange({ op, num: numValue })}
              className={`w-full text-left px-5 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                value?.op === op
                  ? 'bg-brand-50 border-brand-300 text-brand-400'
                  : 'bg-white border-border text-text-primary hover:border-brand-200 hover:bg-brand-50'
              }`}
            >
              <span className={`mr-3 inline-flex w-5 h-5 rounded-full border-2 items-center justify-center transition-all flex-shrink-0 align-middle ${
                value?.op === op ? 'bg-brand-300 border-brand-300' : 'border-border'
              }`}>
                {value?.op === op && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
              {op}
            </button>
          ))}
        </div>
        {value?.op === 'Sí, lo tengo' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-text-primary mb-1.5">{pregunta.campoNumero.label}</label>
            <input
              type="number"
              value={numValue}
              onChange={e => { setNumValue(e.target.value); onChange({ op: value.op, num: e.target.value }) }}
              placeholder={pregunta.campoNumero.placeholder}
              min="0"
              className="input"
            />
          </div>
        )}
      </div>
    )
  }

  return null
}

// ─── RESUMEN SCREEN ───────────────────────────────────────────────────────────
function ResumenScreen({ onSubmit, loading }) {
  const { empresa, respuestas } = useQuestionnaire()
  const a1 = getPreguntasFiltradas(preguntasAlcance1, empresa.sector, respuestas)
  const a2 = getPreguntasFiltradas(preguntasAlcance2, empresa.sector, respuestas)
  const respondidas = Object.keys(respuestas).length

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">¡Cuestionario completado!</h1>
        <p className="text-text-secondary text-sm">Revisa el resumen antes de calcular tu huella de carbono.</p>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-text-primary mb-4">Datos de la empresa</h3>
        <div className="space-y-2">
          {[
            ['Empresa', empresa.nombre],
            ['Email', empresa.email],
            ['Sector', empresa.sector],
            ['Tamaño', empresa.tamano],
            ['País', empresa.pais],
          ].map(([k, v]) => v && (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-text-muted">{k}</span>
              <span className="text-text-primary font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-brand-400 mb-1">{respondidas}</p>
          <p className="text-xs text-text-secondary">Preguntas respondidas</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-brand-400 mb-1">{a1.length + a2.length}</p>
          <p className="text-xs text-text-secondary">Total del diagnóstico</p>
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-4 mb-6">
        <p className="text-sm text-brand-400 font-medium mb-1">¿Qué pasa ahora?</p>
        <p className="text-sm text-text-secondary">
          Nuestra IA calculará tus emisiones de CO2e usando los factores del IPCC AR6 y el GHG Protocol.
          Recibirás tu reporte PDF en <strong>{empresa.email}</strong> en menos de 2 minutos.
        </p>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="btn-primary w-full justify-center py-3.5 text-base"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Calculando tu huella...
          </span>
        ) : (
          <>Calcular mi huella de carbono <IconArrow /></>
        )}
      </button>
    </div>
  )
}

// ─── MAIN QUESTIONNAIRE ───────────────────────────────────────────────────────
export default function Questionnaire() {
  const navigate = useNavigate()
  const { empresa, respuestas, step, currentQ, setRespuesta, nextStep, prevStep, setCurrentQ } = useQuestionnaire()
  const [submitting, setSubmitting] = useState(false)

  // Obtener preguntas activas según el step
  const preguntas = step === 'alcance1'
    ? getPreguntasFiltradas(preguntasAlcance1, empresa.sector, respuestas)
    : step === 'alcance2'
    ? getPreguntasFiltradas(preguntasAlcance2, empresa.sector, respuestas)
    : []

  const preguntaActual = preguntas[currentQ]
  const valorActual = preguntaActual ? respuestas[preguntaActual.id] : null

  const pct = getProgreso(step, currentQ, empresa.sector, respuestas)

  // Navegar entre preguntas
  const handleNext = () => {
    if (currentQ < preguntas.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      nextStep()
    }
  }

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1)
    } else {
      prevStep()
    }
  }

  const canGoNext = () => {
    if (!preguntaActual) return true
    if (!preguntaActual.requerido) return true
    return !!valorActual
  }

  // Submit final
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = { empresa, respuestas }
      const res = await fetch('/.netlify/functions/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      // Siempre guardar en sessionStorage para que Report lo lea
      sessionStorage.setItem('ecometrix_result', JSON.stringify(data))
      if (data.id) {
        navigate(`/reporte/${data.id}`)
      } else {
        navigate('/reporte/preview')
      }
    } catch (err) {
      console.error(err)
      // Fallback temporal para el piloto
      sessionStorage.setItem('ecometrix_draft', JSON.stringify({ empresa, respuestas }))
      navigate('/reporte/preview')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-brand-300 flex items-center justify-center"><IconLeaf /></div>
            <span className="text-brand-400 font-semibold text-sm">EcoMetriX</span>
          </a>
          <div className="flex-1">
            <ProgressBar pct={pct} step={step} />
          </div>
        </div>
      </header>

      {/* Alcance badge */}
      {(step === 'alcance1' || step === 'alcance2') && preguntaActual && (
        <div className="bg-white border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-2 flex items-center gap-3">
            <span className={`badge text-xs ${step === 'alcance1' ? 'badge-green' : 'bg-purple-50 text-purple-700 border border-purple-100 rounded-full px-2.5 py-0.5'}`}>
              Alcance {step === 'alcance1' ? '1' : '2'}
            </span>
            <span className="text-xs text-text-muted">{preguntaActual.categoria}</span>
            <span className="ml-auto text-xs text-text-muted">
              {currentQ + 1} / {preguntas.length}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {step === 'onboarding' && (
          <OnboardingScreen onNext={() => nextStep()} />
        )}

        {(step === 'alcance1' || step === 'alcance2') && preguntaActual && (
          <div className="max-w-xl mx-auto">
            <QuestionCard
              key={preguntaActual.id}
              pregunta={preguntaActual}
              value={valorActual}
              onChange={(val) => setRespuesta(preguntaActual.id, val)}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10">
              <button
                onClick={handlePrev}
                className="btn-ghost"
              >
                <IconArrow left /> Anterior
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {currentQ < preguntas.length - 1 ? 'Siguiente' : step === 'alcance1' ? 'Ir a Alcance 2' : 'Ver resumen'}
                <IconArrow />
              </button>
            </div>
          </div>
        )}

        {step === 'resumen' && (
          <ResumenScreen onSubmit={handleSubmit} loading={submitting} />
        )}
      </main>
    </div>
  )
}
