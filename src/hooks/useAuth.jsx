import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase.js'

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState('free') // free | pro | enterprise

  useEffect(() => {
    // Sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchPlan(session.user.id)
      setLoading(false)
    })

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchPlan(session.user.id)
      else setPlan('free')
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchPlan = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .single()
      if (data?.plan) setPlan(data.plan)
    } catch {
      setPlan('free')
    }
  }

  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setPlan('free')
  }

  return (
    <AuthContext.Provider value={{ user, loading, plan, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
