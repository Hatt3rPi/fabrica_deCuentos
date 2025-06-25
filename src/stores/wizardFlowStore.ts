import { create } from 'zustand';
import { wizardStateService } from '../services/wizardStateService';

export type EtapaEstado = 'no_iniciada' | 'borrador' | 'completado';

export interface EstadoFlujo {
  personajes: {
    estado: EtapaEstado;
    personajesAsignados: number;
  };
  cuento: EtapaEstado;
  diseno: EtapaEstado;
  vistaPrevia: EtapaEstado;
  dedicatoriaChoice: EtapaEstado;
  dedicatoria: EtapaEstado;
}

const logEstado = (estado: EstadoFlujo, accion: string, id?: string | null) => {
  const suffix = id?.slice(-6) || '------';
  console.log(`[WizardFlow:${suffix}] ${accion}`, {
    personajes: estado.personajes.estado,
    cuento: estado.cuento,
    diseno: estado.diseno,
    vistaPrevia: estado.vistaPrevia,
    dedicatoriaChoice: estado.dedicatoriaChoice,
    dedicatoria: estado.dedicatoria,
  });
};

interface WizardFlowStore {
  currentStoryId: string | null;
  estado: EstadoFlujo;
  setStoryId: (id: string | null) => void;
  setPersonajes: (count: number) => void;
  avanzarEtapa: (etapa: keyof EstadoFlujo) => void;
  regresarEtapa: (etapa: keyof EstadoFlujo) => void;
  setEstadoCompleto: (estado: EstadoFlujo) => void;
  resetEstado: () => void;
}

export const initialFlowState: EstadoFlujo = {
  personajes: { estado: 'no_iniciada', personajesAsignados: 0 },
  cuento: 'no_iniciada',
  diseno: 'no_iniciada',
  vistaPrevia: 'no_iniciada',
  dedicatoriaChoice: 'no_iniciada',
  dedicatoria: 'no_iniciada'
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
          logEstado(nuevoEstado, 'setPersonajes', get().currentStoryId);
          
          // Persistir wizard_state inmediatamente en cambios críticos
          const currentStoryId = get().currentStoryId;
          if (currentStoryId) {
            wizardStateService.updateWizardState(currentStoryId, nuevoEstado);
          }
          
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
              nuevoEstado.vistaPrevia = 'completado';
              nuevoEstado.dedicatoriaChoice = 'borrador';
            }
          } else if (etapa === 'dedicatoriaChoice') {
            if (nuevoEstado.vistaPrevia === 'completado') {
              nuevoEstado.dedicatoriaChoice = 'completado';
            }
          } else if (etapa === 'dedicatoria') {
            if (nuevoEstado.dedicatoriaChoice === 'completado') {
              nuevoEstado.dedicatoria = 'completado';
            }
          }
          logEstado(nuevoEstado, 'avanzarEtapa', get().currentStoryId);
          
          // Persistir wizard_state en avances de etapa
          const currentStoryId = get().currentStoryId;
          if (currentStoryId) {
            wizardStateService.updateWizardState(currentStoryId, nuevoEstado);
          }
          
          return { estado: nuevoEstado };
        }),
      regresarEtapa: (etapa) =>
        set((state) => {
          const nuevoEstado = { ...state.estado };
          if (etapa === 'cuento' && nuevoEstado.cuento !== 'completado') {
            nuevoEstado.cuento = 'borrador';
          } else if (etapa === 'diseno' && nuevoEstado.diseno !== 'completado') {
            nuevoEstado.diseno = 'borrador';
          } else if (etapa === 'vistaPrevia' && nuevoEstado.vistaPrevia !== 'completado') {
            nuevoEstado.vistaPrevia = 'borrador';
          } else if (etapa === 'dedicatoriaChoice' && nuevoEstado.dedicatoriaChoice !== 'completado') {
            nuevoEstado.dedicatoriaChoice = 'borrador';
          } else if (etapa === 'dedicatoria' && nuevoEstado.dedicatoria !== 'completado') {
            nuevoEstado.dedicatoria = 'borrador';
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

