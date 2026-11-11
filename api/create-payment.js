// api/create-payment.js — rate limiting, verificación de origen, monto calculado en servidor (mensual/anual) y renovación
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { checkRateLimit, checkOrigin } from '../src/lib/rateLimit.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PLANES = {
  basico:     { nombre: 'Plan Básico',     precio_cop: 7900000,  nivel: 1 }, // centavos: $79.000
  pro:        { nombre: 'Plan Pro',        precio_cop: 19900000, nivel: 2 }, // $199.000
  enterprise: { nombre: 'Plan Enterprise', precio_cop: 49900000, nivel: 3 }, // $499.000
}
const NIVEL_PLAN = { free: 0, basico: 1, pro: 2, enterprise: 3 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://www.ecometrix.app')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!checkOrigin(req, res)) return
  const permitido = await checkRateLimit(req, res, '/api/create-payment')
  if (!permitido) return

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  const { data: { user } = {}, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Token inválido' })

  const plan_id = req.body?.plan_id
  const plan = Object.prototype.hasOwnProperty.call(PLANES, plan_id) ? PLANES[plan_id] : null
  if (!plan) return res.status(400).json({ error: 'Plan no válido' })

  // El periodo y el monto SIEMPRE se calculan aquí; nunca se confía en el cliente
  const periodo = req.body?.periodo === 'anual' ? 'anual' : 'mensual'
  const monto = periodo === 'anual' ? Math.round(plan.precio_cop * 12 * 0.8) : plan.precio_cop // centavos

  if (!process.env.WOMPI_INTEGRITY_SECRET || !process.env.WOMPI_PUBLIC_KEY) {
    console.error('create-payment: faltan WOMPI_INTEGRITY_SECRET o WOMPI_PUBLIC_KEY')
    return res.status(503).json({ error: 'Pagos no disponibles temporalmente' })
  }

  try {
    const { data: perfil } = await supabase.from('profiles').select('plan, role, plan_vence_en').eq('id', user.id).single()

    if (perfil?.role === 'superadmin') {
      return res.status(400).json({ error: 'Cuenta superadmin — no requiere pago' })
    }
    // Plan vigente: sin fecha = asignado manualmente (no vence); con fecha vencida = cuenta como sin plan
    const ahora = Date.now()
    const vence = perfil?.plan_vence_en ? new Date(perfil.plan_vence_en).getTime() : null
    const vigente = vence === null || vence > ahora
    const nivelActual = vigente ? (NIVEL_PLAN[perfil?.plan] || 0) : 0

    if (nivelActual > plan.nivel) {
      return res.status(400).json({ error: `Ya tienes un plan superior activo (${perfil.plan})` })
    }
    if (nivelActual === plan.nivel) {
      // Mismo plan: solo se puede renovar en los últimos 7 días de vigencia
      const DIAS_RENOVACION = 7
      const puedeRenovar = vence !== null && vence - ahora <= DIAS_RENOVACION * 86400000
      if (!puedeRenovar) {
        const hasta = vence ? new Date(vence).toISOString().slice(0, 10) : null
        return res.status(400).json({ error: hasta ? `Tu plan está activo hasta ${hasta}. Podrás renovarlo 7 días antes.` : `Ya tienes ${perfil.plan}` })
      }
    }

    const referencia = `ecm_${user.id.slice(0, 8)}_${plan_id}_${Date.now()}`

    // Firma de integridad Wompi: SHA256(referencia + monto_en_centavos + moneda + secreto)
    const cadena = `${referencia}${monto}COP${process.env.WOMPI_INTEGRITY_SECRET}`
    const firma = crypto.createHash('sha256').update(cadena).digest('hex')

    const { error: insertError } = await supabase.from('pagos').insert({
      user_id: user.id,
      referencia,
      plan_id,
      monto_cop: monto,
      periodo,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    })
    if (insertError) throw insertError

    return res.status(200).json({
      ok: true,
      referencia,
      firma,
      monto,
      periodo,
      nombre_plan: plan.nombre,
      public_key: process.env.WOMPI_PUBLIC_KEY,
    })
  } catch (err) {
    console.error('create-payment error:', err)
    return res.status(500).json({ error: 'server_error' })
  }
}
