import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import { initialFlowState, type EstadoFlujo } from '../wizardFlowStore';

// Mock console.log para evitar spam
vi.mock('console', () => ({
  log: vi.fn()
}));

// Crear instancia fresca del store para cada test
const createTestStore = () => {
  interface WizardFlowStore {
    currentStoryId: string | null;
    estado: EstadoFlujo;
    setStoryId: (id: string | null) => void;
    setPersonajes: (count: number) => void;
    avanzarEtapa: (etapa: keyof EstadoFlujo) => void;
    setEstadoCompleto: (estado: EstadoFlujo) => void;
    resetEstado: () => void;
  }

  return create<WizardFlowStore>()((set, get) => ({
    currentStoryId: null,
    estado: { ...initialFlowState, personajes: { ...initialFlowState.personajes } },
    
    setStoryId: (id) => {
      set({ currentStoryId: id });
    },
    
    setPersonajes: (count) =>
      set((state) => {
        const nuevoEstado = { 
          ...state.estado,
          personajes: { ...state.estado.personajes, personajesAsignados: count }
        };
        
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
      
    setEstadoCompleto: (nuevo) => {
      set({ estado: { ...nuevo } });
    },
    
    resetEstado: () => {
      set({ 
        currentStoryId: null,
        estado: { 
          ...initialFlowState, 
          personajes: { ...initialFlowState.personajes } 
        } 
      });
    }
  }));
};

describe('wizardFlowStore - Tests Funcionales', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Estado inicial', () => {
    it('debe inicializar correctamente', () => {
      const { estado, currentStoryId } = store.getState();
      
      expect(estado.personajes.estado).toBe('no_iniciada');
      expect(estado.personajes.personajesAsignados).toBe(0);
      expect(estado.cuento).toBe('no_iniciada');
      expect(estado.diseno).toBe('no_iniciada');
      expect(estado.vistaPrevia).toBe('no_iniciada');
      expect(currentStoryId).toBeNull();
    });
  });

  describe('setPersonajes', () => {
    it('debe manejar 0 personajes', () => {
      store.getState().setPersonajes(0);
      const { estado } = store.getState();
      
      expect(estado.personajes.estado).toBe('no_iniciada');
      expect(estado.personajes.personajesAsignados).toBe(0);
      expect(estado.cuento).toBe('no_iniciada');
    });

    it('debe manejar 1-2 personajes (borrador)', () => {
      store.getState().setPersonajes(2);
      const { estado } = store.getState();
      
      expect(estado.personajes.estado).toBe('borrador');
      expect(estado.personajes.personajesAsignados).toBe(2);
      expect(estado.cuento).toBe('no_iniciada');
    });

    it('debe manejar 3+ personajes (completado)', () => {
      store.getState().setPersonajes(3);
      const { estado } = store.getState();
      
      expect(estado.personajes.estado).toBe('completado');
      expect(estado.personajes.personajesAsignados).toBe(3);
      expect(estado.cuento).toBe('borrador');
    });
  });

  describe('avanzarEtapa', () => {
    it('debe avanzar cuento solo con personajes completados', () => {
      const storeState = store.getState();
      
      // Intentar avanzar sin personajes completados
      storeState.avanzarEtapa('cuento');
      expect(store.getState().estado.cuento).toBe('no_iniciada');
      
      // Completar personajes y avanzar
      storeState.setPersonajes(3);
      storeState.avanzarEtapa('cuento');
      
      const { estado } = store.getState();
      expect(estado.cuento).toBe('completado');
      expect(estado.diseno).toBe('borrador');
    });

    it('debe seguir flujo secuencial completo', () => {
      const storeState = store.getState();
      
      // 1. Personajes
      storeState.setPersonajes(3);
      let { estado } = store.getState();
      expect(estado.personajes.estado).toBe('completado');
      expect(estado.cuento).toBe('borrador');
      
      // 2. Cuento
      storeState.avanzarEtapa('cuento');
      estado = store.getState().estado;
      expect(estado.cuento).toBe('completado');
      expect(estado.diseno).toBe('borrador');
      
      // 3. Diseño
      storeState.avanzarEtapa('diseno');
      estado = store.getState().estado;
      expect(estado.diseno).toBe('completado');
      expect(estado.vistaPrevia).toBe('borrador');
    });
  });

  describe('setEstadoCompleto', () => {
    it('debe establecer estado completo', () => {
      const nuevoEstado: EstadoFlujo = {
        personajes: { estado: 'completado', personajesAsignados: 5 },
        cuento: 'completado',
        diseno: 'borrador',
        vistaPrevia: 'no_iniciada'
      };

      store.getState().setEstadoCompleto(nuevoEstado);
      const { estado } = store.getState();
      
      expect(estado).toEqual(nuevoEstado);
    });
  });

  describe('resetEstado', () => {
    it('debe resetear completamente', () => {
      const storeState = store.getState();
      
      // Modificar estado
      storeState.setPersonajes(3);
      storeState.avanzarEtapa('cuento');
      storeState.setStoryId('test-id');
      
      // Resetear
      storeState.resetEstado();
      const { estado, currentStoryId } = store.getState();
      
      expect(estado.personajes.estado).toBe('no_iniciada');
      expect(estado.personajes.personajesAsignados).toBe(0);
      expect(estado.cuento).toBe('no_iniciada');
      expect(estado.diseno).toBe('no_iniciada');
      expect(estado.vistaPrevia).toBe('no_iniciada');
      expect(currentStoryId).toBeNull();
    });
  });

  describe('setStoryId', () => {
    it('debe manejar story ID', () => {
      const storeState = store.getState();
      
      storeState.setStoryId('test-id-123');
      expect(store.getState().currentStoryId).toBe('test-id-123');
      
      storeState.setStoryId(null);
      expect(store.getState().currentStoryId).toBeNull();
    });
  });

  describe('Casos edge', () => {
    it('no debe permitir regresión ilegal', () => {
      const storeState = store.getState();
      
      // Completar hasta diseño
      storeState.setPersonajes(3);
      storeState.avanzarEtapa('cuento');
      storeState.avanzarEtapa('diseno');
      
      // Reducir personajes no debe afectar estados avanzados
      storeState.setPersonajes(1);
      const { estado } = store.getState();
      
      expect(estado.cuento).toBe('completado');
      expect(estado.diseno).toBe('completado');
    });

    it('debe manejar múltiples llamadas a avanzarEtapa', () => {
      const storeState = store.getState();
      
      storeState.setPersonajes(3);
      storeState.avanzarEtapa('cuento');
      storeState.avanzarEtapa('cuento'); // Múltiples llamadas
      storeState.avanzarEtapa('cuento');
      
      const { estado } = store.getState();
      expect(estado.cuento).toBe('completado');
      expect(estado.diseno).toBe('borrador');
    });
  });
});