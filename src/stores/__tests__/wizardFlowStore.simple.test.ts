import { describe, it, expect, beforeEach } from 'vitest';
import { useWizardFlowStore, initialFlowState } from '../wizardFlowStore';

describe('wizardFlowStore - Tests Unitarios', () => {
  beforeEach(() => {
    useWizardFlowStore.getState().resetEstado();
    useWizardFlowStore.getState().setStoryId(null);
  });

  describe('Estado inicial', () => {
    it('debe inicializar correctamente', () => {
      const { estado } = useWizardFlowStore.getState();
      expect(estado).toEqual(initialFlowState);
    });
  });

  describe('Transiciones de personajes', () => {
    it('debe manejar 0 personajes', () => {
      useWizardFlowStore.getState().setPersonajes(0);
      const estado = useWizardFlowStore.getState().estado;
      expect(estado.personajes.estado).toBe('no_iniciada');
      expect(estado.cuento).toBe('no_iniciada');
    });

    it('debe manejar 1-2 personajes', () => {
      useWizardFlowStore.getState().setPersonajes(2);
      const estado = useWizardFlowStore.getState().estado;
      expect(estado.personajes.estado).toBe('borrador');
      expect(estado.cuento).toBe('no_iniciada');
    });

    it('debe manejar 3+ personajes', () => {
      useWizardFlowStore.getState().setPersonajes(3);
      const estado = useWizardFlowStore.getState().estado;
      expect(estado.personajes.estado).toBe('completado');
      expect(estado.cuento).toBe('borrador');
    });
  });

  describe('Flujo secuencial', () => {
    it('debe seguir flujo completo', () => {
      const store = useWizardFlowStore.getState();
      
      // 1. Personajes
      store.setPersonajes(3);
      let estado = store.estado;
      expect(estado.personajes.estado).toBe('completado');
      expect(estado.cuento).toBe('borrador');
      
      // 2. Cuento
      store.avanzarEtapa('cuento');
      estado = store.estado;
      expect(estado.cuento).toBe('completado');
      expect(estado.diseno).toBe('borrador');
      
      // 3. Diseño
      store.avanzarEtapa('diseno');
      estado = store.estado;
      expect(estado.diseno).toBe('completado');
      expect(estado.vistaPrevia).toBe('borrador');
    });
  });

  describe('Reset y persistencia', () => {
    it('debe resetear correctamente', () => {
      const store = useWizardFlowStore.getState();
      store.setPersonajes(3);
      store.avanzarEtapa('cuento');
      
      store.resetEstado();
      expect(store.estado).toEqual(initialFlowState);
    });

    it('debe manejar setEstadoCompleto', () => {
      const nuevoEstado = {
        personajes: { estado: 'completado' as const, personajesAsignados: 5 },
        cuento: 'completado' as const,
        diseno: 'borrador' as const,
        vistaPrevia: 'no_iniciada' as const
      };

      useWizardFlowStore.getState().setEstadoCompleto(nuevoEstado);
      expect(useWizardFlowStore.getState().estado).toEqual(nuevoEstado);
    });
  });
});