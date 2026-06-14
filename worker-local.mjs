#!/usr/bin/env node
// worker-local.mjs — simula el cron en local
// Uso: node worker-local.mjs
// Requiere: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, CRON_SECRET en .env

import { config } from 'dotenv'
config({ path: '.env' })

const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173'
const CRON_SECRET = process.env.CRON_SECRET

async function tick() {
  try {
    const res = await fetch(`${BASE_URL}/api/process-ia-queue`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    const data = await res.json()
    if (data.processed > 0) {
      console.log(`[${new Date().toISOString()}] Procesados: ${data.processed}`, data.results)
    }
  } catch (err) {
    console.error('Worker tick error:', err.message)
  }
}

// Correr cada 10 segundos en local (más rápido que el minuto de producción)
console.log('Worker local iniciado — Ctrl+C para detener')
tick()
setInterval(tick, 10_000)
