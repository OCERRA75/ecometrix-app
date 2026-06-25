// api/process-ia-queue.js — Vercel Cron Job
// Configurar en vercel.json: { "path": "/api/process-ia-queue", "schedule": "* * * * *" }
// Corre cada minuto, procesa hasta 5 jobs pendientes por invocación

export default async function handler(req, res) {
  // Solo Vercel Cron o llamada interna autenticada
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
  }

  try {
    // ── Tomar hasta 5 jobs pendientes (sin procesar o fallidos con < 3 intentos) ──
    const jobsRes = await fetch(
      `${supabaseUrl}/rest/v1/jobs_queue?type=eq.analisis_ia&status=in.(pending,failed)&attempts=lt.3&order=created_at.asc&limit=5`,
      { headers }
    )
    const jobs = await jobsRes.json()

    if (!jobs.length) {
      return res.status(200).json({ processed: 0, message: 'No pending jobs' })
    }

    const results = []

    for (const job of jobs) {
      // ── Marcar como en proceso (evita que otro cron lo tome) ─────────────
      await fetch(`${supabaseUrl}/rest/v1/jobs_queue?id=eq.${job.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'processing', attempts: job.attempts + 1 }),
      })

      try {
        const payload = JSON.parse(job.payload)
        const { diagnostico_id, empresa, calculo } = payload

        // ── Llamar a Claude ───────────────────────────────────────────────
        const prompt = `Eres consultor experto en huella de carbono (GHG Protocol, ISO 14064).
Empresa: ${empresa.nombre} | Sector: ${empresa.sector} | Tamaño: ${empresa.tamano} | País: ${empresa.pais}
RESULTADOS: Alcance 1: ${calculo.alcance1} kg CO2e/mes | Alcance 2: ${calculo.alcance2} kg CO2e/mes | Alcance 3: ${calculo.alcance3} kg CO2e/mes | TOTAL: ${calculo.totalTonAnio} ton CO2e/año | Nivel: ${calculo.nivelImpacto}
Genera JSON exacto:
{"resumen_ejecutivo":"2-3 oraciones","principales_fuentes":["f1","f2","f3"],"benchmark":"comparación sectorial","plan_accion":[{"accion":"desc","reduccion_pct":15,"dificultad":"Fácil","plazo":"1-3 meses"},{"accion":"desc","reduccion_pct":20,"dificultad":"Media","plazo":"3-6 meses"},{"accion":"desc","reduccion_pct":25,"dificultad":"Media","plazo":"6-12 meses"},{"accion":"desc","reduccion_pct":10,"dificultad":"Fácil","plazo":"1-3 meses"},{"accion":"desc","reduccion_pct":30,"dificultad":"Difícil","plazo":"12-24 meses"}],"siguiente_paso":"recomendación"}`

        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        const aiData = await aiRes.json()
        const text = aiData.content?.[0]?.text || ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)

        if (!jsonMatch) throw new Error('Claude no devolvió JSON válido')

        const analisis = JSON.parse(jsonMatch[0])

        // ── Actualizar diagnóstico con análisis real ───────────────────────
        await fetch(`${supabaseUrl}/rest/v1/diagnosticos?id=eq.${diagnostico_id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            analisis,
            analisis_status: 'completed',
          }),
        })

        // ── Marcar job como completado ────────────────────────────────────
        await fetch(`${supabaseUrl}/rest/v1/jobs_queue?id=eq.${job.id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            status: 'completed',
            completed_at: new Date().toISOString(),
          }),
        })

        results.push({ id: diagnostico_id, status: 'completed' })

      } catch (jobErr) {
        console.error(`Job ${job.id} failed:`, jobErr)

        // ── Marcar como fallido para reintento (máx 3 intentos) ──────────
        const nuevoStatus = job.attempts + 1 >= 3 ? 'dead' : 'failed'
        await fetch(`${supabaseUrl}/rest/v1/jobs_queue?id=eq.${job.id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            status: nuevoStatus,
            error: jobErr.message,
          }),
        })

        results.push({ id: job.id, status: nuevoStatus, error: jobErr.message })
      }
    }

    return res.status(200).json({ processed: jobs.length, results })

  } catch (err) {
    console.error('Queue processor error:', err)
    return res.status(500).json({ error: err.message })
  }
}
