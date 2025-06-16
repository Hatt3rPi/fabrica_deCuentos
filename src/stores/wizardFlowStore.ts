import { create } from 'zustand';

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

const logEstado = (estado: EstadoFlujo, accion: string, id?: string | null) => {
  const suffix = id?.slice(-6) || '------';
  console.log(`[WizardFlow:${suffix}] ${accion}`, {
    personajes: estado.personajes.estado,
    cuento: estado.cuento,
    diseno: estado.diseno,
    vistaPrevia: estado.vistaPrevia,
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
  vistaPrevia: 'no_iniciada'
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
          
          // RAMA B: Forzar persistencia inmediata después de setPersonajes
          const currentStoryId = get().currentStoryId;
          if (currentStoryId && count >= 3) {
            console.log('[WizardFlow] FORZANDO PERSISTENCIA INMEDIATA', {
              storyId: currentStoryId,
              nuevoEstado: nuevoEstado
            });
            
            // Importar storyService dinámicamente para evitar imports circulares
            import('../services/storyService').then(({ storyService }) => {
              storyService.persistStory(currentStoryId, {
                updated_at: new Date().toISOString()
              }).then(({ error }) => {
                if (error) {
                  console.error('[WizardFlow] ERROR PERSISTENCIA INMEDIATA:', error);
                } else {
                  console.log('[WizardFlow] ✅ PERSISTENCIA INMEDIATA EXITOSA');
                }
              });
            });
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
              nuevoEstado.vistaPrevia = 'borrador';
            }
          }
          logEstado(nuevoEstado, 'avanzarEtapa', get().currentStoryId);
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

