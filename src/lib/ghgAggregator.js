// ghgAggregator.js
// Toma un array de resultados de extract-invoice.js (clasificacion) y consolida
// los items con relevante_ghg=true en los campos que ya usa el cuestionario GHG
// de EcoMetriX (consumo_electricidad, consumo_gas_natural, consumo_gasolina, etc.)
//
// Uso:
//   const resumen = aggregateGhgFromInvoices(arrayDeClasificaciones)
//   // resumen = { consumo_electricidad: 1200, consumo_gasolina: 300, ... , detalle: [...] }

const CAMPOS_VALIDOS = [
  'consumo_electricidad',
  'consumo_gas_natural',
  'consumo_gasolina',
  'consumo_diesel',
  'consumo_acpm',
]

function aggregateGhgFromInvoices(clasificaciones) {
  const acumulado = {}
  const detalle = []
  const descartados = []

  for (const clasificacion of clasificaciones) {
    const { proveedor, numero_factura, fecha_emision, items = [] } = clasificacion

    for (const item of items) {
      if (!item.campo_cuestionario || !CAMPOS_VALIDOS.includes(item.campo_cuestionario)) {
        // Item no relevante para GHG (ej: papelería, servicios profesionales) -> se ignora del cálculo
        continue
      }
      if (item.cantidad === null || item.cantidad === undefined) {
        // No se puede sumar sin cantidad -> se marca para revisión manual, no se descarta silenciosamente
        descartados.push({ proveedor, numero_factura, item: item.descripcion, motivo: 'sin_cantidad' })
        continue
      }

      acumulado[item.campo_cuestionario] = (acumulado[item.campo_cuestionario] || 0) + item.cantidad

      detalle.push({
        proveedor,
        numero_factura,
        fecha_emision,
        campo_cuestionario: item.campo_cuestionario,
        categoria: item.categoria,
        alcance_ghg: item.alcance_ghg,
        cantidad: item.cantidad,
        unidad: item.unidad,
      })
    }
  }

  return { ...acumulado, detalle, descartados }
}

// Fusiona el resumen agregado con un cuestionario existente (no sobreescribe,
// suma sobre lo que el usuario ya haya reportado manualmente).
function mergeIntoQuestionnaire(cuestionarioActual, resumenAgregado) {
  const merged = { ...cuestionarioActual }
  for (const campo of CAMPOS_VALIDOS) {
    if (resumenAgregado[campo]) {
      merged[campo] = (merged[campo] || 0) + resumenAgregado[campo]
    }
  }
  return merged
}

export { aggregateGhgFromInvoices, mergeIntoQuestionnaire, CAMPOS_VALIDOS }
