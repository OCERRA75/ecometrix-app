// ecometrix-load-test.js — k6 load test para EcoMetriX
// Target: staging (nunca producción con usuarios reales)
// Instalar k6: https://k6.io/docs/getting-started/installation/

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// ── Métricas custom ────────────────────────────────────────────────────────────
const errorRate      = new Rate('errors')
const calcDuration   = new Trend('calc_duration_ms', true)
const certDuration   = new Trend('cert_duration_ms', true)
const queuedJobs     = new Counter('jobs_enqueued')

// ── Config — apunta a staging ─────────────────────────────────────────────────
const BASE = __ENV.BASE_URL || 'https://ecometrix-app-one.vercel.app'

// ── Umbrales de éxito (thresholds) ────────────────────────────────────────────
// La prueba FALLA automáticamente si no se cumplen
export const options = {
  scenarios: {
    // Rampa suave: 10 → 100 → 500 → 1000 usuarios
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m',  target: 10   },  // calentamiento
        { duration: '2m',  target: 100  },  // carga normal
        { duration: '3m',  target: 500  },  // carga alta
        { duration: '3m',  target: 1000 },  // pico máximo
        { duration: '1m',  target: 0    },  // enfriamiento
      ],
      gracefulRampDown: '30s',
    },

    // Spike test: sube de 0 a 500 en 30s (simula viral en Instagram)
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      startTime: '11m',  // corre después del ramp_up
      stages: [
        { duration: '30s', target: 500 },
        { duration: '1m',  target: 500 },
        { duration: '30s', target: 0   },
      ],
    },
  },

  thresholds: {
    // Tiempo de respuesta: 95% bajo 800ms, 99% bajo 2s
    'http_req_duration':              ['p(95)<800', 'p(99)<2000'],
    // Errores HTTP: máximo 1%
    'http_req_failed':                ['rate<0.01'],
    // Métricas custom
    'calc_duration_ms':               ['p(95)<3000'],  // calculate puede tardar más (Claude async)
    'cert_duration_ms':               ['p(95)<2000'],  // primer cálculo, sin cache
    'errors':                         ['rate<0.01'],
  },
}

// ── Datos de prueba realistas ─────────────────────────────────────────────────
const SECTORES = [
  'Manufactura', 'Retail / Comercio', 'Logística / Transporte',
  'Servicios profesionales', 'Alimentos y bebidas', 'Tecnología / Software',
]

const PAISES = ['Colombia', 'Mexico', 'Argentina', 'Chile', 'Peru']

const TAMANHOS = ['micro', 'pequena', 'mediana', 'grande']

const EMPRESAS_TEST = [
  { nombre: 'Textiles Norte SAS',    email: 'test1@ecometrix.test' },
  { nombre: 'Logística Express SA',  email: 'test2@ecometrix.test' },
  { nombre: 'Alimentos Frescos SAS', email: 'test3@ecometrix.test' },
  { nombre: 'TechSolutions SAS',     email: 'test4@ecometrix.test' },
  { nombre: 'Comercial Sur LTDA',    email: 'test5@ecometrix.test' },
]

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generarRespuestasRealistas() {
  return {
    a1_combustible_tipo:       randomItem(['Gas natural', 'Gasolina', 'Diésel', 'No usamos combustibles']),
    a1_combustible_cantidad:   String(Math.floor(Math.random() * 500)),
    a1_flota_cantidad:         randomItem(['Ninguno', '1 – 5 vehículos', '6 – 20 vehículos']),
    a1_flota_combustible:      String(Math.floor(Math.random() * 200)),
    a1_generador:              randomItem(['No tenemos', 'Sí, uso ocasional']),
    a1_refrigerantes:          randomItem(['No tenemos', '1 – 5 equipos', '6 – 20 equipos']),
    a2_electricidad_kwh:       String(Math.floor(Math.random() * 5000000) + 500000),
    a2_fuentes_renovables:     randomItem(['No', 'Parcial (< 25%)', 'RECs / Garantías de origen']),
    a2_numero_empleados:       String(Math.floor(Math.random() * 200) + 5),
    a3_compras_proveedores:    String(Math.floor(Math.random() * 50000000) + 1000000),
    a3_compras_tipo:           randomItem(['Materias primas / insumos físicos', 'Servicios profesionales / digitales', 'Mixto']),
    a3_transporte_proveedores: randomItem(['Proveedores locales (< 100 km)', 'Proveedores nacionales (100 – 1000 km)']),
    a3_distribucion_clientes:  randomItem(['Entrega digital (sin transporte físico)', 'Entrega local (< 100 km)', 'Distribución nacional']),
    a3_viajes_negocio:         randomItem(['No hay viajes de negocio', 'Ocasional (< 5 viajes/año por empresa)']),
    a3_desplazamiento_empleados: randomItem(['Transporte público (metro, bus)', 'Vehículo particular', 'Mixto transporte público y particular']),
    a3_residuos_cantidad:      randomItem(['Reciclaje parcial (30 – 70%)', 'Mayoría a relleno sanitario']),
  }
}

// ── Flujo principal del usuario ───────────────────────────────────────────────
export default function () {
  const empresa = randomItem(EMPRESAS_TEST)
  const headers = { 'Content-Type': 'application/json' }

  // ── 1. Landing page ────────────────────────────────────────────────────────
  group('01_landing', () => {
    const res = http.get(BASE, { tags: { name: 'landing' } })
    const ok = check(res, {
      'landing status 200': r => r.status === 200,
      'landing tiene EcoMetriX': r => r.body && r.body.includes('EcoMetriX'),
    })
    errorRate.add(!ok)
    sleep(Math.random() * 2 + 1)  // usuario lee la página 1-3s
  })

  // ── 2. Página de precios ───────────────────────────────────────────────────
  group('02_pricing', () => {
    const res = http.get(`${BASE}/pricing`, { tags: { name: 'pricing' } })
    check(res, { 'pricing status 200': r => r.status === 200 })
    sleep(Math.random() * 3 + 2)  // usuario compara planes
  })

  // ── 3. Diagnóstico — el endpoint más crítico ──────────────────────────────
  group('03_calculate', () => {
    const payload = JSON.stringify({
      empresa: {
        nombre:  empresa.nombre,
        email:   empresa.email,
        sector:  randomItem(SECTORES),
        tamano:  randomItem(TAMANHOS),
        pais:    randomItem(PAISES),
        nit:     '',
      },
      respuestas: generarRespuestasRealistas(),
      user_id: null,  // anónimo como la mayoría de usuarios free
    })

    const start = Date.now()
    const res = http.post(`${BASE}/api/calculate`, payload, {
      headers,
      tags:    { name: 'calculate' },
      timeout: '35s',  // Claude puede tardar hasta 30s
    })
    calcDuration.add(Date.now() - start)

    const ok = check(res, {
      'calculate status 200':      r => r.status === 200,
      'calculate tiene id':         r => {
        try { return JSON.parse(r.body).id !== undefined } catch { return false }
      },
      'calculate tiene calculo':    r => {
        try { return JSON.parse(r.body).calculo !== undefined } catch { return false }
      },
    })
    errorRate.add(!ok)

    if (ok && res.status === 200) {
      try {
        const data = JSON.parse(res.body)
        if (data.analisis_status === 'pending') queuedJobs.add(1)

        // ── 4. Certificación (debe ser cache hit en segunda visita) ──────────
        group('04_certification', () => {
          const certPayload = JSON.stringify({
            diagnostico_id: data.id,
            empresa:        data.empresa,
            calculo:        data.calculo,
            analisis:       data.analisis,
          })
          const certStart = Date.now()
          const certRes = http.post(`${BASE}/api/get-certification`, certPayload, {
            headers,
            tags: { name: 'certification' },
          })
          certDuration.add(Date.now() - certStart)

          check(certRes, {
            'cert status 200':   r => r.status === 200,
            'cert tiene score':  r => {
              try { return JSON.parse(r.body).score !== undefined } catch { return false }
            },
          })

          sleep(1)

          // Segunda llamada — debe ser cache hit (más rápida)
          const certRes2 = http.post(`${BASE}/api/get-certification`, certPayload, {
            headers,
            tags: { name: 'certification_cache_hit' },
          })
          check(certRes2, {
            'cert cache hit rápido': r => r.timings.duration < 300,
          })
        })
      } catch (e) {
        errorRate.add(1)
      }
    }

    sleep(Math.random() * 2 + 1)
  })

  // ── 5. Standards page ─────────────────────────────────────────────────────
  group('05_standards', () => {
    const res = http.get(`${BASE}/standards`, { tags: { name: 'standards' } })
    check(res, { 'standards status 200': r => r.status === 200 })
    sleep(1)
  })

  // Pausa realista entre acciones
  sleep(Math.random() * 3 + 2)
}

// ── Reporte al final ──────────────────────────────────────────────────────────
export function handleSummary(data) {
  const passed = Object.entries(data.metrics)
    .filter(([k]) => k.startsWith('http_req') || ['errors', 'calc_duration_ms', 'cert_duration_ms'].includes(k))
    .map(([k, v]) => ({ metric: k, value: JSON.stringify(v.values) }))

  return {
    'load-test-report.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  }
}

function textSummary(data) {
  const dur   = data.metrics.http_req_duration?.values
  const fail  = data.metrics.http_req_failed?.values
  const calc  = data.metrics.calc_duration_ms?.values
  const cert  = data.metrics.cert_duration_ms?.values
  const reqs  = data.metrics.http_reqs?.values

  return `
╔══════════════════════════════════════════════════════╗
║           EcoMetriX — Load Test Summary              ║
╚══════════════════════════════════════════════════════╝

Requests totales : ${reqs?.count || 'N/A'}
Error rate       : ${((fail?.rate || 0) * 100).toFixed(2)}%  (límite: <1%)

Tiempo respuesta HTTP:
  p50  : ${dur?.['p(50)']?.toFixed(0) || 'N/A'} ms
  p95  : ${dur?.['p(95)']?.toFixed(0) || 'N/A'} ms  (límite: <800ms)
  p99  : ${dur?.['p(99)']?.toFixed(0) || 'N/A'} ms  (límite: <2000ms)

/api/calculate:
  p95  : ${calc?.['p(95)']?.toFixed(0) || 'N/A'} ms  (límite: <3000ms)

/api/get-certification:
  p95  : ${cert?.['p(95)']?.toFixed(0) || 'N/A'} ms  (límite: <500ms)

Jobs encolados (Claude async): ${data.metrics.jobs_enqueued?.values?.count || 0}
`
}
