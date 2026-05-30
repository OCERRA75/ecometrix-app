// api/get-certification.js — Vercel Serverless Function
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role para bypasear RLS
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { diagnostico_id, empresa, calculo, analisis } = req.body

  if (!calculo || !empresa) {
    return res.status(400).json({ error: 'Missing required fields: empresa, calculo' })
  }

  // ── Calcular score y breakdown ──────────────────────────────────────────────
  const breakdown = {
    alcances_1_2:
      calculo.alcance1 > 0 && calculo.alcance2 > 0 ? 30
      : calculo.alcance1 > 0 ? 20
      : 0,
    alcance_3: calculo.alcance3 > 0 ? 15 : 0,
    plan_accion: Math.min(25, (analisis?.plan_accion?.length || 0) * 5),
    nivel_impacto:
      calculo.nivelImpacto === 'Bajo' ? 20
      : calculo.nivelImpacto === 'Moderado' ? 10
      : 5,
    perfil_empresa:
      empresa.nombre && empresa.sector && empresa.tamano && empresa.pais ? 10 : 5,
  }

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0)

  const level =
    score >= 85 ? 4
    : score >= 65 ? 3
    : score >= 40 ? 2
    : 1

  const levelNames = { 1: 'Iniciado Verde', 2: 'Comprometido', 3: 'Avanzado', 4: 'Líder Sostenible' }

  const badgesEarned = []
  badgesEarned.push({ badge_key: 'first_emission' })
  if (calculo.alcance3 > 0) badgesEarned.push({ badge_key: 'full_scope' })
  if ((analisis?.plan_accion?.length || 0) >= 3) badgesEarned.push({ badge_key: 'planner' })
  if (calculo.nivelImpacto === 'Bajo') badgesEarned.push({ badge_key: 'low_impact' })
  if (score >= 90) badgesEarned.push({ badge_key: 'leader' })

  const shortId = (diagnostico_id || 'DIAG').slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X')
  const verification_code = `ECO-${shortId}-${score}`
  const certId = `cert_${diagnostico_id || Date.now()}`
  const issuedAt = new Date().toISOString()

  // ── Persistir en Supabase (upsert por diagnostico_id) ───────────────────────
  try {
    const { error: dbError } = await supabase
      .from('certificaciones')
      .upsert({
        id: certId,
        diagnostico_id: diagnostico_id || null,
        user_id: null, // anónimo por ahora
        empresa_nombre: empresa.nombre,
        score,
        level,
        level_name: levelNames[level],
        verification_code,
        badges_earned: badgesEarned,
        breakdown,
        issued_at: issuedAt,
      }, { onConflict: 'diagnostico_id' })

    if (dbError) console.warn('Supabase cert save failed:', dbError)
  } catch (err) {
    console.warn('Supabase cert error:', err)
  }

  // ── Responder al cliente ────────────────────────────────────────────────────
  return res.status(200).json({
    score,
    level,
    level_name: levelNames[level],
    breakdown,
    badges_earned: badgesEarned,
    new_badges: badgesEarned.map(b => b.badge_key),
    verification_code,
    certification: {
      empresa_nombre: empresa.nombre,
      issued_at: issuedAt,
    },
  })
}
