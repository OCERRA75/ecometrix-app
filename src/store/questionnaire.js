import { create } from 'zustand'

export const useQuestionnaire = create((set, get) => ({
  // Onboarding
  empresa: {
    nombre: '',
    sector: '',
    tamano: '',      // micro, pequena, mediana
    pais: 'Colombia',
    email: '',
    nit: '',
  },

  // Respuestas del cuestionario { questionId: value }
  respuestas: {},

  // Navegación
  step: 'onboarding',   // onboarding | alcance1 | alcance2 | resumen
  currentQ: 0,          // índice dentro del step actual
  completado: false,

  // Acciones
  setEmpresa: (data) => set(s => ({ empresa: { ...s.empresa, ...data } })),

  setRespuesta: (id, value) => set(s => ({
    respuestas: { ...s.respuestas, [id]: value }
  })),

  nextStep: () => {
    const steps = ['onboarding', 'alcance1', 'alcance2', 'resumen']
    const current = get().step
    const idx = steps.indexOf(current)
    if (idx < steps.length - 1) set({ step: steps[idx + 1], currentQ: 0 })
  },

  prevStep: () => {
    const steps = ['onboarding', 'alcance1', 'alcance2', 'resumen']
    const current = get().step
    const idx = steps.indexOf(current)
    if (idx > 0) set({ step: steps[idx - 1], currentQ: 0 })
  },

  setCurrentQ: (q) => set({ currentQ: q }),
  setCompletado: () => set({ completado: true }),
  reset: () => set({ empresa: { nombre:'',sector:'',tamano:'',pais:'Colombia',email:'',nit:'' }, respuestas:{}, step:'onboarding', currentQ:0, completado:false }),
}))
