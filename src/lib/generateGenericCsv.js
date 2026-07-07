// generateGenericCsv.js
// Convierte el JSON que devuelve extract-invoice.js en un CSV genérico
// importable a cualquier ERP (Odoo, Siesa, ICG, SAP B1, etc.)

const COLUMNS = [
  'nit_proveedor',
  'nombre_proveedor',
  'numero_factura',
  'fecha_emision',
  'descripcion_item',
  'cantidad',
  'valor_unitario',
  'valor_total',
  'iva',
  'total_factura',
  'centro_costo',
]

function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// clasificacion: el objeto que devuelve extract-invoice.js (data.clasificacion)
// centroCosto: opcional, string asignado manualmente o por regla de negocio
function invoiceToCsvRows(clasificacion, centroCosto = '') {
  const {
    proveedor,
    proveedor_nit,
    numero_factura,
    fecha_emision,
    items = [],
    totales = {},
  } = clasificacion

  return items.map((item) => ({
    nit_proveedor: proveedor_nit,
    nombre_proveedor: proveedor,
    numero_factura,
    fecha_emision,
    descripcion_item: item.descripcion,
    cantidad: item.cantidad,
    valor_unitario: item.valor_unitario,
    valor_total: item.valor_total,
    iva: totales.iva,
    total_factura: totales.total,
    centro_costo: centroCosto,
  }))
}

// Une múltiples facturas ya extraídas (array de clasificacion) en un solo CSV.
// invoicesWithCentro: [{ clasificacion, centroCosto }, ...]
function generateGenericCsv(invoicesWithCentro) {
  const rows = invoicesWithCentro.flatMap(({ clasificacion, centroCosto }) =>
    invoiceToCsvRows(clasificacion, centroCosto)
  )

  const header = COLUMNS.join(',')
  const body = rows
    .map((row) => COLUMNS.map((col) => escapeCsvValue(row[col])).join(','))
    .join('\n')

  return `${header}\n${body}`
}

export { generateGenericCsv, invoiceToCsvRows, COLUMNS }
