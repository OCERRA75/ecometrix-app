// api/send-report.js — Vercel Serverless Function
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { empresa, calculo, analisis, reporteId } = req.body

    if (!empresa?.email) {
      return res.status(400).json({ error: 'Email requerido' })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.warn('RESEND_API_KEY not set — skipping email')
      return res.status(200).json({ sent: false, reason: 'no_api_key' })
    }

    const nivelColor = {
      'Bajo': '#1D9E75',
      'Moderado': '#F59E0B',
      'Alto': '#EF4444',
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1D9E75, #16A34A); padding: 32px 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">🌿 EcoMetriX</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Tu diagnóstico de huella de carbono está listo</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 40px;">
      <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">Hola <strong>${empresa.nombre}</strong>,</p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Completaste tu diagnóstico de huella de carbono. Aquí tienes un resumen de tus resultados:
      </p>

      <!-- Métricas -->
      <div style="display: flex; gap: 16px; margin: 0 0 24px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 120px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px; text-align: center;">
          <p style="color: #1D9E75; font-size: 28px; font-weight: 700; margin: 0;">${calculo?.totalTonAnio || 0}</p>
          <p style="color: #6B7280; font-size: 12px; margin: 4px 0 0;">ton CO₂e/año</p>
        </div>
        <div style="flex: 1; min-width: 120px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; text-align: center;">
          <p style="color: ${nivelColor[calculo?.nivelImpacto] || '#6B7280'}; font-size: 20px; font-weight: 700; margin: 0;">${calculo?.nivelImpacto || 'N/A'}</p>
          <p style="color: #6B7280; font-size: 12px; margin: 4px 0 0;">Nivel de impacto</p>
        </div>
        <div style="flex: 1; min-width: 120px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; text-align: center;">
          <p style="color: #374151; font-size: 20px; font-weight: 700; margin: 0;">$${((calculo?.valorETS_COP || 0) / 1000000).toFixed(1)}M</p>
          <p style="color: #6B7280; font-size: 12px; margin: 4px 0 0;">COP/año (ETS)</p>
        </div>
      </div>

      <!-- Resumen ejecutivo -->
      ${analisis?.resumen_ejecutivo ? `
      <div style="background: #F0FDF4; border-left: 4px solid #1D9E75; border-radius: 0 8px 8px 0; padding: 16px; margin: 0 0 24px;">
        <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">${analisis.resumen_ejecutivo}</p>
      </div>` : ''}

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0 24px;">
        <a href="https://ecometrix-app-one.vercel.app/reporte/${reporteId}"
          style="background: #1D9E75; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 600; display: inline-block;">
          Ver reporte completo →
        </a>
      </div>

      <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
        EcoMetriX · GHG Protocol + ISO 14064 · <a href="https://ecometrix-app-one.vercel.app" style="color: #1D9E75;">ecometrix-app-one.vercel.app</a>
      </p>
    </div>
  </div>
</body>
</html>`

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'EcoMetriX <onboarding@resend.dev>',
        to: [empresa.email],
        subject: `Tu huella de carbono: ${calculo?.totalTonAnio || 0} ton CO₂e/año — ${empresa.nombre}`,
        html: htmlBody,
      }),
    })

    const emailData = await emailRes.json()

    if (!emailRes.ok) {
      console.error('Resend error:', emailData)
      return res.status(200).json({ sent: false, error: emailData })
    }

    return res.status(200).json({ sent: true, id: emailData.id })
  } catch (err) {
    console.error('send-report error:', err)
    return res.status(500).json({ error: err.message })
  }
}
