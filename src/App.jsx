import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Pages — se irán creando en M2, M3, M4...
import Landing from '@/pages/Landing.jsx'
import NotFound from '@/pages/NotFound.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Landing />} />
        {/* M3: Cuestionario */}
        {/* <Route path="/diagnostico" element={<Questionnaire />} /> */}
        {/* M4/M5: Resultados */}
        {/* <Route path="/reporte"     element={<Report />} /> */}
        {/* M11: Dashboard autenticado */}
        {/* <Route path="/dashboard"   element={<Dashboard />} /> */}
        <Route path="*"           element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
