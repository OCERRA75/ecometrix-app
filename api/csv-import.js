// api/csv-import.js — Vercel Serverless Function
// M16 — Importador genérico CSV (SIESA, World Office, cualquier ERP)
export const config = { api: { bodyParser: false } }

// Factores de emisión simplificados (kg CO2e por unidad)
const FACTORES_EMISION = {
  electricidad:          { factor: 0.126,  unidad: 'kWh',  desc: 'Red eléctrica Colombia (UPME 2023)' },
  gas_natural:           { factor: 2.02,   unidad: 'm3',   desc: 'Gas natural combustion' },
  combustible:           { factor: 2.68,   unidad: 'litro',desc: 'Diesel/gasolina promedio' },
  combustible_diesel:    { factor: 2.68,   unidad: 'litro',desc: 'Diesel' },
  combustible_gasolina:  { factor: 2.31,   unidad: 'litro',desc: 'Gasolina' },
  refrigerantes:         { factor: 1430,   unidad: 'kg',   desc: 'HFC R-134a equivalente' },
  transporte_aereo:      { factor: 0.255,  unidad: 'km',   desc: 'Vuelo de larga distancia' },
  transporte_terrestre:  { factor: 0.089,  unidad: 'km',   desc: 'Transporte terrestre carga' },
  agua:                  { factor: 0.344,  unidad: 'm3',   desc: 'Tratamiento agua potable' },
  residuos:              { factor: 0.5,    unidad: 'kg',   desc: 'Residuos a relleno sanitario' },
  compras_bienes:        { factor: 0.5,    unidad: 'COP',  desc: 'Estimado por gasto' },
  compras_servicios:     { factor: 0.3,    unidad: 'COP',  desc: 'Estimado por gasto' },
  nomina:                { factor: 0.1,    unidad: 'COP',  desc: 'Estimado desplazamiento' },
}

const FACTOR_COP_KG = 1000000 // COP por kg de referencia para conversión monetaria

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Parsear multipart form
    const { file, mapping, connector_id } = await parseMultipart(req)

    if (!file) return res.status(400).json({ error: 'No se recibió archivo' })
    if (!mapping) return res.status(400).json({ error: 'No se recibió mapeo de columnas' })

    const mappingObj = typeof mapping === 'string' ? JSON.parse(mapping) : mapping
    const csvText = file.toString('utf-8')

    // Parsear CSV
    const lines = csvText.split('\n').filter(l => l.trim())
    if (lines.length < 2) return res.status(400).json({ error: 'Archivo vacío o sin datos' })

    const headers = parseCSVLine(lines[0])
    const rows = lines.slice(1).map(l => {
      const vals = parseCSVLine(l)
      const row = {}
      headers.forEach((h, i) => { row[h] = vals[i] || '' })
      return row
    }).filter(r => Object.values(r).some(v => v))

    // Procesar cada fila con el mapeo
    const procesados = []
    let errores = 0

    for (const row of rows) {
      try {
        const fecha = row[mappingObj.fecha] || ''
        const descripcion = row[mappingObj.descripcion] || 'Sin descripción'
        const categoriaGHG = mappingObj.categoria_ghg || 'compras_servicios'
        const valorRaw = row[mappingObj.valor_cop] || '0'
        const valor_cop = parseFloat(valorRaw.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0
        const cantidad = parseFloat(row[mappingObj.cantidad] || '0') || null
        const proveedor = row[mappingObj.proveedor] || ''

        const factor = FACTORES_EMISION[categoriaGHG] || FACTORES_EMISION.compras_servicios
        const alcance = getAlcance(categoriaGHG)

        // Calcular kg CO2e
        let kg_co2e = 0
        if (cantidad && factor.unidad !== 'COP') {
          kg_co2e = cantidad * factor.factor
        } else {
          // Estimación por gasto monetario
          kg_co2e = (valor_cop / FACTOR_COP_KG) * factor.factor
        }

        procesados.push({
          fecha,
          descripcion,
          categoria: categoriaGHG,
          alcance,
          valor_cop,
          cantidad,
          proveedor,
          kg_co2e: Math.round(kg_co2e * 100) / 100,
          factor_usado: factor.desc,
        })
      } catch {
        errores++
      }
    }

    // Agrupar por categoría
    const categorias = agruparCategorias(procesados)

    // Totales por alcance
    const totales = {
      alcance1: procesados.filter(p => p.alcance === 1).reduce((a, p) => a + p.kg_co2e, 0),
      alcance2: procesados.filter(p => p.alcance === 2).reduce((a, p) => a + p.kg_co2e, 0),
      alcance3: procesados.filter(p => p.alcance === 3).reduce((a, p) => a + p.kg_co2e, 0),
    }

    return res.status(200).json({
      success: true,
      source: connector_id || 'csv',
      total_registros: procesados.length,
      errores,
      total_cop: procesados.reduce((a, p) => a + p.valor_cop, 0),
      total_kg_co2e: Math.round((totales.alcance1 + totales.alcance2 + totales.alcance3) * 100) / 100,
      totales_alcance: totales,
      categorias,
      items: procesados,
    })
  } catch (err) {
    console.error('CSV import error:', err)
    return res.status(500).json({ error: err.message })
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function getAlcance(categoria) {
  const a1 = ['gas_natural', 'combustible', 'combustible_diesel', 'combustible_gasolina', 'refrigerantes']
  const a2 = ['electricidad']
  if (a1.includes(categoria)) return 1
  if (a2.includes(categoria)) return 2
  return 3
}

function agruparCategorias(items) {
  const grupos = {}
  items.forEach(item => {
    const key = item.categoria
    if (!grupos[key]) grupos[key] = { categoria: key, alcance: item.alcance, total_cop: 0, kg_co2e: 0, count: 0 }
    grupos[key].total_cop += item.valor_cop
    grupos[key].kg_co2e += item.kg_co2e
    grupos[key].count++
  })
  return Object.values(grupos)
    .map(g => ({ ...g, kg_co2e: Math.round(g.kg_co2e * 100) / 100 }))
    .sort((a, b) => b.kg_co2e - a.kg_co2e)
}

// Parsear multipart form sin dependencias externas
async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks)
        const contentType = req.headers['content-type'] || ''
        const boundaryMatch = contentType.match(/boundary=(.+)/)
        if (!boundaryMatch) return reject(new Error('No boundary found'))

        const boundary = '--' + boundaryMatch[1]
        const parts = splitBuffer(body, Buffer.from('\r\n' + boundary))

        let file = null
        let mapping = null
        let connector_id = null

        parts.forEach(part => {
          const headerEnd = part.indexOf('\r\n\r\n')
          if (headerEnd === -1) return
          const headerStr = part.slice(0, headerEnd).toString()
          const content = part.slice(headerEnd + 4)

          const nameMatch = headerStr.match(/name="([^"]+)"/)
          if (!nameMatch) return
          const name = nameMatch[1]

          if (name === 'file') {
            // Remove trailing \r\n--
            file = content.slice(0, content.lastIndexOf('\r\n'))
          } else if (name === 'mapping') {
            mapping = content.toString().replace(/\r\n--.*$/, '').trim()
          } else if (name === 'connector_id') {
            connector_id = content.toString().replace(/\r\n--.*$/, '').trim()
          }
        })

        resolve({ file, mapping, connector_id })
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function splitBuffer(buf, delimiter) {
  const parts = []
  let start = 0
  let pos = buf.indexOf(delimiter, start)
  while (pos !== -1) {
    parts.push(buf.slice(start, pos))
    start = pos + delimiter.length
    pos = buf.indexOf(delimiter, start)
  }
  parts.push(buf.slice(start))
  return parts.filter(p => p.length > 0)
}
