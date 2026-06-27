// api/internal.js
// Consolida 5 funciones desactivadas en una sola para respetar limite Hobby de Vercel
// Rutas: POST/GET /api/internal?route=get-certification|get-reduction-plan|process-ia-queue|save-monthly-progress|send-report

import { createClient } from '@supabase/supabase-js'

// ── CORS helper ────────────────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
}

// ── GET-CERTIFICATION ──────────────────────────────────────────────────────────
async function getCertification(req, res) {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { diagnostico_id, empresa, calculo, analisis } = req.body
  if (!calculo || !empresa) return res.status(400).json({ error: 'Missing required fields: empresa, calculo' })

  if (diagnostico_id) {
    const { data: cached } = await supabase
      .from('certificaciones')
      .select('score, level, level_name, breakdown, badges_earned, verification_code, issued_at, empresa_nombre')
      .eq('diagnostico_id', diagnostico_id)
      .single()
    if (cached) {
      return res.status(200).json({
        score: cached.score, level: cached.level, level_name: cached.level_name,
        breakdown: cached.breakdown, badges_earned: cached.badges_earned,
        new_badges: cached.badges_earned.map(b => b.badge_key),
        verification_code: cached.verification_code,
        certification: { empresa_nombre: cached.empresa_nombre, issued_at: cached.issued_at },
        _cache: 'hit',
      })
    }
  }

  const breakdown = {
    alcances_1_2: calculo.alcance1 > 0 && calculo.alcance2 > 0 ? 30 : calculo.alcance1 > 0 ? 20 : 0,
    alcance_3: calculo.alcance3 > 0 ? 15 : 0,
    plan_accion: Math.min(25, (analisis?.plan_accion?.length || 0) * 5),
    nivel_impacto: calculo.nivelImpacto === 'Bajo' ? 20 : calculo.nivelImpacto === 'Moderado' ? 10 : 5,
    perfil_empresa: empresa.nombre && empresa.sector && empresa.tamano && empresa.pais ? 10 : 5,
  }
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0)
  const level = score >= 85 ? 4 : score >= 65 ? 3 : score >= 40 ? 2 : 1
  const levelNames = { 1: 'Iniciado Verde', 2: 'Comprometido', 3: 'Avanzado', 4: 'Lider Sostenible' }
  const badgesEarned = [{ badge_key: 'first_emission' }]
  if (calculo.alcance3 > 0) badgesEarned.push({ badge_key: 'full_scope' })
  if ((analisis?.plan_accion?.length || 0) >= 3) badgesEarned.push({ badge_key: 'planner' })
  if (calculo.nivelImpacto === 'Bajo') badgesEarned.push({ badge_key: 'low_impact' })
  if (score >= 90) badgesEarned.push({ badge_key: 'leader' })
  const shortId = (diagnostico_id || 'DIAG').slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X')
  const verification_code = `ECO-${shortId}-${score}`
  const certId = `cert_${diagnostico_id || Date.now()}`
  const issuedAt = new Date().toISOString()

  try {
    await supabase.from('certificaciones').upsert({
      id: certId, diagnostico_id: diagnostico_id || null, user_id: null,
      empresa_nombre: empresa.nombre, score, level, level_name: levelNames[level],
      verification_code, badges_earned: badgesEarned, breakdown, issued_at: issuedAt,
    }, { onConflict: 'diagnostico_id' })
  } catch (err) { console.warn('Cert save error:', err) }

  return res.status(200).json({
    score, level, level_name: levelNames[level], breakdown, badges_earned: badgesEarned,
    new_badges: badgesEarned.map(b => b.badge_key), verification_code,
    certification: { empresa_nombre: empresa.nombre, issued_at: issuedAt },
    _cache: 'miss',
  })
}

// ── GET-REDUCTION-PLAN ─────────────────────────────────────────────────────────
async function getReductionPlan(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  setCORS(res)
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token requerido' })
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Token invalido' })

  const { diagnostico_id, anio } = req.query
  if (!diagnostico_id) return res.status(400).json({ error: 'diagnostico_id requerido' })
  const anioFiltro = parseInt(anio) || new Date().getFullYear()

  try {
    const { data, error } = await supabase
      .from('planes_de_reduccion')
      .select('mes, meta_kgco2, real_kgco2, estado, acciones, nota')
      .eq('user_id', user.id).eq('diagnostico_id', diagnostico_id).eq('anio', anioFiltro)
      .order('mes', { ascending: true })
    if (error) throw error

    const mesActual = new Date().getMonth() + 1
    const conDatos = data.filter(m => m.real_kgco2 !== null && m.meta_kgco2)
    const reduccion = conDatos.length
      ? Math.round(conDatos.reduce((acc, m) => acc + ((m.meta_kgco2 - m.real_kgco2) / m.meta_kgco2) * 100, 0) / conDatos.length)
      : 0
    const stats = data.reduce((acc, m) => {
      if (m.mes > mesActual) return acc
      if (m.real_kgco2 === null) acc.pendientes++
      else { acc.reportados++; if (m.real_kgco2 <= m.meta_kgco2) acc.enMeta++ }
      return acc
    }, { reportados: 0, pendientes: 0, enMeta: 0 })
    const estadoGeneral = stats.pendientes > 1 ? 'atrasado'
      : stats.enMeta === stats.reportados ? 'en_meta'
      : stats.enMeta >= stats.reportados * 0.6 ? 'en_progreso' : 'revisar'

    res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')
    return res.status(200).json({
      plan: data,
      resumen: { total_meses: data.length, meses_reportados: conDatos.length, reduccion_acumulada_pct: reduccion, estado_general: estadoGeneral, proximo_mes: data.find(m => m.mes === mesActual && !m.real_kgco2) || null },
      anio: anioFiltro,
    })
  } catch (err) {
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}

// ── PROCESS-IA-QUEUE ───────────────────────────────────────────────────────────
async function processIaQueue(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'Unauthorized' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const headers = { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }

  try {
    const jobsRes = await fetch(
      `${supabaseUrl}/rest/v1/jobs_queue?type=eq.analisis_ia&status=in.(pending,failed)&attempts=lt.3&order=created_at.asc&limit=5`,
      { headers }
    )
    const jobs = await jobsRes.json()
    if (!jobs.length) return res.status(200).json({ processed: 0, message: 'No pending jobs' })

    const results = []
    for (const job of jobs) {
      await fetch(`${supabaseUrl}/rest/v1/jobs_queue?id=eq.${job.id}`, {
        method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'processing', attempts: job.attempts + 1 }),
      })
      try {
        const { diagnostico_id, empresa, calculo } = JSON.parse(job.payload)
        const prompt = `Eres consultor experto en huella de carbono (GHG Protocol, ISO 14064).
Empresa: ${empresa.nombre} | Sector: ${empresa.sector} | Tamano: ${empresa.tamano} | Pais: ${empresa.pais}
Alcance 1: ${calculo.alcance1} kg CO2e/mes | Alcance 2: ${calculo.alcance2} kg CO2e/mes | Alcance 3: ${calculo.alcance3} kg CO2e/mes | TOTAL: ${calculo.totalTonAnio} ton CO2e/anio | Nivel: ${calculo.nivelImpacto}
Genera JSON exacto sin markdown: {"resumen_ejecutivo":"2-3 oraciones","principales_fuentes":["f1","f2","f3"],"benchmark":"comparacion sectorial","plan_accion":[{"accion":"desc","reduccion_pct":15,"dificultad":"Facil","plazo":"1-3 meses"},{"accion":"desc","reduccion_pct":20,"dificultad":"Media","plazo":"3-6 meses"},{"accion":"desc","reduccion_pct":25,"dificultad":"Media","plazo":"6-12 meses"},{"accion":"desc","reduccion_pct":10,"dificultad":"Facil","plazo":"1-3 meses"},{"accion":"desc","reduccion_pct":30,"dificultad":"Dificil","plazo":"12-24 meses"}],"siguiente_paso":"recomendacion"}`

        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
        })
        const aiData = await aiRes.json()
        const text = aiData.content?.[0]?.text || ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('Claude no devolvio JSON valido')
        const analisis = JSON.parse(jsonMatch[0])

        await fetch(`${supabaseUrl}/rest/v1/diagnosticos?id=eq.${diagnostico_id}`, {
          method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ analisis, analisis_status: 'completed' }),
        })
        await fetch(`${supabaseUrl}/rest/v1/jobs_queue?id=eq.${job.id}`, {
          method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString() }),
        })
        results.push({ id: diagnostico_id, status: 'completed' })
      } catch (jobErr) {
        const nuevoStatus = job.attempts + 1 >= 3 ? 'dead' : 'failed'
        await fetch(`${supabaseUrl}/rest/v1/jobs_queue?id=eq.${job.id}`, {
          method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ status: nuevoStatus, error: jobErr.message }),
        })
        results.push({ id: job.id, status: nuevoStatus, error: jobErr.message })
      }
    }
    return res.status(200).json({ processed: jobs.length, results })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

// ── SAVE-MONTHLY-PROGRESS ──────────────────────────────────────────────────────
async function saveMonthlyProgress(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  setCORS(res)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token requerido' })
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Token invalido' })

  try {
    const { diagnostico_id, mes, anio, real_kgco2, nota, acciones } = req.body
    if (!diagnostico_id || !mes || !anio || real_kgco2 === undefined) {
      return res.status(400).json({ error: 'bad_request', message: 'Campos requeridos: diagnostico_id, mes, anio, real_kgco2' })
    }
    const { data: existente } = await supabase
      .from('planes_de_reduccion').select('meta_kgco2, acciones')
      .eq('user_id', user.id).eq('diagnostico_id', diagnostico_id).eq('mes', mes).eq('anio', anio).single()
    if (!existente) return res.status(404).json({ error: 'not_found', message: 'Registro del mes no encontrado' })

    const { data, error } = await supabase.from('planes_de_reduccion')
      .update({ real_kgco2, nota: nota || null, acciones: acciones || existente.acciones || [], estado: 'completado' })
      .eq('user_id', user.id).eq('diagnostico_id', diagnostico_id).eq('mes', mes).eq('anio', anio)
      .select().single()
    if (error) throw error
    return res.status(200).json({ ok: true, registro: data, message: `Progreso del mes ${mes}/${anio} guardado` })
  } catch (err) {
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}

// ── SEND-REPORT ────────────────────────────────────────────────────────────────
async function sendReport(req, res) {
  setCORS(res)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { empresa, calculo, analisis, reporteId } = req.body
    if (!empresa?.email) return res.status(400).json({ error: 'Email requerido' })

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return res.status(200).json({ sent: false, reason: 'no_api_key' })

    const nivelColor = { 'Bajo': '#1D9E75', 'Moderado': '#F59E0B', 'Alto': '#EF4444' }
    const htmlBody = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1D9E75,#16A34A);padding:32px 40px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:24px;">EcoMetriX</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Tu diagnostico de huella de carbono esta listo</p>
  </div>
  <div style="padding:32px 40px;">
    <p style="color:#374151;font-size:15px;">Hola <strong>${empresa.nombre}</strong>,</p>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">Completaste tu diagnostico de huella de carbono. Aqui tienes un resumen:</p>
    <div style="display:flex;gap:16px;margin:24px 0;flex-wrap:wrap;">
      <div style="flex:1;min-width:120px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;text-align:center;">
        <p style="color:#1D9E75;font-size:28px;font-weight:700;margin:0;">${calculo?.totalTonAnio || 0}</p>
        <p style="color:#6B7280;font-size:12px;margin:4px 0 0;">ton CO2e/anio</p>
      </div>
      <div style="flex:1;min-width:120px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px;text-align:center;">
        <p style="color:${nivelColor[calculo?.nivelImpacto] || '#6B7280'};font-size:20px;font-weight:700;margin:0;">${calculo?.nivelImpacto || 'N/A'}</p>
        <p style="color:#6B7280;font-size:12px;margin:4px 0 0;">Nivel de impacto</p>
      </div>
    </div>
    ${analisis?.resumen_ejecutivo ? `<div style="background:#F0FDF4;border-left:4px solid #1D9E75;border-radius:0 8px 8px 0;padding:16px;margin:0 0 24px;"><p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">${analisis.resumen_ejecutivo}</p></div>` : ''}
    <div style="text-align:center;margin:32px 0 24px;">
      <a href="https://ecometrix-app-one.vercel.app/reporte/${reporteId}" style="background:#1D9E75;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;display:inline-block;">Ver reporte completo</a>
    </div>
    <p style="color:#9CA3AF;font-size:12px;text-align:center;">EcoMetriX - GHG Protocol + ISO 14064</p>
  </div>
</div>
</body></html>`

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: 'EcoMetriX <onboarding@resend.dev>',
        to: [empresa.email],
        subject: `Tu huella de carbono: ${calculo?.totalTonAnio || 0} ton CO2e/anio - ${empresa.nombre}`,
        html: htmlBody,
      }),
    })
    const emailData = await emailRes.json()
    if (!emailRes.ok) return res.status(200).json({ sent: false, error: emailData })
    return res.status(200).json({ sent: true, id: emailData.id })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

// ── ROUTER PRINCIPAL ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const route = req.query.route || req.body?.route

  switch (route) {
    case 'get-certification':    return getCertification(req, res)
    case 'get-reduction-plan':   return getReductionPlan(req, res)
    case 'process-ia-queue':     return processIaQueue(req, res)
    case 'save-monthly-progress':return saveMonthlyProgress(req, res)
    case 'send-report':          return sendReport(req, res)
    default:
      return res.status(400).json({ error: 'route requerido', routes: ['get-certification','get-reduction-plan','process-ia-queue','save-monthly-progress','send-report'] })
  }
}
