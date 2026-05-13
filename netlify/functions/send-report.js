// netlify/functions/send-report.js
// POST /api/send-report — envía el reporte por email usando Resend

const emailTemplate = (empresa, calculo, analisis) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu reporte de huella de carbono — EcoMetriX</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #F8FAFA; color: #1A2E25; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .header { background: #0F6E56; border-radius: 16px 16px 0 0; padding: 32px; text-align: center; }
    .header-logo { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .logo-icon { width: 36px; height: 36px; background: #1D9E75; border-radius: 8px; display: inline-block; }
    .header h1 { color: white; font-size: 24px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.75); font-size: 14px; }
    .body { background: white; padding: 32px; border-left: 1px solid #D6E8E0; border-right: 1px solid #D6E8E0; }
    .nivel-badge { display: inline-block; padding: 6px 16px; border-radius: 99px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .nivel-alto { background: #FAECE7; color: #993C1D; }
    .nivel-moderado { background: #FAEEDA; color: #BA7517; }
    .nivel-bajo { background: #E1F5EE; color: #0F6E56; }
    .empresa-name { font-size: 22px; font-weight: 700; color: #1A2E25; margin-bottom: 4px; }
    .empresa-meta { font-size: 13px; color: #4A6358; margin-bottom: 24px; }
    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .metric { background: #F8FAFA; border: 1px solid #D6E8E0; border-radius: 12px; padding: 16px; }
    .metric-label { font-size: 11px; color: #8BA898; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .metric-value { font-size: 22px; font-weight: 700; color: #1A2E25; }
    .metric-unit { font-size: 12px; color: #4A6358; }
    .metric-main { background: #0F6E56; border-color: #0F6E56; }
    .metric-main .metric-label { color: rgba(255,255,255,0.65); }
    .metric-main .metric-value { color: white; }
    .metric-main .metric-unit { color: rgba(255,255,255,0.65); }
    .section-title { font-size: 15px; font-weight: 600; color: #1A2E25; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #D6E8E0; }
    .resumen { font-size: 14px; color: #4A6358; line-height: 1.7; margin-bottom: 24px; background: #E1F5EE; border-radius: 12px; padding: 16px; border-left: 4px solid #1D9E75; }
    .acciones { margin-bottom: 24px; }
    .accion { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #F1F5F3; }
    .accion:last-child { border-bottom: none; }
    .accion-num { width: 28px; height: 28px; background: #E1F5EE; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #0F6E56; flex-shrink: 0; }
    .accion-text { font-size: 13px; color: #1A2E25; font-weight: 500; margin-bottom: 4px; }
    .accion-tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag { font-size: 11px; padding: 2px 8px; border-radius: 99px; font-weight: 500; }
    .tag-green { background: #E1F5EE; color: #0F6E56; }
    .tag-gray { background: #F1F5F3; color: #4A6358; }
    .cta-box { background: #0F6E56; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .cta-box p { color: rgba(255,255,255,0.8); font-size: 13px; margin-bottom: 16px; }
    .cta-btn { display: inline-block; background: white; color: #0F6E56; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; }
    .metodologia { background: #F8FAFA; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .met-items { display: flex; gap: 16px; flex-wrap: wrap; }
    .met-item { font-size: 12px; color: #4A6358; }
    .met-item strong { color: #0F6E56; }
    .footer { background: #F8FAFA; border: 1px solid #D6E8E0; border-top: none; border-radius: 0 0 16px 16px; padding: 24px; text-align: center; }
    .footer p { font-size: 12px; color: #8BA898; line-height: 1.6; }
    .footer a { color: #0F6E56; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;">
        <div style="width:32px;height:32px;background:rgba(255,255,255,0.2);border-radius:8px;"></div>
        <span style="color:white;font-size:18px;font-weight:700;">EcoMetriX</span>
      </div>
      <h1>Tu reporte está listo</h1>
      <p>Diagnóstico de Huella de Carbono · ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="body">
      <span class="nivel-badge nivel-${calculo.nivelImpacto.toLowerCase()}">
        Nivel de impacto: ${calculo.nivelImpacto}
      </span>

      <div class="empresa-name">${empresa.nombre}</div>
      <div class="empresa-meta">${empresa.sector} · ${empresa.tamano} · ${empresa.pais}</div>

      <!-- Métricas -->
      <div class="metrics">
        <div class="metric metric-main" style="grid-column: 1 / -1;">
          <div class="metric-label">Huella de carbono total</div>
          <div class="metric-value">${calculo.totalTonAnio} <span class="metric-unit">ton CO₂e/año</span></div>
          <div class="metric-unit" style="margin-top:4px;">${calculo.totalKgMes.toLocaleString()} kg CO₂e/mes</div>
        </div>
        <div class="metric">
          <div class="metric-label">Alcance 1 — Directas</div>
          <div class="metric-value">${calculo.alcance1.toLocaleString()}</div>
          <div class="metric-unit">kg CO₂e/mes</div>
        </div>
        <div class="metric">
          <div class="metric-label">Alcance 2 — Energía</div>
          <div class="metric-value">${calculo.alcance2.toLocaleString()}</div>
          <div class="metric-unit">kg CO₂e/mes</div>
        </div>
      </div>

      <!-- Resumen -->
      ${analisis?.resumen_ejecutivo ? `
      <div class="section-title">Resumen ejecutivo</div>
      <div class="resumen">${analisis.resumen_ejecutivo}</div>
      ` : ''}

      <!-- Plan de acción -->
      ${analisis?.plan_accion ? `
      <div class="section-title">Plan de reducción</div>
      <div class="acciones">
        ${analisis.plan_accion.map((a, i) => `
          <div class="accion">
            <div class="accion-num">${i + 1}</div>
            <div>
              <div class="accion-text">${a.accion}</div>
              <div class="accion-tags">
                <span class="tag tag-green">-${a.reduccion_pct}% emisiones</span>
                <span class="tag tag-gray">${a.dificultad}</span>
                <span class="tag tag-gray">${a.plazo}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- CTA -->
      <div class="cta-box">
        <p>Accede al reporte completo con gráficas interactivas y métricas detalladas</p>
        <a href="https://ecometrix-co.netlify.app" class="cta-btn">Ver reporte completo →</a>
      </div>

      <!-- Metodología -->
      <div class="metodologia">
        <div class="section-title" style="border:none;padding:0;margin-bottom:10px;">Metodología aplicada</div>
        <div class="met-items">
          <div class="met-item"><strong>GHG Protocol</strong> Corporate Standard</div>
          <div class="met-item"><strong>ISO 14064-1</strong> Ed. 2018</div>
          <div class="met-item"><strong>IPCC AR6</strong> Factores de emisión</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>
        <strong style="color:#0F6E56;">EcoMetriX</strong> · Plataforma de huella de carbono para PYMEs<br>
        <a href="mailto:oscar@ecometrix.co">oscar@ecometrix.co</a> · <a href="https://ecometrix-co.netlify.app">ecometrix-co.netlify.app</a><br><br>
        Este diagnóstico es una estimación basada en los datos proporcionados.<br>
        Para una medición certificable se recomienda auditoría con verificador ISO 14064-3.
      </p>
    </div>
  </div>
</body>
</html>
`

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY no configurada' }) }
  }

  try {
    const { empresa, calculo, analisis, reporteId } = JSON.parse(event.body)

    const html = emailTemplate(empresa, calculo, analisis)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EcoMetriX <onboarding@resend.dev>',
        to: [empresa.email],
        subject: `Tu diagnóstico de huella de carbono — ${empresa.nombre}`,
        html,
        reply_to: 'oscar@ecometrix.co',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Resend error:', data)
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error enviando email', detail: data }),
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, emailId: data.id }),
    }

  } catch (err) {
    console.error('Send report error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
