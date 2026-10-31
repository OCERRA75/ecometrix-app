// scripts/backup-supabase.mjs
// Exporta TODAS las tablas públicas de Supabase (vía API REST) + usuarios de Auth + esquema OpenAPI a archivos JSON.
// Uso:  node scripts/backup-supabase.mjs [carpeta_destino]
// Requiere variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (la clave NO se guarda en disco).
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Se usa return/exitCode (no process.exit) para evitar el crash "UV_HANDLE_CLOSING" de Node en Windows.
async function main() {
const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
if (!url || !key) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  return 1
}
const outRoot = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(process.cwd(), '..', 'backups')

// Claves nuevas (sb_secret_...) van solo en apikey; las legacy (JWT service_role) también en Authorization.
const headers = { apikey: key }
if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`

const PAGE = 1000

async function getJson(u) {
  const r = await fetch(u, { headers })
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${u.replace(url, '')}: ${(await r.text()).slice(0, 200)}`)
  return r.json()
}

const pad = n => String(n).padStart(2, '0')
const d = new Date()
const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
const dir = path.join(outRoot, `ecometrix-backup-${stamp}`)
await mkdir(dir, { recursive: true })

const manifest = { created_at: d.toISOString(), supabase_url: url, tables: {}, auth_users: null, errors: [] }

// 1) Lista de tablas/vistas expuestas por la API (el spec OpenAPI también sirve como referencia de columnas)
let spec
try {
  spec = await getJson(`${url}/rest/v1/`)
} catch (e) {
  console.error('No se pudo leer el esquema de la API:', e.message)
  return 2
}
await writeFile(path.join(dir, '_openapi_schema.json'), JSON.stringify(spec, null, 2))
const tables = Object.keys(spec.paths || {})
  .filter(p => p !== '/' && !p.startsWith('/rpc/'))
  .map(p => p.slice(1))
  .sort()

// 2) Volcado paginado de cada tabla
for (const t of tables) {
  try {
    const rows = []
    for (let offset = 0; ; offset += PAGE) {
      const page = await getJson(`${url}/rest/v1/${encodeURIComponent(t)}?select=*&limit=${PAGE}&offset=${offset}`)
      rows.push(...page)
      if (page.length < PAGE) break
    }
    await writeFile(path.join(dir, `${t}.json`), JSON.stringify(rows))
    manifest.tables[t] = rows.length
    console.log(`  ✓ ${t}: ${rows.length} filas`)
  } catch (e) {
    manifest.errors.push({ table: t, error: e.message })
    console.error(`  ✗ ${t}: ${e.message}`)
  }
}

// 3) Usuarios de Auth (sin contraseñas ni hashes)
try {
  const users = []
  for (let page = 1; ; page++) {
    const r = await getJson(`${url}/auth/v1/admin/users?page=${page}&per_page=${PAGE}`)
    const list = r.users || []
    users.push(...list)
    if (list.length < PAGE) break
  }
  await writeFile(path.join(dir, '_auth_users.json'), JSON.stringify(users))
  manifest.auth_users = users.length
  console.log(`  ✓ auth.users: ${users.length} usuarios`)
} catch (e) {
  manifest.errors.push({ table: 'auth.users', error: e.message })
  console.error(`  ✗ auth.users: ${e.message}`)
}

await writeFile(path.join(dir, '_manifest.json'), JSON.stringify(manifest, null, 2))
const total = Object.values(manifest.tables).reduce((a, b) => a + b, 0)
console.log(`\nBackup en: ${dir}`)
console.log(`${Object.keys(manifest.tables).length} tablas, ${total} filas, ${manifest.errors.length} errores`)
return manifest.errors.length ? 3 : 0
}

process.exitCode = await main()
