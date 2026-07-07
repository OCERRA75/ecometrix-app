import { create } from 'zustand'

export const useQuestionnaire = create((set, get) => ({
  empresa: {
    nombre: '', sector: '', tamano: '', pais: 'Colombia', email: '', nit: '',
  },
  respuestas: {},
  facturasAcumuladas: {}, // { [campoId]: cantidad_de_facturas_sumadas }
  step: 'onboarding',
  currentQ: 0,
  completado: false,

  setEmpresa: (data) => set(s => ({ empresa: { ...s.empresa, ...data } })),

  // Edición manual del usuario: reemplaza el valor y reinicia el contador de facturas
  // (si el usuario corrige a mano, ya no queremos que la próxima importación siga sumando
  // sobre un total que él mismo redefinió).
  setRespuesta: (id, value) => set(s => ({
    respuestas: { ...s.respuestas, [id]: value },
    facturasAcumuladas: { ...s.facturasAcumuladas, [id]: 0 },
  })),

  // Importación de factura: suma sobre lo ya acumulado para ese campo.
  // Usar esta función (no setRespuesta) desde InvoiceImporter/handleImport.
  acumularRespuesta: (id, value) => set(s => {
    const anterior = parseFloat(s.respuestas[id]) || 0
    const nuevo = anterior + parseFloat(value)
    const contador = (s.facturasAcumuladas[id] || 0) + 1
    return {
      respuestas: { ...s.respuestas, [id]: String(nuevo) },
      facturasAcumuladas: { ...s.facturasAcumuladas, [id]: contador },
    }
  }),

  nextStep: () => {
    const steps = ['onboarding', 'alcance1', 'alcance2', 'alcance3', 'resumen']
    const current = get().step
    const idx = steps.indexOf(current)
    if (idx < steps.length - 1) set({ step: steps[idx + 1], currentQ: 0 })
  },

  prevStep: () => {
    const steps = ['onboarding', 'alcance1', 'alcance2', 'alcance3', 'resumen']
    const current = get().step
    const idx = steps.indexOf(current)
    if (idx > 0) set({ step: steps[idx - 1], currentQ: 0 })
  },

  setCurrentQ: (q) => set({ currentQ: q }),
  setCompletado: () => set({ completado: true }),
  reset: () => set({
    empresa: { nombre:'', sector:'', tamano:'', pais:'Colombia', email:'', nit:'' },
    respuestas: {}, facturasAcumuladas: {}, step: 'onboarding', currentQ: 0, completado: false
  }),
}))
