import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function Login() {
  const { signInWithEmail, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Si ya está logueado, redirigir
  if (user) {
    navigate('/dashboard')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const { error } = await signInWithEmail(email)
    if (error) {
      setError('Error al enviar el magic link. Verifica el email e intenta de nuevo.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-400 flex items-center justify-center shadow-card">
              <IconLeaf />
            </div>
            <span className="text-xl font-bold text-brand-400">EcoMetriX</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Accede a tu cuenta</h1>
          <p className="text-text-secondary text-sm">Sin contraseña — te enviamos un link mágico</p>
        </div>

        {/* Card */}
        <div className="card">
          {!sent ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Correo corporativo
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    required
                    className="input"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-danger text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn-primary w-full justify-center py-3 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : 'Enviar magic link →'}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-border text-center">
                <p className="text-xs text-text-muted">
                  ¿No tienes cuenta?{' '}
                  <Link to="/diagnostico" className="text-brand-400 font-medium hover:underline">
                    Inicia con un diagnóstico gratis
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Revisa tu correo</h2>
              <p className="text-sm text-text-secondary mb-4">
                Enviamos un link mágico a <strong>{email}</strong>.<br />
                Clic en el link para acceder — expira en 1 hora.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="btn-ghost text-sm"
              >
                Usar otro correo
              </button>
            </div>
          )}
        </div>

        {/* Seguridad */}
        <p className="text-center text-xs text-text-muted mt-4">
          🔒 Sin contraseñas — autenticación segura con Supabase
        </p>
      </div>
    </div>
  )
}
