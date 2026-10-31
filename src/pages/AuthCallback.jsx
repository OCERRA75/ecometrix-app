import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'

// Página de destino del magic link (/auth/callback).
// supabase.js ya tiene detectSessionInUrl + PKCE: el cliente intercambia el ?code= solo al cargar,
// y AuthProvider deja loading=false cuando termina. Aquí solo esperamos la sesión y redirigimos.

function leerErrorDeUrl() {
  const q = new URLSearchParams(window.location.search)
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const code = q.get('error_code') || h.get('error_code')
  const desc = q.get('error_description') || h.get('error_description')
  const err = q.get('error') || h.get('error')
  if (!code && !desc && !err) return null
  return { code, desc, err }
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [errorUrl] = useState(leerErrorDeUrl)
  const [esperaAgotada, setEsperaAgotada] = useState(false)

  // Sesión lista → al dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  // Si terminó de cargar y no hay sesión, damos unos segundos de gracia antes de mostrar error
  useEffect(() => {
    if (loading || user || errorUrl) return
    const t = setTimeout(() => setEsperaAgotada(true), 4000)
    return () => clearTimeout(t)
  }, [loading, user, errorUrl])

  const fallo = errorUrl || esperaAgotada

  if (!fallo) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-100 border-t-brand-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-text-secondary">Iniciando sesión…</p>
        </div>
      </div>
    )
  }

  const expirado = errorUrl?.code === 'otp_expired'
  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center px-6">
      <div className="card max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-text-primary mb-2">
          {expirado ? 'El enlace ya no es válido' : 'No pudimos iniciar tu sesión'}
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {expirado
            ? 'Los enlaces de acceso se pueden usar una sola vez y caducan en poco tiempo. Pide uno nuevo y ábrelo una sola vez, en el mismo navegador donde lo solicitaste.'
            : 'Pide un enlace nuevo e inténtalo de nuevo, en el mismo navegador donde lo solicitaste.'}
        </p>
        <Link to="/login" className="btn-primary inline-flex justify-center w-full py-3">Pedir un enlace nuevo</Link>
      </div>
    </div>
  )
}
