// netlify/functions/get-certification.js
// M15 — Certificación EcoMetriX
// Fase 1: cálculo local (sin Supabase). Fase 2: persistir en DB + QR verificable.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const { diagnostico_id, empresa, calculo, analisis } = body

  if (!calculo || !empresa) {
    return { statusCode: 400, body: 'Missing required fields: empresa, calculo' }
  }

  // ── Cálculo de puntuación ─────────────────────────────────────────────────
  // Max 100pts distribuidos en 5 dimensiones
  const breakdown = {
    // 30pts — mide alcances 1 y 2
    alcances_1_2:
      calculo.alcance1 > 0 && calculo.alcance2 > 0 ? 30
      : calculo.alcance1 > 0 ? 20
      : 0,

    // 15pts — mide alcance 3 (cadena de valor)
    alcance_3: calculo.alcance3 > 0 ? 15 : 0,

    // 25pts — plan de acción (5pts por acción, max 5 acciones)
    plan_accion: Math.min(25, (analisis?.plan_accion?.length || 0) * 5),

    // 20pts — nivel de impacto (Bajo = mejor)
    nivel_impacto:
      calculo.nivelImpacto === 'Bajo' ? 20
      : calculo.nivelImpacto === 'Moderado' ? 10
      : 5,

    // 10pts — perfil empresa completo
    perfil_empresa:
      empresa.nombre && empresa.sector && empresa.tamano && empresa.pais ? 10 : 5,
  }

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0)

  // ── Nivel ─────────────────────────────────────────────────────────────────
  const level =
    score >= 85 ? 4
    : score >= 65 ? 3
    : score >= 40 ? 2
    : 1

  const levelNames = {
    1: 'Iniciado Verde',
    2: 'Comprometido',
    3: 'Avanzado',
    4: 'Líder Sostenible',
  }

  // ── Badges ────────────────────────────────────────────────────────────────
  const badgesEarned = []

  // Siempre se gana al completar el diagnóstico
  badgesEarned.push({ badge_key: 'first_emission' })

  // Los 3 alcances medidos
  if (calculo.alcance3 > 0) {
    badgesEarned.push({ badge_key: 'full_scope' })
  }

  // Plan de acción generado (≥3 acciones)
  if ((analisis?.plan_accion?.length || 0) >= 3) {
    badgesEarned.push({ badge_key: 'planner' })
  }

  // Nivel de impacto bajo
  if (calculo.nivelImpacto === 'Bajo') {
    badgesEarned.push({ badge_key: 'low_impact' })
  }

  // Líder sostenible (score ≥ 90)
  if (score >= 90) {
    badgesEarned.push({ badge_key: 'leader' })
  }

  // ── Código de verificación ────────────────────────────────────────────────
  // Fase 2: reemplazar con UUID firmado guardado en Supabase
  const shortId = (diagnostico_id || 'DIAG').slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X')
  const verification_code = `ECO-${shortId}-${score}`

  // ── Respuesta ─────────────────────────────────────────────────────────────
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      score,
      level,
      level_name: levelNames[level],
      breakdown,
      badges_earned: badgesEarned,
      new_badges: badgesEarned.map((b) => b.badge_key), // todos son "nuevos" en fase 1
      verification_code,
      certification: {
        empresa_nombre: empresa.nombre,
        issued_at: new Date().toISOString(),
        // Fase 2: agregar { id, supabase_url, qr_url }
      },
    }),
  }
}
