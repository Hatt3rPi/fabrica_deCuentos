import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyAction, INITIAL_WIZARD_STATE, EtapaEstado } from '../wizardManager';

function clone() {
  return JSON.parse(JSON.stringify(INITIAL_WIZARD_STATE));
}

describe('applyAction', () => {
  let state: ReturnType<typeof clone>;
  beforeEach(() => {
    state = clone();
  });

  it('asigna personajes y pasa a borrador', () => {
    const result = applyAction(state, 'asignar_personaje');
    expect(result['1.personajes'].personajesAsignados).toBe(1);
    expect(result['1.personajes'].estado).toBe('borrador');
  });

  it('completa personajes y habilita cuento', () => {
    state['1.personajes'].personajesAsignados = 3;
    state['1.personajes'].estado = 'borrador';
    const result = applyAction(state, 'siguiente_personajes');
    expect(result['1.personajes'].estado).toBe('completado');
    expect(result['2.cuento'].estado).toBe('borrador');
  });

  it('no permite completar cuento sin personajes', () => {
    expect(() => applyAction(state, 'siguiente_cuento')).toThrow();
  });

  it('flujo completo secuencial', () => {
    state['1.personajes'].personajesAsignados = 3;
    state = applyAction(state, 'siguiente_personajes');
    state = applyAction(state, 'siguiente_cuento');
    state = applyAction(state, 'siguiente_diseno');
    state = applyAction(state, 'siguiente_vistaPrevia');
    expect(state['4.vistaPrevia'].estado).toBe('completado');
  });
});
