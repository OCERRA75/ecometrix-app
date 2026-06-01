// src/pages/Admin.jsx — M19 Panel de Administración
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase.js'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const NIVELES = {
  1: { label: 'Iniciado Verde', color: 'text-gray-500', bg: 'bg-gray-100' },
  2: { label: 'Comprometido',   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  3: { label: 'Avanzado',       color: 'text-green-700', bg: 'bg-green-50' },
  4: { label: 'Líder',          color: 'text-amber-600', bg: 'bg-amber-50' },
}

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

function MetricCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      const res = await fetch('/api/admin-stats', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()

      if (res.status === 403) { setError('Acceso restringido'); setLoading(false); return }
      if (!res.ok) throw new Error(json.message)

      setStats(json)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const usuariosFiltrados = stats?.usuarios?.filter(u =>
    u.empresa?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.sector?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.pais?.toLowerCase().includes(busqueda.toLowerCase())
  ) || []

  const mesesLabels = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
  }

  const actividadChart = stats?.actividad_mensual?.map(d => ({
    mes: mesesLabels[d.mes?.slice(5)] || d.mes,
    diagnosticos: d.count
  })) || []

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
      {error}
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <IconLeaf />
          </div>
          <span className="font-semibold text-sm">EcoMetriX</span>
          <span className="text-zinc-600 text-sm ml-1">/ Admin</span>
        </div>
        <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Dashboard
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <p className="text-sm text-zinc-500 mt-1">Métricas generales de la plataforma</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Diagnósticos totales"
            value={stats?.metricas?.total_diagnosticos}
            color="text-white"
          />
          <MetricCard
            label="Usuarios activos"
            value={stats?.metricas?.total_usuarios}
            color="text-emerald-400"
          />
          <MetricCard
            label="Meses reportados"
            value={stats?.metricas?.total_planes_activos}
            sub="en planes de reducción"
            color="text-blue-400"
          />
          <MetricCard
            label="Certificaciones"
            value={stats?.metricas?.total_certificaciones}
            color="text-amber-400"
          />
        </div>

        {/* Gráfico actividad */}
        {actividadChart.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
            <h2 className="text-sm font-semibold mb-4 text-zinc-300">Diagnósticos por mes</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={actividadChart} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelStyle={{ color: '#a1a1aa' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="diagnosticos" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabla usuarios */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Usuarios</h2>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar empresa, sector, país..."
              className="text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 w-56"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                  <th className="text-left px-5 py-3 font-medium">Empresa</th>
                  <th className="text-left px-5 py-3 font-medium">Sector</th>
                  <th className="text-left px-5 py-3 font-medium">País</th>
                  <th className="text-right px-5 py-3 font-medium">CO₂/mes</th>
                  <th className="text-right px-5 py-3 font-medium">Diagnósticos</th>
                  <th className="text-right px-5 py-3 font-medium">Meses plan</th>
                  <th className="text-left px-5 py-3 font-medium">Certificación</th>
                  <th className="text-right px-5 py-3 font-medium">Último</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u, i) => {
                  const nivel = NIVELES[u.certificacion]
                  return (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-white truncate max-w-[160px]">{u.empresa}</td>
                      <td className="px-5 py-3 text-zinc-400 text-xs">{u.sector}</td>
                      <td className="px-5 py-3 text-zinc-400 text-xs">{u.pais}</td>
                      <td className="px-5 py-3 text-right text-zinc-300 text-xs">
                        {u.total_kgco2 ? `${u.total_kgco2.toLocaleString()} kg` : '-'}
                      </td>
                      <td className="px-5 py-3 text-right text-zinc-300">{u.total_diagnosticos}</td>
                      <td className="px-5 py-3 text-right text-zinc-300">{u.meses_reportados}/12</td>
                      <td className="px-5 py-3">
                        {nivel ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${nivel.bg} ${nivel.color} font-medium`}>
                            {nivel.label}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-zinc-500 text-xs">
                        {u.ultimo_diagnostico ? new Date(u.ultimo_diagnostico).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                    </tr>
                  )
                })}
                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-zinc-600 text-sm">
                      No hay resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
