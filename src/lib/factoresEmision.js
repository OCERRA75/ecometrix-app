// src/lib/factoresEmision.js — factores compartidos por /api/alegra-connect, /api/csv-import y /api/v1/*
// Fuentes: EPA GHG Emission Factors Hub (gasolina 8.78 kg/gal; gas natural 0.05444 kg/scf) y poder calorífico FECOC (UPME)
// para gas natural en Colombia (33,8 MJ/Nm3 x 56,1 kg/GJ IPCC ≈ 1,90 kg CO2/m3). Electricidad: ver nota en la revisión.
export const FACTORES = {
  gasolina: 8.78, diesel: 10.15, acpm: 10.15, gas_natural: 1.90, carbon: 2.42,
  electricidad: {
    Colombia: 0.220, Mexico: 0.454, Argentina: 0.321, Chile: 0.2421,
    Peru: 0.249, Ecuador: 0.272, Espana: 0.181, default: 0.35,
  },
  refrigerantes: { R410A: 2256, R22: 1960, R134a: 1530, default: 1500 },
  residuos:      { general: 0.5, organico: 0.8, default: 0.5 },
  viajes:        { aereo: 0.255, terrestre: 0.089, default: 0.15 },
  precio_kwh_cop: 650,
}
export const COP_TO_USD = 4000 // supuesto fijo; conviene parametrizar por fecha/país

// tipo 'fisica': el factor es por unidad física (kWh, m3, gal, kg) y NO por USD.
// tipo 'gasto': el factor es kg CO2e por USD gastado (método spend-based).
export const CATEGORIAS = {
  electricidad:         { alcance: 2, factor: FACTORES.electricidad.Colombia, tipo: 'fisica', unidades: ['kwh', 'kw/h'] },
  gas_natural:          { alcance: 1, factor: FACTORES.gas_natural,           tipo: 'fisica', unidades: ['m3'] },
  combustible_diesel:   { alcance: 1, factor: FACTORES.diesel,                tipo: 'fisica', unidades: ['gal', 'galon', 'galones'] },
  combustible_gasolina: { alcance: 1, factor: FACTORES.gasolina,              tipo: 'fisica', unidades: ['gal', 'galon', 'galones'] },
  refrigerantes:        { alcance: 1, factor: FACTORES.refrigerantes.R134a,   tipo: 'fisica', unidades: ['kg', 'kilogramo', 'kilogramos'] },
  transporte_aereo:     { alcance: 3, factor: 0.255, tipo: 'gasto' },
  transporte_terrestre: { alcance: 3, factor: 0.12,  tipo: 'gasto' },
  compras_bienes:       { alcance: 3, factor: 0.45,  tipo: 'gasto' },
  compras_servicios:    { alcance: 3, factor: 0.15,  tipo: 'gasto' },
  residuos:             { alcance: 3, factor: 0.50,  tipo: 'gasto' },
  agua:                 { alcance: 3, factor: 0.344, tipo: 'gasto' },
  nomina:               { alcance: 3, factor: 0.005, tipo: 'gasto' },
}

export function norm(s = '') {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/³/g, '3').trim()
}

const r2 = (n) => Math.round(n * 100) / 100

// Devuelve { kg, metodo, requiereCantidad }
export function calcularCO2e({ valorCOP = 0, cantidad = 0, unidad = '', categoria }) {
  const cfg = CATEGORIAS[categoria]
  if (!cfg) return { kg: 0, metodo: 'sin_factor', requiereCantidad: false }
  if (cantidad > 0 && cfg.unidades?.includes(norm(unidad))) {
    return { kg: r2(cantidad * cfg.factor), metodo: 'cantidad', requiereCantidad: false }
  }
  if (cfg.tipo === 'fisica') {
    // Solo la electricidad se puede estimar desde el gasto con un precio de referencia ya usado en la app.
    if (categoria === 'electricidad' && valorCOP > 0) {
      return { kg: r2((valorCOP / FACTORES.precio_kwh_cop) * cfg.factor), metodo: 'estimacion_gasto', requiereCantidad: false }
    }
    // Combustibles, gas y refrigerantes: sin cantidad física no se estima (antes se multiplicaba el factor por USD).
    return { kg: 0, metodo: 'requiere_cantidad', requiereCantidad: true }
  }
  return { kg: r2((valorCOP / COP_TO_USD) * cfg.factor), metodo: 'estimacion_gasto', requiereCantidad: false }
}

// Convierte a número finito no negativo (acotado) para entradas de la API pública
export function num(x, max = 1e9) {
  const n = Number(x)
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0
}
