// api/v1/factors.js — Vercel Serverless Function
const FACTORES = {
  gasolina:    8.78,
  diesel:      10.15,
  acpm:        10.15,
  gas_natural: 5.49,
  carbon:      2.42,
  electricidad: {
    Colombia: 0.126, Mexico: 0.454, Argentina: 0.321, Chile: 0.287,
    Peru: 0.249, Ecuador: 0.272, Espana: 0.181, default: 0.35,
  },
  refrigerantes: { R410A: 2088, R22: 1810, R134a: 1430, default: 1500 },
  residuos:      { general: 0.5, organico: 0.8, default: 0.5 },
  viajes:        { aereo: 0.255, terrestre: 0.089, default: 0.15 },
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  return res.status(200).json({
    combustibles: {
      gasolina:    { factor: 8.78,  unidad: 'kg CO2e/galón', fuente: 'IPCC AR6' },
      diesel:      { factor: 10.15, unidad: 'kg CO2e/galón', fuente: 'IPCC AR6' },
      acpm:        { factor: 10.15, unidad: 'kg CO2e/galón', fuente: 'IPCC AR6' },
      gas_natural: { factor: 5.49,  unidad: 'kg CO2e/m³',   fuente: 'IPCC AR6' },
      carbon:      { factor: 2.42,  unidad: 'kg CO2e/kg',   fuente: 'IPCC AR6' },
    },
    electricidad: Object.entries(FACTORES.electricidad)
      .filter(([k]) => k !== 'default')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: { factor: v, unidad: 'kg CO2e/kWh' } }), {}),
    refrigerantes: Object.entries(FACTORES.refrigerantes)
      .filter(([k]) => k !== 'default')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: { gwp: v, unidad: 'kg CO2e/kg' } }), {}),
    actualizacion: '2024-01',
    metodologia: 'GHG Protocol Corporate Standard + IPCC AR6 Emission Factors',
  })
}
