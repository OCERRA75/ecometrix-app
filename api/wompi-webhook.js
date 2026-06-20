// api/wompi-webhook.js
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLAN_NOMBRES = {
  basico:     'Plan Básico',
  pro:        'Plan Pro',
  enterprise: 'Plan Enterprise',
}

async function enviarEmailConfirmacion(email, plan_id) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'EcoMetriX <noreply@ecometrix.app>',
      to: email,
      subject: `✅ Tu ${PLAN_NOMBRES[plan_id]} está activo — EcoMetriX`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <div style="background:#1d9e75;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:white;margin:0;font-size:22px">🌿 EcoMetriX</h1>
          </div>
          <h2 style="color:#1a1a1a">¡Pago confirmado!</h2>
          <p style="color:#555">Tu <strong>${PLAN_NOMBRES[plan_id]}</strong> ya está activo. Ahora tienes acceso completo a todas las funciones incluidas en tu plan.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0">
            <p style="margin:0;color:#166534;font-weight:600">Plan activado: ${PLAN_NOMBRES[plan_id]}</p>
          </div>
          <a href="https://ecometrix-app-one.vercel.app/dashboard"
             style="display:inline-block;background:#1d9e75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
            Ir al Dashboard →
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">Si tienes preguntas escríbenos a oscar@ecometrix.co</p>
        </div>
      `,
    }),
  }).catch(e => console.error('Email error:', e))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const evento = req.body

    // ── Verificar firma HMAC del webhook ────────────────────────────────────
    const firma = req.headers['x-event-checksum']
    const firmaEsperada = crypto
      .createHmac('sha256', process.env.WOMPI_EVENTS_SECRET || '')
      .update(JSON.stringify(evento))
      .digest('hex')

    if (process.env.WOMPI_EVENTS_SECRET && firma !== firmaEsperada) {
      console.error('Firma Wompi inválida')
      return res.status(401).json({ error: 'Firma inválida' })
    }

    const tx = evento?.data?.transaction
    if (!tx) return res.status(200).json({ ok: true })

    const { reference, status, id: wompi_id } = tx

    // ── Actualizar estado del pago ───────────────────────────────────────────
    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .update({ estado: status.toLowerCase(), wompi_id, updated_at: new Date().toISOString() })
      .eq('referencia', reference)
      .select('user_id, plan_id')
      .single()

    if (pagoError || !pago) {
      console.error('Pago no encontrado:', reference)
      return res.status(200).json({ ok: true }) // 200 siempre a Wompi
    }

    // ── Si aprobado → activar plan en profiles (tabla correcta) ─────────────
    if (status === 'APPROVED') {
      const { error: updateError } = await supabase
        .from('profiles')           // ← tabla correcta que lee PlanGuard
        .update({
          plan: pago.plan_id,
          plan_activado_en: new Date().toISOString(),
          trial_plan: null,         // cancelar trial si había uno
          trial_expires_at: null,
        })
        .eq('id', pago.user_id)    // ← campo correcto

      if (updateError) {
        console.error('Error actualizando plan:', updateError)
      } else {
        // Obtener email para confirmación
        const { data: userData } = await supabase.auth.admin.getUserById(pago.user_id)
        if (userData?.user?.email) {
          await enviarEmailConfirmacion(userData.user.email, pago.plan_id)
        }
        console.log(`Plan ${pago.plan_id} activado para user ${pago.user_id}`)
      }
    }

    // ── Si fallido/rechazado → registrar ────────────────────────────────────
    if (['DECLINED', 'VOIDED', 'ERROR'].includes(status)) {
      console.log(`Pago ${status} para referencia ${reference}`)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(200).json({ ok: true }) // siempre 200 a Wompi
  }
}
