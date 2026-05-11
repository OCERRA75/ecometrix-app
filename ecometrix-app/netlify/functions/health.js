// netlify/functions/health.js
// GET /api/health — verifica que las funciones serverless están activas
export const handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'ok',
      service: 'EcoMetriX API',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    }),
  }
}
