import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth.jsx'
import PlanGuard from '@/components/PlanGuard.jsx'
import Landing from '@/pages/Landing.jsx'
import Questionnaire from '@/pages/Questionnaire.jsx'
import Report from '@/pages/Report.jsx'
import Dashboard360 from '@/pages/Dashboard360.jsx'
import CSRD from '@/pages/CSRD.jsx'
import Login from '@/pages/Login.jsx'
import Pricing from '@/pages/Pricing.jsx'
import Developers from '@/pages/Developers.jsx'
import NotFound from '@/pages/NotFound.jsx'
import Standards from '@/pages/Standards.jsx'
import Verify from '@/pages/Verify.jsx'
import Ruta from '@/pages/Ruta.jsx'
import Integrations from '@/pages/Integrations.jsx'
import Manual from '@/pages/Manual.jsx'
import ReductionPlan from '@/pages/ReductionPlan.jsx'
import Admin from '@/pages/Admin.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                    element={<Landing />} />
          <Route path="/diagnostico"         element={<Questionnaire />} />
          <Route path="/reporte/:id"         element={<Report />} />
          <Route path="/reporte/preview"     element={<Report />} />
          <Route path="/dashboard"           element={<Dashboard360 />} />
          <Route path="/login"               element={<Login />} />
          <Route path="/precios"             element={<Pricing />} />
          <Route path="/ruta"                element={<Ruta />} />
          <Route path="/estandares"          element={<Standards />} />
          <Route path="/verificar/:codigo"   element={<Verify />} />
          <Route path="/manual"              element={<Manual />} />
          <Route path="/admin"               element={<Admin />} />
          <Route path="/plan"                element={<PlanGuard requiereNivel={1}><ReductionPlan /></PlanGuard>} />
          <Route path="/csrd"                element={<PlanGuard requiereNivel={2}><CSRD /></PlanGuard>} />
          <Route path="/integraciones"       element={<PlanGuard requiereNivel={2}><Integrations /></PlanGuard>} />
          <Route path="/developers"          element={<PlanGuard requiereNivel={2}><Developers /></PlanGuard>} />
          <Route path="*"                    element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
