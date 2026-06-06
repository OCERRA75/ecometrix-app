// api/admin-stats.js — Vercel Serverless Function
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ADMIN_EMAILS = ['oscar0316@gmail.com']

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
  if (!ADMIN_EMAILS.includes(user.email)) return res.status(403).json({ error: 'Acceso denegado' })

  try {
    // Total diagnósticos
    const { count: totalDiag } = await supabase
      .from('diagnosticos')
      .select('*', { count: 'exact', head: true })

    // Diagnósticos por mes (últimos 6 meses)
    const { data: diagPorMes } = await supabase
      .from('diagnosticos')
      .select('created_at, empresa')
      .order('created_at', { ascending: false })
      .limit(200)

    // Total planes activos
    const { count: totalPlanes } = await supabase
      .from('planes_de_reduccion')
      .select('*', { count: 'exact', head: true })
      .not('real_kgco2', 'is', null)

    // Total certificaciones
    const { count: totalCerts } = await supabase
      .from('certifications')
      .select('*', { count: 'exact', head: true })

    // Usuarios únicos con diagnóstico
    const { data: usuarios } = await supabase
      .from('diagnosticos')
      .select('user_id, empresa, calculo, created_at')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false })

    // Agrupar por user_id (último diagnóstico por usuario)
    const usuariosMap = {}
    for (const d of (usuarios || [])) {
      if (!usuariosMap[d.user_id]) {
        usuariosMap[d.user_id] = {
          user_id: d.user_id,
          empresa: d.empresa?.nombre || 'Sin nombre',
          sector: d.empresa?.sector || '-',
          pais: d.empresa?.pais || '-',
          total_kgco2: d.calculo?.totalKgMes || 0,
          ultimo_diagnostico: d.created_at,
          total_diagnosticos: 0,
        }
      }
      usuariosMap[d.user_id].total_diagnosticos++
    }

    // Certificaciones por usuario
    const { data: certs } = await supabase
      .from('certifications')
      .select('user_id, level, issued_at')
      .order('issued_at', { ascending: false })

    for (const c of (certs || [])) {
      if (usuariosMap[c.user_id]) {
        usuariosMap[c.user_id].certificacion = c.level
      }
    }

    // Planes activos por usuario
    const { data: planes } = await supabase
      .from('planes_de_reduccion')
      .select('user_id, estado')
      .not('real_kgco2', 'is', null)

    const planesCount = {}
    for (const p of (planes || [])) {
      planesCount[p.user_id] = (planesCount[p.user_id] || 0) + 1
    }
    for (const uid in usuariosMap) {
      usuariosMap[uid].meses_reportados = planesCount[uid] || 0
    }

    // Agrupar diagnósticos por mes
    const actividadMensual = {}
    for (const d of (diagPorMes || [])) {
      const mes = d.created_at?.slice(0, 7)
      if (mes) actividadMensual[mes] = (actividadMensual[mes] || 0) + 1
    }

    const actividadOrdenada = Object.entries(actividadMensual)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([mes, count]) => ({ mes, count }))

    return res.status(200).json({
      metricas: {
        total_diagnosticos: totalDiag || 0,
        total_usuarios: Object.keys(usuariosMap).length,
        total_planes_activos: totalPlanes || 0,
        total_certificaciones: totalCerts || 0,
      },
      usuarios: Object.values(usuariosMap).sort((a, b) =>
        new Date(b.ultimo_diagnostico) - new Date(a.ultimo_diagnostico)
      ),
      actividad_mensual: actividadOrdenada,
    })
  } catch (err) {
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}
