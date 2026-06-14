// api/get-reduction-plan.js — Vercel Serverless Function
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Token inválido' })

  const { diagnostico_id, anio } = req.query
  if (!diagnostico_id) return res.status(400).json({ error: 'diagnostico_id requerido' })

  const anioFiltro = parseInt(anio) || new Date().getFullYear()

  try {
    const { data, error } = await supabase
      .from('planes_de_reduccion')
      // ── Solo columnas que se usan — eliminado SELECT * ───────────────────
      .select('mes, meta_kgco2, real_kgco2, estado, acciones, nota')
      .eq('user_id', user.id)
      .eq('diagnostico_id', diagnostico_id)
      .eq('anio', anioFiltro)
      .order('mes', { ascending: true })

    if (error) throw error

    const mesesCompletos = data.filter(m => m.real_kgco2 !== null)
    const mesActual = new Date().getMonth() + 1

    const resumen = {
      total_meses: data.length,
      meses_reportados: mesesCompletos.length,
      reduccion_acumulada_pct: calcularReduccion(data),
      estado_general: calcularEstadoGeneral(data, mesActual),
      proximo_mes: data.find(m => m.mes === mesActual && !m.real_kgco2) || null,
    }

    // ── Cache-Control: privado por usuario, 5 min, revalida en background ──
    // La llave lógica es user_id+diagnostico_id+anio — el token JWT lo garantiza
    res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')

    return res.status(200).json({ plan: data, resumen, anio: anioFiltro })
  } catch (err) {
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}

// ── Un solo reduce en lugar de 3 iteraciones separadas ──────────────────────
function calcularReduccion(meses) {
  const conDatos = meses.filter(m => m.real_kgco2 !== null && m.meta_kgco2)
  if (!conDatos.length) return 0
  const pctTotal = conDatos.reduce((acc, m) => {
    return acc + ((m.meta_kgco2 - m.real_kgco2) / m.meta_kgco2) * 100
  }, 0)
  return Math.round(pctTotal / conDatos.length)
}

function calcularEstadoGeneral(meses, mesActual) {
  // Un solo reduce que calcula todo en una pasada
  const stats = meses.reduce((acc, m) => {
    if (m.mes > mesActual) return acc
    if (m.real_kgco2 === null) {
      acc.pendientes++
    } else {
      acc.reportados++
      if (m.real_kgco2 <= m.meta_kgco2) acc.enMeta++
    }
    return acc
  }, { reportados: 0, pendientes: 0, enMeta: 0 })

  if (stats.pendientes > 1) return 'atrasado'
  if (stats.enMeta === stats.reportados) return 'en_meta'
  if (stats.enMeta >= stats.reportados * 0.6) return 'en_progreso'
  return 'revisar'
}
