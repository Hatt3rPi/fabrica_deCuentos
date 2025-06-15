import { describe, it, expect, beforeEach } from 'vitest';
import { useWizardFlowStore, initialFlowState, type EstadoFlujo } from '../wizardFlowStore';

describe('wizardFlowStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useWizardFlowStore.getState().resetEstado();
    useWizardFlowStore.getState().setStoryId(null);
  });

  describe('Estado inicial', () => {
    it('debe inicializar con estado correcto', () => {
      const { estado } = useWizardFlowStore.getState();
      expect(estado).toEqual(initialFlowState);
      expect(estado.personajes.estado).toBe('no_iniciada');
      expect(estado.personajes.personajesAsignados).toBe(0);
      expect(estado.cuento).toBe('no_iniciada');
      expect(estado.diseno).toBe('no_iniciada');
      expect(estado.vistaPrevia).toBe('no_iniciada');
    });
  });

  describe('setPersonajes', () => {
    it('debe mantener no_iniciada con 0 personajes', () => {
      const { setPersonajes } = useWizardFlowStore.getState();
      setPersonajes(0);
      
      const { estado } = useWizardFlowStore.getState();
      expect(estado.personajes.estado).toBe('no_iniciada');
      expect(estado.personajes.personajesAsignados).toBe(0);
      expect(estado.cuento).toBe('no_iniciada');
    });

    it('debe cambiar a borrador con 1-2 personajes', () => {
      const { setPersonajes } = useWizardFlowStore.getState();
      setPersonajes(2);
      
      const { estado } = useWizardFlowStore.getState();
      expect(estado.personajes.estado).toBe('borrador');
      expect(estado.personajes.personajesAsignados).toBe(2);
      expect(estado.cuento).toBe('no_iniciada');
    });

    it('debe cambiar a completado con 3+ personajes y habilitar cuento', () => {
      const { setPersonajes } = useWizardFlowStore.getState();
      setPersonajes(3);
      
      const { estado } = useWizardFlowStore.getState();
      expect(estado.personajes.estado).toBe('completado');
      expect(estado.personajes.personajesAsignados).toBe(3);
      expect(estado.cuento).toBe('borrador');
    });

    it('no debe avanzar cuento si ya está completado', () => {
      const { setPersonajes, avanzarEtapa } = useWizardFlowStore.getState();
      
      // Simular cuento completado
      setPersonajes(3);
      avanzarEtapa('cuento');
      expect(useWizardFlowStore.getState().estado.cuento).toBe('completado');
      
      // Cambiar personajes no debe afectar cuento completado
      setPersonajes(4);
      expect(useWizardFlowStore.getState().estado.cuento).toBe('completado');
    });
  });

  describe('avanzarEtapa', () => {
    it('debe avanzar personajes correctamente', () => {
      const { setPersonajes, avanzarEtapa } = useWizardFlowStore.getState();
      
      // Preparar personajes en borrador
      setPersonajes(2);
      expect(useWizardFlowStore.getState().estado.personajes.estado).toBe('borrador');
      
      // Avanzar etapa personajes
      avanzarEtapa('personajes');
      const { estado } = useWizardFlowStore.getState();
      expect(estado.personajes.estado).toBe('completado');
      expect(estado.cuento).toBe('borrador');
    });

    it('debe avanzar cuento solo si personajes está completado', () => {
      const { avanzarEtapa } = useWizardFlowStore.getState();
      
      // Intentar avanzar cuento sin personajes completados
      avanzarEtapa('cuento');
      expect(useWizardFlowStore.getState().estado.cuento).toBe('no_iniciada');
      
      // Completar personajes primero
      useWizardFlowStore.getState().setPersonajes(3);
      avanzarEtapa('cuento');
      
      const { estado } = useWizardFlowStore.getState();
      expect(estado.cuento).toBe('completado');
      expect(estado.diseno).toBe('borrador');
    });

    it('debe avanzar diseño solo si cuento está completado', () => {
      const { setPersonajes, avanzarEtapa } = useWizardFlowStore.getState();
      
      // Preparar estado hasta cuento
      setPersonajes(3);
      avanzarEtapa('cuento');
      
      // Avanzar diseño
      avanzarEtapa('diseno');
      
      const { estado } = useWizardFlowStore.getState();
      expect(estado.diseno).toBe('completado');
      expect(estado.vistaPrevia).toBe('borrador');
    });

    it('debe avanzar vista previa solo si diseño está completado', () => {
      const { setPersonajes, avanzarEtapa } = useWizardFlowStore.getState();
      
      // Preparar estado hasta diseño
      setPersonajes(3);
      avanzarEtapa('cuento');
      avanzarEtapa('diseno');
      
      // Avanzar vista previa
      avanzarEtapa('vistaPrevia');
      
      const { estado } = useWizardFlowStore.getState();
      expect(estado.vistaPrevia).toBe('borrador');
    });
  });

  describe('setEstadoCompleto', () => {
    it('debe establecer estado completo correctamente', () => {
      const nuevoEstado: EstadoFlujo = {
        personajes: { estado: 'completado', personajesAsignados: 5 },
        cuento: 'completado',
        diseno: 'borrador',
        vistaPrevia: 'no_iniciada'
      };

      const { setEstadoCompleto } = useWizardFlowStore.getState();
      setEstadoCompleto(nuevoEstado);

      const { estado } = useWizardFlowStore.getState();
      expect(estado).toEqual(nuevoEstado);
    });
  });

  describe('resetEstado', () => {
    it('debe resetear al estado inicial', () => {
      const { setPersonajes, avanzarEtapa, resetEstado } = useWizardFlowStore.getState();
      
      // Modificar estado
      setPersonajes(3);
      avanzarEtapa('cuento');
      
      // Verificar que cambió
      expect(useWizardFlowStore.getState().estado.cuento).toBe('completado');
      
      // Resetear
      resetEstado();
      
      // Verificar que volvió al inicial
      const { estado } = useWizardFlowStore.getState();
      expect(estado).toEqual(initialFlowState);
    });
  });

  describe('setStoryId', () => {
    it('debe establecer currentStoryId correctamente', () => {
      const testId = 'test-story-id-123';
      const { setStoryId } = useWizardFlowStore.getState();
      
      setStoryId(testId);
      
      const { currentStoryId } = useWizardFlowStore.getState();
      expect(currentStoryId).toBe(testId);
    });

    it('debe permitir establecer null', () => {
      const { setStoryId } = useWizardFlowStore.getState();
      
      setStoryId('test-id');
      expect(useWizardFlowStore.getState().currentStoryId).toBe('test-id');
      
      setStoryId(null);
      expect(useWizardFlowStore.getState().currentStoryId).toBeNull();
    });
  });

  describe('Flujo completo wizard', () => {
    it('debe seguir secuencia completa correctamente', () => {
      const { setPersonajes, avanzarEtapa } = useWizardFlowStore.getState();
      
      // 1. Agregar personajes
      setPersonajes(3);
      let estado = useWizardFlowStore.getState().estado;
      expect(estado.personajes.estado).toBe('completado');
      expect(estado.cuento).toBe('borrador');
      
      // 2. Completar cuento
      avanzarEtapa('cuento');
      estado = useWizardFlowStore.getState().estado;
      expect(estado.cuento).toBe('completado');
      expect(estado.diseno).toBe('borrador');
      
      // 3. Completar diseño
      avanzarEtapa('diseno');
      estado = useWizardFlowStore.getState().estado;
      expect(estado.diseno).toBe('completado');
      expect(estado.vistaPrevia).toBe('borrador');
      
      // 4. Vista previa permanece en borrador
      avanzarEtapa('vistaPrevia');
      estado = useWizardFlowStore.getState().estado;
      expect(estado.vistaPrevia).toBe('borrador');
    });
  });

  describe('Casos edge', () => {
    it('no debe permitir regresión ilegal de estados', () => {
      const { setPersonajes, avanzarEtapa } = useWizardFlowStore.getState();
      
      // Completar hasta diseño
      setPersonajes(3);
      avanzarEtapa('cuento');
      avanzarEtapa('diseno');
      
      // Reducir personajes no debe afectar estados avanzados
      setPersonajes(1);
      const estado = useWizardFlowStore.getState().estado;
      expect(estado.cuento).toBe('completado');
      expect(estado.diseno).toBe('completado');
    });

    it('debe manejar múltiples llamadas a avanzarEtapa', () => {
      const { setPersonajes, avanzarEtapa } = useWizardFlowStore.getState();
      
      setPersonajes(3);
      
      // Múltiples llamadas no deben cambiar estado final
      avanzarEtapa('cuento');
      avanzarEtapa('cuento');
      avanzarEtapa('cuento');
      
      const estado = useWizardFlowStore.getState().estado;
      expect(estado.cuento).toBe('completado');
      expect(estado.diseno).toBe('borrador');
    });
  });
});