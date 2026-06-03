// api/send-monthly-reminder.js — Vercel Cron Function
// Se ejecuta el día 1 de cada mes a las 9:00 AM (Colombia = UTC-5)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'EcoMetriX <notificaciones@ecometrix.app>'

export default async function handler(req, res) {
  // Verificar que es un cron job de Vercel o una llamada autorizada
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const mesActual = new Date().getMonth() + 1
  const anioActual = new Date().getFullYear()

  try {
    // Obtener todos los usuarios con planes activos
    const { data: planes } = await supabase
      .from('planes_de_reduccion')
      .select('user_id, mes, anio, real_kgco2, meta_kgco2, diagnostico_id')
      .eq('mes', mesActual)
      .eq('anio', anioActual)
      .is('real_kgco2', null) // Solo los que NO han reportado

    if (!planes || planes.length === 0) {
      return res.status(200).json({ ok: true, enviados: 0, message: 'No hay usuarios pendientes' })
    }

    // Obtener emails de los usuarios
    const userIds = [...new Set(planes.map(p => p.user_id))]
    const emailsEnviados = []
    const errores = []

    for (const userId of userIds) {
      try {
        // Obtener email del usuario via auth
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const user = users?.find(u => u.id === userId)
        if (!user?.email) continue

        const planUsuario = planes.find(p => p.user_id === userId)
        const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; }
    .header { background: #064e3b; padding: 32px; text-align: center; }
    .header h1 { color: white; font-size: 22px; margin: 0; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.7); font-size: 14px; margin: 8px 0 0; }
    .body { padding: 32px; }
    .mes-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .mes-card h3 { color: #065f46; margin: 0 0 8px; font-size: 16px; }
    .mes-card p { color: #047857; margin: 0; font-size: 14px; }
    .meta { font-size: 24px; font-weight: bold; color: #065f46; }
    .cta { display: block; background: #10b981; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; text-align: center; margin: 24px 0; }
    .footer { padding: 20px 32px; border-top: 1px solid #f3f4f6; text-align: center; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 EcoMetriX</h1>
      <p>Plan de Reducción de Emisiones</p>
    </div>
    <div class="body">
      <p style="color:#374151;font-size:15px;">Hola,</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;">
        Es el comienzo de <strong>${MESES[mesActual - 1]}</strong> y es momento de reportar tus emisiones del mes anterior en tu Plan de Reducción EcoMetriX.
      </p>
      <div class="mes-card">
        <h3>📊 Reporte pendiente: ${MESES[mesActual - 1]} ${anioActual}</h3>
        <p>Meta del mes: <span class="meta">${planUsuario.meta_kgco2?.toLocaleString()} kg CO₂</span></p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;">
        Registrar tu progreso mensual te permite:<br>
        ✓ Comparar tus emisiones reales vs la meta<br>
        ✓ Ver tu reducción acumulada<br>
        ✓ Mantener tu certificación activa
      </p>
      <a href="https://ecometrix-app-one.vercel.app/plan" class="cta">
        Reportar mis emisiones de ${MESES[mesActual - 1]} →
      </a>
    </div>
    <div class="footer">
      <p>EcoMetriX · Sostenibilidad empresarial para PyMEs colombianas</p>
      <p style="margin-top:4px;">Para cancelar estas notificaciones, ve a tu perfil en la app.</p>
    </div>
  </div>
</body>
</html>`

        // Enviar email via Resend
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: user.email,
            subject: `📊 Reporta tus emisiones de ${MESES[mesActual - 1]} — EcoMetriX`,
            html: emailHtml,
          }),
        })

        if (resendRes.ok) {
          emailsEnviados.push(user.email)
        } else {
          const err = await resendRes.json()
          errores.push({ email: user.email, error: err.message })
        }
      } catch (err) {
        errores.push({ userId, error: err.message })
      }
    }

    return res.status(200).json({
      ok: true,
      enviados: emailsEnviados.length,
      emails: emailsEnviados,
      errores,
    })
  } catch (err) {
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}
