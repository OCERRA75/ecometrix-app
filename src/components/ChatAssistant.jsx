import { useState, useRef, useEffect } from 'react'

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconBot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/>
  </svg>
)
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── QUICK QUESTIONS ──────────────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  '¿Qué significa mi nivel de impacto?',
  '¿Cómo puedo reducir mi Alcance 2?',
  '¿Qué es el GHG Protocol?',
  '¿Cuándo aplica la CSRD a mi empresa?',
  '¿Cómo calculo el Alcance 3?',
]

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-brand-300 text-white' : 'bg-surface-tertiary text-text-secondary'
      }`}>
        {isUser ? <IconUser /> : <IconBot />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-400 text-white rounded-tr-sm'
            : 'bg-white border border-border text-text-primary rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
        <span className="text-xs text-text-muted px-1">
          {new Date(msg.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

// ─── TYPING INDICATOR ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0">
        <IconBot />
      </div>
      <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

// ─── MAIN CHAT WIDGET ─────────────────────────────────────────────────────────
export default function ChatAssistant({ reportData }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente de EcoMetriX. Puedo ayudarte a entender tu huella de carbono, el GHG Protocol, CSRD y cómo reducir tus emisiones. ¿En qué te ayudo?',
      timestamp: Date.now(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return

    setInput('')
    const userMsg = { role: 'user', content: userText, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      // Construir contexto con los datos del reporte
      const contexto = reportData ? `
Datos del diagnóstico de la empresa:
- Empresa: ${reportData.empresa?.nombre}
- Sector: ${reportData.empresa?.sector}
- País: ${reportData.empresa?.pais}
- Huella total: ${reportData.calculo?.totalTonAnio} ton CO2e/año
- Alcance 1: ${reportData.calculo?.alcance1} kg CO2e/mes
- Alcance 2: ${reportData.calculo?.alcance2} kg CO2e/mes
- Alcance 3: ${reportData.calculo?.alcance3 || 0} kg CO2e/mes
- Nivel de impacto: ${reportData.calculo?.nivelImpacto}
` : ''

      const systemPrompt = `Eres el asistente de EcoMetriX, experto en huella de carbono, GHG Protocol, ISO 14064 y CSRD. 
${contexto}
Responde en español, de forma clara y concisa (máximo 3 párrafos cortos). 
Usa datos concretos cuando los tengas. No uses markdown en tus respuestas.
Si te preguntan algo fuera de sostenibilidad/carbono, redirige amablemente al tema.`

      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: userText }],
          system: systemPrompt,
        }),
      })

      const data = await response.json()
      const assistantText = data.content || 'Lo siento, no pude procesar tu pregunta. Intenta de nuevo.'

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantText,
        timestamp: Date.now(),
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Hubo un error de conexión. Verifica tu conexión e intenta de nuevo.',
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-400 text-white shadow-modal flex items-center justify-center hover:bg-brand-300 transition-all active:scale-95 group"
        >
          <IconChat />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">1</span>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-h-[600px] flex flex-col bg-white rounded-2xl shadow-modal border border-border overflow-hidden">

          {/* Header */}
          <div className="bg-brand-400 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <IconBot />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Asistente EcoMetriX</p>
                <p className="text-white/70 text-xs">GHG Protocol · ISO 14064 · CSRD</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <IconX />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-secondary min-h-[300px] max-h-[380px]">
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 bg-white border-t border-border">
              <p className="text-xs text-text-muted mb-2">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-400 border border-brand-100 hover:bg-brand-100 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 bg-white border-t border-border flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              rows={1}
              className="flex-1 resize-none text-sm px-3 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-brand-300 bg-surface-secondary text-text-primary placeholder:text-text-muted transition-all"
              style={{ maxHeight: '100px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-brand-400 text-white flex items-center justify-center hover:bg-brand-300 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <IconSend />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
