import { describe, it, expect } from 'vitest';
import { useWizardFlowStore, initialFlowState } from '../wizardFlowStore';

describe('wizardFlowStore - Tests Básicos', () => {
  
  it('debe tener estado inicial correcto', () => {
    expect(initialFlowState.personajes.estado).toBe('no_iniciada');
    expect(initialFlowState.cuento).toBe('no_iniciada');
    expect(initialFlowState.diseno).toBe('no_iniciada');
    expect(initialFlowState.vistaPrevia).toBe('no_iniciada');
  });

  it('debe permitir setear personajes', () => {
    const store = useWizardFlowStore.getState();
    
    // Test con 0 personajes
    store.setPersonajes(0);
    expect(store.estado.personajes.personajesAsignados).toBe(0);
    expect(store.estado.personajes.estado).toBe('no_iniciada');
    
    // Test con 2 personajes (borrador)
    store.setPersonajes(2);
    expect(store.estado.personajes.personajesAsignados).toBe(2);
    expect(store.estado.personajes.estado).toBe('borrador');
    
    // Test con 3+ personajes (completado)
    store.setPersonajes(4);
    expect(store.estado.personajes.personajesAsignados).toBe(4);
    expect(store.estado.personajes.estado).toBe('completado');
  });

  it('debe permitir avanzar etapas', () => {
    const store = useWizardFlowStore.getState();
    
    // Establecer personajes completos
    store.setPersonajes(3);
    expect(store.estado.personajes.estado).toBe('completado');
    
    // Avanzar cuento
    store.avanzarEtapa('cuento');
    expect(store.estado.cuento).toBe('completado');
    
    // Avanzar diseño
    store.avanzarEtapa('diseno');
    expect(store.estado.diseno).toBe('completado');
  });

  it('debe permitir setear estado completo', () => {
    const store = useWizardFlowStore.getState();
    const nuevoEstado = {
      personajes: { estado: 'completado' as const, personajesAsignados: 5 },
      cuento: 'completado' as const,
      diseno: 'borrador' as const,
      vistaPrevia: 'no_iniciada' as const
    };

    store.setEstadoCompleto(nuevoEstado);
    expect(store.estado).toEqual(nuevoEstado);
  });

  it('debe manejar story ID', () => {
    const store = useWizardFlowStore.getState();
    
    store.setStoryId('test-id-123');
    expect(store.currentStoryId).toBe('test-id-123');
    
    store.setStoryId(null);
    expect(store.currentStoryId).toBeNull();
  });
});