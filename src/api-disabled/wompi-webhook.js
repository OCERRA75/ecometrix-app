// api/wompi-webhook.js — Vercel Serverless Function
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const evento = req.body

    // Verificar firma del webhook
    const firma = req.headers['x-event-checksum']
    const cuerpo = JSON.stringify(evento)
    const firmaEsperada = crypto
      .createHmac('sha256', process.env.WOMPI_EVENTS_SECRET)
      .update(cuerpo)
      .digest('hex')

    if (firma !== firmaEsperada) {
      return res.status(401).json({ error: 'Firma inválida' })
    }

    const tx = evento?.data?.transaction
    if (!tx) return res.status(200).json({ ok: true })

    const { reference, status, id: wompi_id } = tx

    // Actualizar estado del pago
    const { data: pago } = await supabase
      .from('pagos')
      .update({ estado: status.toLowerCase(), wompi_id })
      .eq('referencia', reference)
      .select()
      .single()

    // Si el pago fue aprobado, actualizar el plan del usuario
    if (status === 'APPROVED' && pago) {
      await supabase
        .from('perfiles')
        .upsert({
          user_id: pago.user_id,
          plan: pago.plan_id,
          plan_activado_en: new Date().toISOString(),
        }, { onConflict: 'user_id' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: err.message })
  }
}
