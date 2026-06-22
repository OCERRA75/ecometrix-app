// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase: variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no configuradas')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    // Persiste la sesion en localStorage — el usuario NO tiene que hacer login
    // cada vez que cierra y abre el navegador
    persistSession: true,

    // Renueva el token automaticamente antes de que expire (cada ~55 min)
    // Sin esto, la sesion expira en 1 hora y el usuario es deslogueado
    autoRefreshToken: true,

    // Detecta el token del Magic Link en la URL al regresar del email
    // Necesario para que /login?token=xxx funcione correctamente
    detectSessionInUrl: true,

    // Almacena la sesion en localStorage (default) — sobrevive al cierre del navegador
    // Alternativa: 'sessionStorage' (se borra al cerrar la pestana)
    storage: window.localStorage,

    // Flujo PKCE — mas seguro para SPAs (evita interceptacion del token)
    flowType: 'pkce',
  },
  // Reintentar requests fallidos automaticamente
  global: {
    headers: {
      'x-application-name': 'ecometrix',
    },
  },
  // Realtime desactivado — EcoMetriX no usa suscripciones en tiempo real
  // Activar si se agrega dashboard con actualizaciones live
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})

// ── Helper: obtener sesion activa ─────────────────────────────────────────────
// Uso: const { user, session } = await getSession()
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) return { user: null, session: null }
  return { user: session?.user ?? null, session }
}

// ── Helper: obtener plan efectivo del usuario actual ──────────────────────────
// Lee desde la view effective_plan (resuelve superadmin + trial)
export async function getPlanEfectivo(userId) {
  if (!userId) return { plan: 'free', role: 'user', trial: null }

  const { data, error } = await supabase
    .from('effective_plan')
    .select('plan_efectivo, role, trial_plan, trial_expires_at')
    .eq('id', userId)
    .single()

  if (error) {
    // Fallback directo a profiles
    const { data: perfil } = await supabase
      .from('profiles')
      .select('plan, role')
      .eq('id', userId)
      .single()
    return { plan: perfil?.plan ?? 'free', role: perfil?.role ?? 'user', trial: null }
  }

  return {
    plan: data.plan_efectivo ?? 'free',
    role: data.role ?? 'user',
    trial: data.trial_plan && data.trial_expires_at
      ? { plan: data.trial_plan, expires: new Date(data.trial_expires_at) }
      : null,
  }
}
