import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n.js'
import App from './App.jsx'

// ── Protección anti-DevTools ──────────────────────────────────────────────────
// Desactiva console en producción
if (import.meta.env.PROD) {
  const noop = () => {}
  console.log = noop
  console.warn = noop
  console.info = noop
  console.debug = noop
  // console.error se mantiene para errores reales

  // Detección de DevTools abierto — limpia sessionStorage si detecta inspector
  let devToolsOpen = false
  const threshold = 160

  const detectDevTools = () => {
    const widthDiff  = window.outerWidth  - window.innerWidth  > threshold
    const heightDiff = window.outerHeight - window.innerHeight > threshold
    if ((widthDiff || heightDiff) && !devToolsOpen) {
      devToolsOpen = true
      // No bloquear — solo limpiar datos sensibles de memoria
      sessionStorage.removeItem('ecometrix_result')
    } else if (!widthDiff && !heightDiff) {
      devToolsOpen = false
    }
  }

  // Verificar cada 3 segundos (no cada frame — no afecta performance)
  setInterval(detectDevTools, 3000)

  // Bloquear click derecho → Ver código fuente
  document.addEventListener('contextmenu', e => e.preventDefault())

  // Bloquear atajos de teclado de DevTools
  document.addEventListener('keydown', e => {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (ver fuente)
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault()
      return false
    }
  })
}

// ── Verificar que no hay keys expuestas en el bundle ─────────────────────────
if (import.meta.env.DEV) {
  const forbidden = ['ANTHROPIC', 'SERVICE_ROLE', 'SECRET']
  Object.keys(import.meta.env).forEach(key => {
    if (forbidden.some(f => key.includes(f))) {
      console.error(`⚠️ SECURITY: Variable ${key} expuesta en el frontend. Muévela al backend.`)
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
