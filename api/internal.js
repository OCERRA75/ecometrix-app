// api/internal.js
// Consolida 5 funciones desactivadas en una sola para respetar limite Hobby de Vercel
// Rutas: POST/GET /api/internal?route=get-certification|get-reduction-plan|process-ia-queue|save-monthly-progress|export-csv|send-monthly-reminder|keep-alive

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { generateGenericCsv } from '../src/lib/generateGenericCsv.js'

// ── CORS helper ────────────────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
}

// ── GET-CERTIFICATION ──────────────────────────────────────────────────────────
// Seguridad: exige sesión, lee el diagnóstico desde la base de datos (nunca del body)
// y solo certifica diagnósticos que pertenecen al usuario autenticado.
// El puntaje refleja el desempeño: el nivel de impacto pesa 45 de 100, así que un impacto
// Alto no puede llegar a "Líder Sostenible".
function codigoVerificacion(score) {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  // 32 símbolos, sin O/0/I/1
  const b = randomBytes(6)
  let s = ''
  for (let i = 0; i < 6; i++) s += A[b[i] % A.length]
  return `ECO-${s}-${score}`
}

async function getCertification(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token requerido' })
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Token invalido' })

  const diagnostico_id = req.body?.diagnostico_id
  if (!diagnostico_id) return res.status(400).json({ error: 'diagnostico_id requerido' })

  const { data: diag } = await supabase
    .from('diagnosticos').select('empresa, calculo, analisis')
    .eq('id', diagnostico_id).eq('user_id', user.id).maybeSingle()
  if (!diag?.calculo || !diag?.empresa) return res.status(404).json({ error: 'Diagnostico no encontrado' })
  const { empresa, calculo, analisis } = diag

  const { data: cached } = await supabase
    .from('certificaciones')
    .select('score, level, level_name, breakdown, badges_earned, verification_code, issued_at, empresa_nombre')
    .eq('diagnostico_id', diagnostico_id)
    .maybeSingle()
  if (cached) {
    return res.status(200).json({
      score: cached.score, level: cached.level, level_name: cached.level_name,
      breakdown: cached.breakdown, badges_earned: cached.badges_earned,
      new_badges: [],
      verification_code: cached.verification_code,
      certification: { empresa_nombre: cached.empresa_nombre, issued_at: cached.issued_at },
      _cache: 'hit',
    })
  }

  const nPlan = analisis?.plan_accion?.length || 0
  const breakdown = {
    alcances_1_2: calculo.alcance1 > 0 && calculo.alcance2 > 0 ? 20 : calculo.alcance1 > 0 ? 13 : 0,
    alcance_3: calculo.alcance3 > 0 ? 10 : 0,
    plan_accion: Math.min(15, nPlan * 3),
    nivel_impacto: calculo.nivelImpacto === 'Bajo' ? 45 : calculo.nivelImpacto === 'Moderado' ? 20 : 0,
    perfil_empresa: empresa.nombre && empresa.sector && empresa.tamano && empresa.pais ? 10 : 5,
  }
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0)
  const level = score >= 85 ? 4 : score >= 65 ? 3 : score >= 40 ? 2 : 1
  const levelNames = { 1: 'Iniciado Verde', 2: 'Comprometido', 3: 'Avanzado', 4: 'Líder Sostenible' }
  const badgesEarned = [{ badge_key: 'first_emission' }]
  if (calculo.alcance3 > 0) badgesEarned.push({ badge_key: 'full_scope' })
  if (nPlan >= 3) badgesEarned.push({ badge_key: 'planner' })
  if (calculo.nivelImpacto === 'Bajo') badgesEarned.push({ badge_key: 'low_impact' })
  if (score >= 90) badgesEarned.push({ badge_key: 'leader' })
  const verification_code = codigoVerificacion(score)
  const certId = `cert_${diagnostico_id}`
  const issuedAt = new Date().toISOString()

  const { error: upErr } = await supabase.from('certificaciones').upsert({
    id: certId, diagnostico_id, user_id: user.id,
    empresa_nombre: empresa.nombre, score, level, level_name: levelNames[level],
    verification_code, badges_earned: badgesEarned, breakdown, issued_at: issuedAt,
  }, { onConflict: 'diagnostico_id' })
  if (upErr) {
    console.error('Cert save error:', upErr)
    return res.status(500).json({ error: 'cert_save_failed' })
  }

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
Fuentes (kg CO2e/mes): ${(calculo.detalles || []).map(d => `${d.categoria} ${d.kgCO2e}`).join('; ')}
Alcance 1: ${calculo.alcance1} kg CO2e/mes | Alcance 2: ${calculo.alcance2} kg CO2e/mes | Alcance 3: ${calculo.alcance3} kg CO2e/mes | TOTAL: ${calculo.totalTonAnio} ton CO2e/anio | Nivel: ${calculo.nivelImpacto}
Genera JSON exacto sin markdown: {"resumen_ejecutivo":"2-3 oraciones","principales_fuentes":["f1","f2","f3"],"benchmark":"comparacion sectorial","plan_accion":[{"accion":"desc","reduccion_pct":N,"dificultad":"Facil|Media|Dificil","plazo":"1-3 meses"}],"siguiente_paso":"recomendacion"}
Reglas: 5 acciones ordenadas por impacto, enfocadas en las fuentes de mayor emision de la lista. reduccion_pct es el % de la huella TOTAL que esa accion reduciria (entero y realista); la suma de las 5 no debe superar 50. No propongas acciones sobre fuentes que no aparecen en la lista.`

        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
        })
        const aiData = await aiRes.json()
        if (!aiRes.ok) throw new Error(`Anthropic ${aiRes.status}: ${aiData?.error?.message || 'error'}`)
        const text = aiData.content?.[0]?.text || ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('Claude no devolvio JSON valido')
        const analisis = JSON.parse(jsonMatch[0])
        // Tope de seguridad: si el modelo se pasa, se reescalan los porcentajes para que sumen 50
        if (Array.isArray(analisis.plan_accion)) {
          const suma = analisis.plan_accion.reduce((s, a) => s + (Number(a.reduccion_pct) || 0), 0)
          if (suma > 60) analisis.plan_accion = analisis.plan_accion.map(a => ({ ...a, reduccion_pct: Math.max(1, Math.round((Number(a.reduccion_pct) || 0) * 50 / suma)) }))
        }

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

// ── EXPORT-CSV ─────────────────────────────────────────────────────────────────
async function exportCsv(req, res) {
  setCORS(res)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  try {
    const { invoices } = req.body
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ ok: false, error: 'Se requiere un array "invoices" no vacio' })
    }

    const csv = generateGenericCsv(invoices)
    const csvWithBom = '\uFEFF' + csv

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="ecometrix_export_erp.csv"')
    return res.status(200).send(csvWithBom)
  } catch (err) {
    console.error('[export-csv]', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
}

// ── SEND-MONTHLY-REMINDER ──────────────────────────────────────────────────────
// Cron mensual: recuerda a usuarios con planes_de_reduccion pendientes de reportar
async function sendMonthlyReminder(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'No autorizado' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = 'EcoMetriX <notificaciones@ecometrix.app>'
  // El correo sale el día 1: se pide reportar el MES ANTERIOR.
  const hoy = new Date()
  const mesEnvio = hoy.getMonth()                                   // 0-11 (índice del mes actual)
  const mesReporte = mesEnvio === 0 ? 12 : mesEnvio                 // 1-12 (mes anterior)
  const anioReporte = mesEnvio === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear()

  try {
    const { data: planes } = await supabase
      .from('planes_de_reduccion')
      .select('user_id, mes, anio, real_kgco2, meta_kgco2, diagnostico_id')
      .eq('mes', mesReporte).eq('anio', anioReporte)
      .is('real_kgco2', null)

    if (!planes || planes.length === 0) {
      return res.status(200).json({ ok: true, enviados: 0, message: 'No hay usuarios pendientes' })
    }

    const userIds = [...new Set(planes.map(p => p.user_id))]
    const emailsEnviados = []
    const errores = []
    // Diagnóstico más reciente de cada usuario: es el plan vigente
    const { data: diags } = await supabase
      .from('diagnosticos').select('id, user_id, created_at')
      .in('user_id', userIds).order('created_at', { ascending: false })
    const ultimoDiag = {}
    for (const d of diags || []) if (!ultimoDiag[d.user_id]) ultimoDiag[d.user_id] = d.id
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

    for (const userId of userIds) {
      try {
        const { data: ud } = await supabase.auth.admin.getUserById(userId)
        const user = ud?.user
        if (!user?.email) continue
        const planUsuario = planes.find(p => p.user_id === userId && p.diagnostico_id === ultimoDiag[userId])
        if (!planUsuario) continue

        const emailHtml = `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:0}
.container{max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb}
.header{background:#064e3b;padding:32px;text-align:center}
.header h1{color:white;font-size:22px;margin:0;font-weight:600}
.header p{color:rgba(255,255,255,0.7);font-size:14px;margin:8px 0 0}
.body{padding:32px}
.mes-card{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:20px 0}
.mes-card h3{color:#065f46;margin:0 0 8px;font-size:16px}
.mes-card p{color:#047857;margin:0;font-size:14px}
.meta{font-size:24px;font-weight:bold;color:#065f46}
.cta{display:block;background:#10b981;color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;text-align:center;margin:24px 0}
.footer{padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center}
.footer p{color:#9ca3af;font-size:12px;margin:0}
</style></head><body>
<div class="container">
  <div class="header"><h1>🌿 EcoMetriX</h1><p>Plan de Reducción de Emisiones</p></div>
  <div class="body">
    <p style="color:#374151;font-size:15px;">Hola,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;">Es el comienzo de <strong>${MESES[mesEnvio]}</strong> y es momento de reportar tus emisiones del mes anterior en tu Plan de Reducción EcoMetriX.</p>
    <div class="mes-card">
      <h3>📊 Reporte pendiente: ${MESES[mesReporte - 1]} ${anioReporte}</h3>
      <p>Meta del mes: <span class="meta">${planUsuario.meta_kgco2?.toLocaleString()} kg CO₂</span></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;">Registrar tu progreso mensual te permite:<br>✓ Comparar tus emisiones reales vs la meta<br>✓ Ver tu reducción acumulada<br>✓ Mantener tu certificación activa</p>
    <a href="https://www.ecometrix.app/plan" class="cta" style="display:block;background:#10b981;color:#ffffff !important;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;text-align:center;margin:24px 0;">Reportar mis emisiones de ${MESES[mesReporte - 1]} →</a>
  </div>
  <div class="footer">
    <p>EcoMetriX · Sostenibilidad empresarial para PyMEs colombianas</p>
    <p style="margin-top:4px;">Para cancelar estas notificaciones, ve a tu perfil en la app.</p>
  </div>
</div>
</body></html>`

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: FROM_EMAIL, to: user.email,
            subject: `📊 Reporta tus emisiones de ${MESES[mesReporte - 1]} — EcoMetriX`,
            html: emailHtml,
          }),
        })
        if (resendRes.ok) emailsEnviados.push(user.email)
        else errores.push({ email: user.email, error: (await resendRes.json()).message })
      } catch (err) {
        errores.push({ userId, error: err.message })
      }
    }

    return res.status(200).json({ ok: true, enviados: emailsEnviados.length, emails: emailsEnviados, errores })
  } catch (err) {
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}

// ── KEEP-ALIVE ─────────────────────────────────────────────────────────────────
// Cron diario: hace una consulta mínima a Supabase para que el plan gratis no pause el proyecto por inactividad.
async function keepAlive(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'No autorizado' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/diagnosticos?select=id&limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
    if (!r.ok) {
      console.error('keep-alive: Supabase respondió', r.status)
      return res.status(503).json({ ok: false, status: r.status })
    }
    return res.status(200).json({ ok: true, ts: new Date().toISOString() })
  } catch (err) {
    console.error('keep-alive error:', err)
    return res.status(503).json({ ok: false })
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
    case 'export-csv':           return exportCsv(req, res)
    case 'send-monthly-reminder':return sendMonthlyReminder(req, res)
    case 'keep-alive':           return keepAlive(req, res)
    default:
      return res.status(400).json({ error: 'route requerido', routes: ['get-certification','get-reduction-plan','process-ia-queue','save-monthly-progress','export-csv','send-monthly-reminder','keep-alive'] })
  }
}
