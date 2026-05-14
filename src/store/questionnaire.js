import { create } from 'zustand'

export const useQuestionnaire = create((set, get) => ({
  empresa: {
    nombre: '', sector: '', tamano: '', pais: 'Colombia', email: '', nit: '',
  },
  respuestas: {},
  step: 'onboarding',
  currentQ: 0,
  completado: false,

  setEmpresa: (data) => set(s => ({ empresa: { ...s.empresa, ...data } })),
  setRespuesta: (id, value) => set(s => ({ respuestas: { ...s.respuestas, [id]: value } })),

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
    respuestas: {}, step: 'onboarding', currentQ: 0, completado: false
  }),
}))
