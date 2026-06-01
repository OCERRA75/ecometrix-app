// api/save-monthly-progress.js — Vercel Serverless Function
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verificar JWT del usuario
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Token inválido' })

  try {
    const { diagnostico_id, mes, anio, real_kgco2, nota, acciones } = req.body

    if (!diagnostico_id || !mes || !anio || real_kgco2 === undefined) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'Campos requeridos: diagnostico_id, mes, anio, real_kgco2',
      })
    }

    // Upsert: crea o actualiza el registro del mes
    const { data, error } = await supabase
      .from('planes_de_reduccion')
      .upsert({
        user_id: user.id,
        diagnostico_id,
        mes,
        anio,
        real_kgco2,
        nota: nota || null,
        acciones: acciones || [],
        estado: 'completado',
        // meta_kgco2 no se toca si ya existe
      }, {
        onConflict: 'user_id,diagnostico_id,mes,anio',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({
      ok: true,
      registro: data,
      message: `Progreso del mes ${mes}/${anio} guardado correctamente`,
    })
  } catch (err) {
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}
