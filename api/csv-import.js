// api/csv-import.js
// M16 — Procesamiento CSV/Excel → categorías GHG Protocol

const COP_TO_USD = 4000

const CATEGORY_FACTORS = {
  electricidad:         { alcance: 2, factor: 0.126, unit: 'kWh' },
  gas_natural:          { alcance: 1, factor: 5.49,  unit: 'm3'  },
  combustible_diesel:   { alcance: 1, factor: 10.15, unit: 'gal' },
  combustible_gasolina: { alcance: 1, factor: 8.78,  unit: 'gal' },
  refrigerantes:        { alcance: 1, factor: 1430,  unit: 'kg'  },
  transporte_aereo:     { alcance: 3, factor: 0.255, unit: 'USD' },
  transporte_terrestre: { alcance: 3, factor: 0.12,  unit: 'USD' },
  compras_bienes:       { alcance: 3, factor: 0.45,  unit: 'USD' },
  compras_servicios:    { alcance: 3, factor: 0.15,  unit: 'USD' },
  residuos:             { alcance: 3, factor: 0.50,  unit: 'USD' },
  agua:                 { alcance: 3, factor: 0.344, unit: 'USD' },
  nomina:               { alcance: 3, factor: 0.005, unit: 'USD' },
}

const KEYWORD_MAP = {
  electricidad: ['electricidad','energia electrica','luz','kWh','codensa','enel','epsa','chec','essa'],
  gas_natural:  ['gas natural','gas domiciliario','vanti','surtigas','gases del caribe','m3'],
  combustible_diesel:   ['diesel','diésel','acpm','gasoil'],
  combustible_gasolina: ['gasolina','corriente','extra','biomax','terpel','primax'],
  refrigerantes:        ['refrigerante','hfc','freón','freon','r-22','r-410'],
  transporte_aereo:     ['aereo','aéreo','vuelo','avianca','latam','wingo','tiquete'],
  transporte_terrestre: ['transporte','flete','envio','envío','mensajeria','servientrega','envia','deprisa'],
  compras_bienes:       ['compra','materia prima','insumo','mercancia','mercancía','producto'],
  residuos:             ['residuo','basura','desecho','reciclaje','aseo'],
  agua:                 ['agua','acueducto','eaab','aguas','alcantarillado'],
  nomina:               ['nomina','nómina','salario','empleado','prestacion','prestación'],
}

function detectarCategoria(descripcion = '', categoria_columna = '') {
  const texto = `${descripcion} ${categoria_columna}`.toLowerCase()
  for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(kw => texto.includes(kw))) return cat
  }
  return 'compras_servicios'
}

function calcularCO2e(valorCOP, cantidad, unidad, categoria) {
  const cfg = CATEGORY_FACTORS[categoria]
  if (!cfg) return 0

  // Si hay cantidad física (kWh, m3, gal, kg) → cálculo directo
  if (cantidad && cantidad > 0 && unidad) {
    const u = unidad.toLowerCase()
    if (['kwh', 'kw/h'].includes(u) && categoria === 'electricidad')  return Math.round(cantidad * cfg.factor * 100) / 100
    if (['m3', 'm³'].includes(u) && categoria === 'gas_natural')       return Math.round(cantidad * cfg.factor * 100) / 100
    if (['gal', 'galon', 'galón'].includes(u))                         return Math.round(cantidad * cfg.factor * 100) / 100
    if (['kg', 'kilogramo'].includes(u) && categoria === 'refrigerantes') return Math.round(cantidad * cfg.factor * 100) / 100
  }

  // Fallback: spend-based (valor COP → USD → CO2e)
  const valorUSD = valorCOP / COP_TO_USD
  return Math.round(valorUSD * cfg.factor * 100) / 100
}

function parsearCSV(csvText) {
  const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }

  // Detectar delimitador: coma o punto y coma
  const firstLine = lines[0]
  const delimiter = firstLine.includes(';') ? ';' : ','

  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())
  const rows = lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''))
    const obj = {}
    headers.forEach((h, i) => { obj[h] = values[i] || '' })
    return obj
  })

  return { headers, rows, delimiter }
}

function mapearColumnas(headers) {
  // Auto-mapeo inteligente de columnas
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

  for (const [field, keywords] of Object.entries(patterns)) {
    const match = headers.find(h => keywords.some(kw => h.includes(kw)))
    if (match) map[field] = match
  }

  return map
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { csv_text, column_mapping, connector_id } = req.body

    if (!csv_text) {
      return res.status(400).json({ error: 'csv_text es requerido' })
    }

    const { headers, rows } = parsearCSV(csv_text)

    if (rows.length === 0) {
      return res.status(400).json({ error: 'El archivo no contiene filas válidas' })
    }

    // Usar mapping provisto o auto-detectar
    const colMap = column_mapping || mapearColumnas(headers)

    // Procesar filas
    const gastos = []
    let errores = 0

    rows.forEach((row, i) => {
      try {
        const descripcion  = colMap.descripcion  ? row[colMap.descripcion]  || '' : ''
        const categoria_col= colMap.categoria    ? row[colMap.categoria]    || '' : ''
        const valor_str    = colMap.valor_cop    ? row[colMap.valor_cop]    || '0' : '0'
        const cantidad_str = colMap.cantidad     ? row[colMap.cantidad]     || '0' : '0'
        const unidad       = colMap.unidad       ? row[colMap.unidad]       || '' : ''
        const proveedor    = colMap.proveedor    ? row[colMap.proveedor]    || '' : ''
        const fecha        = colMap.fecha        ? row[colMap.fecha]        || '' : ''

        // Limpiar valor: quitar puntos de miles, convertir comas decimales
        const valor_cop = parseFloat(valor_str.replace(/\./g, '').replace(',', '.')) || 0
        const cantidad  = parseFloat(cantidad_str.replace(',', '.')) || 0

        if (valor_cop <= 0 && cantidad <= 0) return // saltar filas vacías

        const categoria = detectarCategoria(descripcion, categoria_col)
        const kg_co2e   = calcularCO2e(valor_cop, cantidad, unidad, categoria)
        const cfg       = CATEGORY_FACTORS[categoria]

        gastos.push({
          fila: i + 2,
          fecha,
          descripcion,
          proveedor,
          valor_cop,
          cantidad: cantidad || null,
          unidad:   unidad || null,
          categoria_ghg: categoria,
          alcance: cfg?.alcance || 3,
          kg_co2e,
        })
      } catch {
        errores++
      }
    })

    // Agrupar por categoría
    const categorias = {}
    gastos.forEach(g => {
      if (!categorias[g.categoria_ghg]) {
        categorias[g.categoria_ghg] = {
          categoria: g.categoria_ghg,
          alcance: g.alcance,
          kg_co2e: 0,
          valor_cop: 0,
          count: 0,
        }
      }
      categorias[g.categoria_ghg].kg_co2e   += g.kg_co2e
      categorias[g.categoria_ghg].valor_cop += g.valor_cop
      categorias[g.categoria_ghg].count++
    })

    const total_kg_co2e = gastos.reduce((a, g) => a + g.kg_co2e, 0)
    const total_cop     = gastos.reduce((a, g) => a + g.valor_cop, 0)

    return res.status(200).json({
      connector_id: connector_id || 'csv',
      headers_detectados: headers,
      column_mapping: colMap,
      total_filas: rows.length,
      total_registros: gastos.length,
      filas_con_error: errores,
      total_cop: Math.round(total_cop),
      total_kg_co2e: Math.round(total_kg_co2e * 100) / 100,
      categorias: Object.values(categorias).map(c => ({
        ...c,
        kg_co2e: Math.round(c.kg_co2e * 100) / 100,
      })),
      gastos: gastos.slice(0, 100),
      source: connector_id || 'csv',
    })

  } catch (err) {
    console.error('CSV import error:', err)
    return res.status(500).json({ error: `Error procesando CSV: ${err.message}` })
  }
}
