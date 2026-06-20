// api/create-payment.js
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { checkOrigin } from './middleware/rateLimit.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLANES = {
  basico: {
    nombre: 'Plan Básico',
    precio_cop: 7900000,   // $79.000 COP en centavos
    nivel: 1,
  },
  pro: {
    nombre: 'Plan Pro',
    precio_cop: 19900000,  // $199.000 COP en centavos
    nivel: 2,
  },
  enterprise: {
    nombre: 'Plan Enterprise',
    precio_cop: 49900000,  // $499.000 COP en centavos
    nivel: 3,
  },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://ecometrix-app-one.vercel.app')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!checkOrigin(req, res)) return

  // Autenticar usuario
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Token inválido' })

  const { plan_id } = req.body
  const plan = PLANES[plan_id]
  if (!plan) return res.status(400).json({ error: 'Plan no válido' })

  try {
    // Verificar si ya tiene un plan igual o superior
    const { data: perfil } = await supabase
      .from('profiles')
      .select('plan, role')
      .eq('id', user.id)
      .single()

    if (perfil?.role === 'superadmin') {
      return res.status(400).json({ error: 'Cuenta superadmin — no requiere pago' })
    }

    const NIVEL_PLAN = { free: 0, basico: 1, pro: 2, enterprise: 3 }
    if ((NIVEL_PLAN[perfil?.plan] || 0) >= plan.nivel) {
      return res.status(400).json({ error: `Ya tienes ${perfil.plan} o superior` })
    }

    // Referencia única
    const referencia = `ecm_${user.id.slice(0, 8)}_${plan_id}_${Date.now()}`

    // Firma de integridad Wompi
    const cadena = `${referencia}${plan.precio_cop}COP${process.env.WOMPI_INTEGRITY_SECRET}`
    const firma = crypto.createHash('sha256').update(cadena).digest('hex')

    // Guardar intento de pago
    const { error: insertError } = await supabase.from('pagos').insert({
      user_id: user.id,
      referencia,
      plan_id,
      monto_cop: plan.precio_cop,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    })

    if (insertError) throw insertError

    return res.status(200).json({
      ok: true,
      referencia,
      firma,
      monto: plan.precio_cop,
      nombre_plan: plan.nombre,
      public_key: process.env.WOMPI_PUBLIC_KEY,
    })
  } catch (err) {
    console.error('create-payment error:', err)
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}
