import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="text-center">
        <p className="text-7xl font-bold text-brand-100 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">Página no encontrada</h1>
        <p className="text-text-secondary mb-6">Esta ruta no existe en EcoMetriX.</p>
        <Link to="/" className="btn-primary">Ir al inicio</Link>
      </div>
    </div>
  )
}
