// api/csv-import.js — CSV → categorías GHG (origen estricto, rate limit, sesión obligatoria, entradas acotadas)
import { checkRateLimit, checkOrigin, requireUser } from '../src/lib/rateLimit.js'
import { CATEGORIAS, calcularCO2e } from '../src/lib/factoresEmision.js'
import { clasificarGasto } from '../src/lib/clasificadorGastos.js'

const MAX_CHARS = 2_000_000
const MAX_FILAS = 5000

// Divide una línea respetando comillas
function splitLinea(linea, delim) {
  const out = []; let cur = ''; let q = false
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i]
    if (ch === '"') { if (q && linea[i + 1] === '"') { cur += '"'; i++ } else q = !q }
    else if (ch === delim && !q) { out.push(cur.trim()); cur = '' }
    else cur += ch
  }
  out.push(cur.trim())
  return out
}

function parsearCSV(csvText) {
  const lines = csvText.replace(/^﻿/, '').trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const first = lines[0]
  const delimiter = [';', '\t', ','].map(d => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0]
  const headers = splitLinea(first, delimiter).map(h => h.replace(/^["']|["']$/g, '').toLowerCase())
  const rows = lines.slice(1, MAX_FILAS + 1).map(line => {
    const values = splitLinea(line, delimiter)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = values[i] || '' })
    return obj
  })
  return { headers, rows, delimiter }
}

// Acepta 1.500,50 / 1,500.50 / 1.500 / 1500,5 / 0.126
function parseNumero(v) {
  let s = String(v ?? '').trim().replace(/[^\d.,-]/g, '')
  if (!s) return 0
  const d = s.lastIndexOf('.'), c = s.lastIndexOf(',')
  if (d > -1 && c > -1) s = c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  else if (c > -1) s = (s.length - c - 1) <= 2 ? s.replace(',', '.') : s.replace(/,/g, '')
  else if (d > -1) {
    const dec = s.length - d - 1
    if ((s.match(/\./g) || []).length > 1 || (dec === 3 && !s.startsWith('0.'))) s = s.replace(/\./g, '')
  }
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

function mapearColumnas(headers) {
  const map = {}
  const patterns = {
    fecha:       ['fecha', 'date', 'f_emision', 'fec'],
    descripcion: ['descripcion', 'descripción', 'concepto', 'detalle', 'glosa', 'nombre'],
    categoria:   ['categoria', 'categoría', 'tipo', 'cuenta', 'rubro'],
    valor_cop:   ['valor', 'valor_cop', 'total', 'monto', 'importe', 'valor_total', 'debito', 'débito'],
    cantidad:    ['cantidad', 'qty', 'unidades', 'consumo', 'volumen'],
    unidad:      ['unidad', 'unit', 'ud', 'medida'],
    proveedor:   ['proveedor', 'vendor', 'empresa', 'tercero', 'beneficiario'],
  }
  for (const [field, kws] of Object.entries(patterns)) {
    const m = headers.find(h => kws.some(k => h.includes(k)))
    if (m) map[field] = m
  }
  return map
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://www.ecometrix.app')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!checkOrigin(req, res)) return
  if (!(await checkRateLimit(req, res, '/api/csv-import'))) return
  if (!(await requireUser(req, res))) return

  try {
    const { csv_text, column_mapping, connector_id } = req.body || {}
    if (typeof csv_text !== 'string' || !csv_text) return res.status(400).json({ error: 'csv_text es requerido' })
    if (csv_text.length > MAX_CHARS) return res.status(413).json({ error: 'Archivo demasiado grande (máx. 2 MB)' })

    const { headers, rows } = parsearCSV(csv_text)
    if (rows.length === 0) return res.status(400).json({ error: 'El archivo no contiene filas válidas' })

    const colMap = (column_mapping && typeof column_mapping === 'object') ? column_mapping : mapearColumnas(headers)
    const gastos = []
    let errores = 0

    rows.forEach((row, i) => {
      try {
        const g = (campo) => (colMap[campo] ? String(row[colMap[campo]] ?? '') : '')
        const valor_cop = parseNumero(g('valor_cop'))
        const cantidad  = parseNumero(g('cantidad'))
        if (valor_cop <= 0 && cantidad <= 0) return

        const categoria = clasificarGasto(g('descripcion'), g('categoria'))
        const unidad = g('unidad')
        const { kg, metodo, requiereCantidad } = calcularCO2e({ valorCOP: valor_cop, cantidad, unidad, categoria })
        gastos.push({
          fila: i + 2, fecha: g('fecha'), descripcion: g('descripcion'), proveedor: g('proveedor'),
          valor_cop, cantidad: cantidad || null, unidad: unidad || null,
          categoria_ghg: categoria, alcance: CATEGORIAS[categoria]?.alcance || 3,
          kg_co2e: kg, metodo, requiere_cantidad: requiereCantidad,
        })
      } catch { errores++ }
    })

    const categorias = {}
    gastos.forEach(g => {
      const c = (categorias[g.categoria_ghg] ||= { categoria: g.categoria_ghg, alcance: g.alcance, kg_co2e: 0, valor_cop: 0, count: 0, requiere_cantidad: false })
      c.kg_co2e += g.kg_co2e; c.valor_cop += g.valor_cop; c.count++
      if (g.requiere_cantidad) c.requiere_cantidad = true
    })

    return res.status(200).json({
      connector_id: typeof connector_id === 'string' ? connector_id.slice(0, 40) : 'csv',
      headers_detectados: headers,
      column_mapping: colMap,
      total_filas: rows.length,
      total_registros: gastos.length,
      filas_con_error: errores,
      total_cop: Math.round(gastos.reduce((a, g) => a + g.valor_cop, 0)),
      total_kg_co2e: Math.round(gastos.reduce((a, g) => a + g.kg_co2e, 0) * 100) / 100,
      categorias: Object.values(categorias).map(c => ({ ...c, kg_co2e: Math.round(c.kg_co2e * 100) / 100 })),
      gastos: gastos.slice(0, 100),
      source: typeof connector_id === 'string' ? connector_id.slice(0, 40) : 'csv',
    })
  } catch (err) {
    console.error('CSV import error:', err.message)
    return res.status(500).json({ error: 'No se pudo procesar el archivo' })
  }
}
