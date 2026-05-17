// netlify/functions/get-certification.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role para escribir sin RLS
)

// ── Lógica de scoring ─────────────────────────────────────────────────────────

function calcularScore(calculo, analisis, empresa) {
  let score = 0
  const breakdown = {}

  // 30pts — Alcance 1 y 2 registrados
  const tieneAlcance1 = calculo.alcance1 > 0
  const tieneAlcance2 = calculo.alcance2 > 0
  if (tieneAlcance1 && tieneAlcance2) breakdown.alcances_1_2 = 30
  else if (tieneAlcance1 || tieneAlcance2) breakdown.alcances_1_2 = 15
  else breakdown.alcances_1_2 = 0
  score += breakdown.alcances_1_2

  // 15pts — Alcance 3 registrado
  breakdown.alcance_3 = calculo.alcance3 > 0 ? 15 : 0
  score += breakdown.alcance_3

  // 25pts — Plan de acción generado
  const tienePlan = analisis?.plan_accion?.length > 0
  breakdown.plan_accion = tienePlan ? 25 : 0
  score += breakdown.plan_accion

  // 20pts — Nivel de impacto (Bajo=20, Moderado=10, Alto=5)
  const nivelMap = { 'Bajo': 20, 'Moderado': 10, 'Alto': 5 }
  breakdown.nivel_impacto = nivelMap[calculo.nivelImpacto] || 5
  score += breakdown.nivel_impacto

  // 10pts — Perfil empresa completo
  const camposEmpresa = [empresa.nombre, empresa.sector, empresa.tamano, empresa.pais]
  const camposCompletos = camposEmpresa.filter(Boolean).length
  breakdown.perfil_empresa = Math.round((camposCompletos / 4) * 10)
  score += breakdown.perfil_empresa

  return { score: Math.min(score, 100), breakdown }
}

function determinarNivel(score) {
  if (score >= 90) return { level: 4, level_name: 'Líder Sostenible' }
  if (score >= 70) return { level: 3, level_name: 'Avanzado' }
  if (score >= 45) return { level: 2, level_name: 'Comprometido' }
  return { level: 1, level_name: 'Iniciado Verde' }
}

function evaluarBadges(calculo, analisis) {
  const badges = []

  // 🌱 Primera huella — alcance 1 o 2 registrado
  if (calculo.alcance1 > 0 || calculo.alcance2 > 0)
    badges.push('first_emission')

  // 📊 Alcance completo — los 3 alcances > 0
  if (calculo.alcance1 > 0 && calculo.alcance2 > 0 && calculo.alcance3 > 0)
    badges.push('full_scope')

  // 🎯 Planificador — plan de acción generado
  if (analisis?.plan_accion?.length > 0)
    badges.push('planner')

  // ⚡ Impacto bajo
  if (calculo.nivelImpacto === 'Bajo')
    badges.push('low_impact')

  return badges
}

// ── Handler ───────────────────────────────────────────────────────────────────

export const handler = async (event) => {
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }

  try {
    const { diagnostico_id, user_id, empresa, calculo, analisis } = JSON.parse(event.body)

    if (!diagnostico_id || !user_id || !empresa || !calculo)
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan campos requeridos' }) }

    // 1. Calcular score y nivel
    const { score, breakdown } = calcularScore(calculo, analisis, empresa)
    const { level, level_name } = determinarNivel(score)

    // 2. Evaluar badges
    const badgeKeys = evaluarBadges(calculo, analisis)
    if (score >= 90) badgeKeys.push('leader')

    // 3. Marcar certificaciones anteriores como no actuales
    await supabase
      .from('certifications')
      .update({ is_current: false })
      .eq('user_id', user_id)

    // 4. Insertar nueva certificación
    const verificationCode = `ECM-${Date.now().toString(36).toUpperCase()}`
    const { data: cert, error: certError } = await supabase
      .from('certifications')
      .insert({
        user_id,
        diagnostico_id,
        level,
        level_name,
        score,
        empresa_nombre: empresa.nombre,
        verification_code: verificationCode,
        is_current: true,
      })
      .select()
      .single()

    if (certError) throw certError

    // 5. Insertar badges (ignora duplicados por UNIQUE constraint)
    if (badgeKeys.length > 0) {
      const badgeRows = badgeKeys.map(key => ({
        user_id,
        diagnostico_id,
        badge_key: key,
      }))
      await supabase
        .from('badges_earned')
        .upsert(badgeRows, { onConflict: 'user_id,badge_key', ignoreDuplicates: true })
    }

    // 6. Obtener todos los badges del usuario
    const { data: allBadges } = await supabase
      .from('badges_earned')
      .select('badge_key, earned_at')
      .eq('user_id', user_id)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        certification: cert,
        score,
        breakdown,
        level,
        level_name,
        badges_earned: allBadges || [],
        new_badges: badgeKeys,
        verification_code: verificationCode,
      }),
    }
  } catch (err) {
    console.error('Certification error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
