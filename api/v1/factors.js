// api/v1/factors.js
import { FACTORES } from '../../src/lib/factoresEmision.js'

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  return res.status(200).json({
    combustibles: {
      gasolina:    { factor: FACTORES.gasolina,    unidad: 'kg CO2e/galón', fuente: 'EPA GHG Emission Factors Hub' },
      diesel:      { factor: FACTORES.diesel,      unidad: 'kg CO2e/galón', fuente: 'EPA GHG Emission Factors Hub' },
      acpm:        { factor: FACTORES.acpm,        unidad: 'kg CO2e/galón', fuente: 'EPA GHG Emission Factors Hub' },
      gas_natural: { factor: FACTORES.gas_natural, unidad: 'kg CO2/m³',     fuente: 'FECOC (UPME) poder calorífico + IPCC 56,1 kg/GJ' },
      carbon:      { factor: FACTORES.carbon,      unidad: 'kg CO2e/kg',    fuente: 'Rango EPA según tipo de carbón' },
    },
    electricidad: Object.entries(FACTORES.electricidad)
      .filter(([k]) => k !== 'default')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: { factor: v, unidad: 'kg CO2e/kWh' } }), {}),
    refrigerantes: Object.entries(FACTORES.refrigerantes)
      .filter(([k]) => k !== 'default')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: { gwp: v, unidad: 'kg CO2e/kg' } }), {}),
    actualizacion: '2026-11',
    metodologia: 'GHG Protocol Corporate Standard',
  })
}
