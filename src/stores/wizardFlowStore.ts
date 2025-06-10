import { create } from 'zustand';

export type EtapaEstado = 'no_iniciada' | 'borrador' | 'completado';

export interface EstadoFlujo {
  '1.personajes': {
    estado: EtapaEstado;
    personajesAsignados: number;
  };
  '2.cuento': EtapaEstado;
  '3.diseno': EtapaEstado;
  '4.vistaPrevia': EtapaEstado;
}

const logEstado = (estado: EstadoFlujo, accion: string, id?: string | null) => {
  const suffix = id?.slice(-6) || '------';
  console.log(`[WizardFlow:${suffix}] ${accion}`, {
    personajes: estado['1.personajes'].estado,
    cuento: estado['2.cuento'],
    diseno: estado['3.diseno'],
    vistaPrevia: estado['4.vistaPrevia'],
  });
};

interface WizardFlowStore {
  currentStoryId: string | null;
  estado: EstadoFlujo;
  setStoryId: (id: string | null) => void;
  setPersonajes: (count: number) => void;
  avanzarEtapa: (etapa: '1.personajes' | '2.cuento' | '3.diseno' | '4.vistaPrevia') => void;
  regresarEtapa: (etapa: '1.personajes' | '2.cuento' | '3.diseno' | '4.vistaPrevia') => void;
  setEstadoCompleto: (estado: EstadoFlujo) => void;
  resetEstado: () => void;
}

export const initialFlowState: EstadoFlujo = {
  '1.personajes': { estado: 'no_iniciada', personajesAsignados: 0 },
  '2.cuento': 'no_iniciada',
  '3.diseno': 'no_iniciada',
  '4.vistaPrevia': 'no_iniciada'
};

export const useWizardFlowStore = create<WizardFlowStore>()(
  (set, get) => ({
      currentStoryId: null,
      estado: initialFlowState,
      setStoryId: (id) => {
        set({ currentStoryId: id });
      },
      setPersonajes: (count) =>
        set((state) => {
          const nuevoEstado = { ...state.estado };
          nuevoEstado['1.personajes'].personajesAsignados = count;
          if (count === 0) {
            nuevoEstado['1.personajes'].estado = 'no_iniciada';
          } else if (count < 3) {
            nuevoEstado['1.personajes'].estado = 'borrador';
          } else {
            nuevoEstado['1.personajes'].estado = 'completado';
            if (nuevoEstado['2.cuento'] === 'no_iniciada') {
              nuevoEstado['2.cuento'] = 'borrador';
            }
          }
          logEstado(nuevoEstado, 'setPersonajes', get().currentStoryId);
          return { estado: nuevoEstado };
        }),
      setEstadoCompleto: (nuevo) =>
        set(() => {
          logEstado(nuevo, 'setEstadoCompleto', get().currentStoryId);
          return { estado: nuevo };
        }),
      avanzarEtapa: (etapa) =>
        set((state) => {
          const nuevoEstado = { ...state.estado };
          if (etapa === '1.personajes') {
            if (nuevoEstado['1.personajes'].estado === 'borrador' || nuevoEstado['1.personajes'].estado === 'completado') {
              nuevoEstado['1.personajes'].estado = 'completado';
              nuevoEstado['2.cuento'] = 'borrador';
            }
          } else if (etapa === '2.cuento') {
            if (nuevoEstado['1.personajes'].estado === 'completado' && nuevoEstado['2.cuento'] !== 'completado') {
              nuevoEstado['2.cuento'] = 'completado';
              nuevoEstado['3.diseno'] = 'borrador';
            }
          } else if (etapa === '3.diseno') {
            if (nuevoEstado['2.cuento'] === 'completado' && nuevoEstado['3.diseno'] !== 'completado') {
              nuevoEstado['3.diseno'] = 'completado';
              nuevoEstado['4.vistaPrevia'] = 'borrador';
            }
          } else if (etapa === '4.vistaPrevia') {
            if (nuevoEstado['3.diseno'] === 'completado') {
              nuevoEstado['4.vistaPrevia'] = 'borrador';
            }
          }
          logEstado(nuevoEstado, 'avanzarEtapa', get().currentStoryId);
          return { estado: nuevoEstado };
        }),
      regresarEtapa: (etapa) =>
        set((state) => {
          const nuevoEstado = { ...state.estado };
          if (etapa === '2.cuento' && nuevoEstado['2.cuento'] !== 'completado') {
            nuevoEstado['2.cuento'] = 'borrador';
          } else if (etapa === '3.diseno' && nuevoEstado['3.diseno'] !== 'completado') {
            nuevoEstado['3.diseno'] = 'borrador';
          } else if (etapa === '4.vistaPrevia' && nuevoEstado['4.vistaPrevia'] !== 'completado') {
            nuevoEstado['4.vistaPrevia'] = 'borrador';
          }
          logEstado(nuevoEstado, 'regresarEtapa', get().currentStoryId);
          return { estado: nuevoEstado };
        }),
      resetEstado: () => {
        logEstado(initialFlowState, 'resetEstado', get().currentStoryId);
        set({ estado: initialFlowState });
      }
    })
);
