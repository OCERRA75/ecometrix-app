#!/usr/bin/env node
// queue-monitor.mjs — ver estado de la cola
// Uso: node queue-monitor.mjs

import { config } from 'dotenv'
config({ path: '.env' })

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
const headers = {
  'apikey': SUPABASE_SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
}

async function monitor() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs_queue?select=id,type,status,attempts,error,created_at&order=created_at.desc&limit=20`,
    { headers }
  )
  const jobs = await res.json()

  const counts = jobs.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1
    return acc
  }, {})

  console.log('\n=== QUEUE STATUS ===')
  console.table(counts)
  console.log('\n=== ÚLTIMOS 20 JOBS ===')
  console.table(jobs.map(j => ({
    id: j.id.slice(0, 16),
    status: j.status,
    attempts: j.attempts,
    created: new Date(j.created_at).toLocaleTimeString(),
    error: j.error?.slice(0, 40) || '-',
  })))
}

monitor()
