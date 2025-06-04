import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EtapaEstado = 'no_iniciada' | 'borrador' | 'completado';

export interface EstadoFlujo {
  personajes: {
    estado: EtapaEstado;
    personajesAsignados: number;
  };
  cuento: EtapaEstado;
  diseno: EtapaEstado;
  vistaPrevia: EtapaEstado;
}

interface WizardFlowStore {
  estado: EstadoFlujo;
  setPersonajes: (count: number) => void;
  avanzarEtapa: (etapa: keyof EstadoFlujo) => void;
  regresarEtapa: (etapa: keyof EstadoFlujo) => void;
  resetEstado: () => void;
}

const initialState: EstadoFlujo = {
  personajes: { estado: 'no_iniciada', personajesAsignados: 0 },
  cuento: 'no_iniciada',
  diseno: 'no_iniciada',
  vistaPrevia: 'no_iniciada'
};

export const useWizardFlowStore = create<WizardFlowStore>()(
  persist(
    (set, get) => ({
      estado: initialState,
      setPersonajes: (count) =>
        set((state) => {
          const nuevoEstado = { ...state.estado };
          nuevoEstado.personajes.personajesAsignados = count;
          if (count === 0) {
            nuevoEstado.personajes.estado = 'no_iniciada';
          } else if (count < 3) {
            nuevoEstado.personajes.estado = 'borrador';
          } else {
            nuevoEstado.personajes.estado = 'completado';
            if (nuevoEstado.cuento === 'no_iniciada') {
              nuevoEstado.cuento = 'borrador';
            }
          }
          return { estado: nuevoEstado };
        }),
      avanzarEtapa: (etapa) =>
        set((state) => {
          const nuevoEstado = { ...state.estado };
          if (etapa === 'personajes') {
            if (nuevoEstado.personajes.estado === 'borrador' || nuevoEstado.personajes.estado === 'completado') {
              nuevoEstado.personajes.estado = 'completado';
              nuevoEstado.cuento = 'borrador';
            }
          } else if (etapa === 'cuento') {
            if (nuevoEstado.personajes.estado === 'completado' && nuevoEstado.cuento !== 'completado') {
              nuevoEstado.cuento = 'completado';
              nuevoEstado.diseno = 'borrador';
            }
          } else if (etapa === 'diseno') {
            if (nuevoEstado.cuento === 'completado' && nuevoEstado.diseno !== 'completado') {
              nuevoEstado.diseno = 'completado';
              nuevoEstado.vistaPrevia = 'borrador';
            }
          } else if (etapa === 'vistaPrevia') {
            if (nuevoEstado.diseno === 'completado') {
              nuevoEstado.vistaPrevia = 'borrador';
            }
          }
          return { estado: nuevoEstado };
        }),
      regresarEtapa: (etapa) =>
        set((state) => {
          const nuevoEstado = { ...state.estado };
          if (etapa === 'cuento') {
            nuevoEstado.cuento = 'borrador';
          } else if (etapa === 'diseno') {
            nuevoEstado.diseno = 'borrador';
          } else if (etapa === 'vistaPrevia') {
            nuevoEstado.vistaPrevia = 'borrador';
          }
          return { estado: nuevoEstado };
        }),
      resetEstado: () => set({ estado: initialState })
    }),
    {
      name: 'wizard-flow-store'
    }
  )
);

