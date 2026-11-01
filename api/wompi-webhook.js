// api/wompi-webhook.js — firma verificada (SHA256 según docs de Wompi), fail-closed, idempotente
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PLAN_NOMBRES = { basico: 'Plan Básico', pro: 'Plan Pro', enterprise: 'Plan Enterprise' }

// Valor anidado por ruta, ej. "transaction.amount_in_cents"
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

// Wompi: checksum = SHA256( valores de signature.properties (en orden, dentro de data) + timestamp + secreto de eventos )
export function verificarFirma(evento, secret, headerChecksum) {
  if (!secret) return false
  const props = evento?.signature?.properties
  const timestamp = evento?.timestamp
  const recibido = evento?.signature?.checksum || headerChecksum
  if (!Array.isArray(props) || timestamp === undefined || !recibido) return false
  const concat = props.map(p => String(getPath(evento.data, p) ?? '')).join('')
  const esperado = crypto.createHash('sha256').update(`${concat}${timestamp}${secret}`).digest('hex')
  const a = Buffer.from(esperado.toLowerCase())
  const b = Buffer.from(String(recibido).toLowerCase())
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

async function enviarEmailConfirmacion(email, plan_id) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  const nombre = PLAN_NOMBRES[plan_id] || plan_id
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'EcoMetriX <noreply@ecometrix.app>',
      to: email,
      subject: `✅ Tu ${nombre} está activo — EcoMetriX`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <div style="background:#1d9e75;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#ffffff;margin:0;font-size:22px">🌿 EcoMetriX</h1>
          </div>
          <h2 style="color:#1a1a1a">¡Pago confirmado!</h2>
          <p style="color:#555">Tu <strong>${nombre}</strong> ya está activo. Ahora tienes acceso completo a todas las funciones incluidas en tu plan.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0">
            <p style="margin:0;color:#166534;font-weight:600">Plan activado: ${nombre}</p>
          </div>
          <a href="https://www.ecometrix.app/dashboard"
             style="display:inline-block;background:#1d9e75;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
            Ir al Dashboard →
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">¿Preguntas? Escríbenos a contacto@ecometrix.app</p>
        </div>`,
    }),
  }).catch(e => console.error('Email error:', e))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const evento = req.body

  // ── Firma: sin secreto configurado o firma inválida → rechazar ─────────────
  if (!verificarFirma(evento, process.env.WOMPI_EVENTS_SECRET, req.headers['x-event-checksum'])) {
    console.error('Wompi webhook: firma inválida o WOMPI_EVENTS_SECRET ausente')
    return res.status(401).json({ error: 'Firma inválida' })
  }

  try {
    const tx = evento?.data?.transaction
    if (!tx || !tx.reference) return res.status(200).json({ ok: true })

    const { reference, status, id: wompi_id } = tx

    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .select('user_id, plan_id, monto_cop, estado')
      .eq('referencia', reference)
      .maybeSingle()

    if (pagoError) {
      console.error('Error leyendo pago:', pagoError)
      return res.status(500).json({ error: 'db_error' }) // Wompi reintenta
    }
    if (!pago) {
      console.error('Pago no encontrado:', reference)
      return res.status(200).json({ ok: true })
    }

    // Monto y moneda deben coincidir con lo registrado al crear el pago
    if (status === 'APPROVED' && (Number(tx.amount_in_cents) !== Number(pago.monto_cop) || tx.currency !== 'COP')) {
      console.error('Monto/moneda no coinciden', reference, tx.amount_in_cents, tx.currency, pago.monto_cop)
      await supabase.from('pagos').update({ estado: 'monto_invalido', wompi_id, updated_at: new Date().toISOString() }).eq('referencia', reference)
      return res.status(200).json({ ok: true })
    }

    const yaAprobado = pago.estado === 'approved'
    // No degradar un pago ya aprobado por eventos tardíos
    if (!yaAprobado) {
      const { error: updErr } = await supabase
        .from('pagos')
        .update({ estado: String(status).toLowerCase(), wompi_id, updated_at: new Date().toISOString() })
        .eq('referencia', reference)
      if (updErr) {
        console.error('Error actualizando pago:', updErr)
        return res.status(500).json({ error: 'db_error' })
      }
    }

    if (status === 'APPROVED' && !yaAprobado) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan: pago.plan_id,
          plan_activado_en: new Date().toISOString(),
          trial_plan: null,
          trial_expires_at: null,
        })
        .eq('id', pago.user_id)

      if (updateError) {
        console.error('Error activando plan:', updateError)
        // Revertir a pendiente para que el reintento de Wompi vuelva a activarlo
        await supabase.from('pagos').update({ estado: 'pendiente' }).eq('referencia', reference)
        return res.status(500).json({ error: 'db_error' })
      }
      const { data: userData } = await supabase.auth.admin.getUserById(pago.user_id)
      if (userData?.user?.email) await enviarEmailConfirmacion(userData.user.email, pago.plan_id)
      console.log(`Plan ${pago.plan_id} activado para user ${pago.user_id}`)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: 'server_error' })
  }
}
