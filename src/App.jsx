import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from '@/pages/Landing.jsx'
import Questionnaire from '@/pages/Questionnaire.jsx'
import Report from '@/pages/Report.jsx'
import NotFound from '@/pages/NotFound.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<Landing />} />
        <Route path="/diagnostico"         element={<Questionnaire />} />
        <Route path="/reporte/:id"         element={<Report />} />
        <Route path="/reporte/preview"     element={<Report />} />
        <Route path="*"                    element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
