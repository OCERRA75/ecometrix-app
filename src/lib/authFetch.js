// src/lib/authFetch.js — fetch que agrega el token de sesión de Supabase
import { supabase } from './supabase'

export async function authFetch(url, init = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
}
