// api/v1/health.js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  return res.status(200).json({
    status: 'ok',
    version: '1.2.0',
    service: 'EcoMetriX API',
    endpoints: ['GET  /api/v1/health', 'GET  /api/v1/factors', 'POST /api/v1/calculate', 'POST /api/v1/emissions'],
    docs: 'https://www.ecometrix.app/developers',
    contact: 'contacto@ecometrix.app',
  })
}
