import { supabase } from '../lib/supabase';
import fs from 'fs/promises';
import path from 'path';

export type EtapaEstado = 'no_iniciada' | 'borrador' | 'completado';

export interface WizardState {
  '1.personajes': { estado: EtapaEstado; personajesAsignados: number };
  '2.cuento': { estado: EtapaEstado };
  '3.diseno': { estado: EtapaEstado };
  '4.vistaPrevia': { estado: EtapaEstado };
}

export const INITIAL_WIZARD_STATE: WizardState = {
  '1.personajes': { estado: 'no_iniciada', personajesAsignados: 0 },
  '2.cuento': { estado: 'no_iniciada' },
  '3.diseno': { estado: 'no_iniciada' },
  '4.vistaPrevia': { estado: 'no_iniciada' },
};

const cacheDir = path.resolve(process.cwd(), '.cache');

async function readCache(storyId: string): Promise<WizardState | null> {
  try {
    const file = path.join(cacheDir, `wizard-${storyId}.json`);
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data) as WizardState;
  } catch {
    return null;
  }
}

async function writeCache(storyId: string, state: WizardState) {
  await fs.mkdir(cacheDir, { recursive: true });
  const file = path.join(cacheDir, `wizard-${storyId}.json`);
  await fs.writeFile(file, JSON.stringify(state));
}

async function fetchFromDb(storyId: string): Promise<WizardState> {
  const { data, error } = await supabase
    .from('stories')
    .select('wizard_state')
    .eq('id', storyId)
    .single();
  if (error) throw error;
  return (data?.wizard_state as WizardState) || INITIAL_WIZARD_STATE;
}

export function applyAction(state: WizardState, accion: string): WizardState {
  const s = JSON.parse(JSON.stringify(state)) as WizardState;
  switch (accion) {
    case 'asignar_personaje':
      if (s['1.personajes'].estado === 'completado') {
        throw new Error('Etapa de personajes ya completada');
      }
      s['1.personajes'].personajesAsignados += 1;
      if (s['1.personajes'].estado === 'no_iniciada') {
        s['1.personajes'].estado = 'borrador';
      }
      break;
    case 'siguiente_personajes':
      if (s['1.personajes'].personajesAsignados < 3) {
        throw new Error('Debe asignar al menos 3 personajes');
      }
      s['1.personajes'].estado = 'completado';
      if (s['2.cuento'].estado === 'no_iniciada') {
        s['2.cuento'].estado = 'borrador';
      }
      break;
    case 'siguiente_cuento':
      if (s['1.personajes'].estado !== 'completado') {
        throw new Error('La etapa de personajes no está completa');
      }
      if (s['2.cuento'].estado === 'completado') {
        throw new Error('Etapa cuento ya completada');
      }
      s['2.cuento'].estado = 'completado';
      if (s['3.diseno'].estado === 'no_iniciada') {
        s['3.diseno'].estado = 'borrador';
      }
      break;
    case 'siguiente_diseno':
      if (s['2.cuento'].estado !== 'completado') {
        throw new Error('La etapa de cuento no está completa');
      }
      if (s['3.diseno'].estado === 'completado') {
        throw new Error('Etapa diseño ya completada');
      }
      s['3.diseno'].estado = 'completado';
      if (s['4.vistaPrevia'].estado === 'no_iniciada') {
        s['4.vistaPrevia'].estado = 'borrador';
      }
      break;
    case 'siguiente_vistaPrevia':
      if (s['3.diseno'].estado !== 'completado') {
        throw new Error('La etapa de diseño no está completa');
      }
      s['4.vistaPrevia'].estado = 'completado';
      break;
    default:
      throw new Error(`Acción desconocida: ${accion}`);
  }
  console.log('[WizardManager]', accion, s);
  return s;
}

export async function actualizarWizardState(
  storyId: string,
  accion: string,
): Promise<void> {
  let state = (await readCache(storyId)) ?? (await fetchFromDb(storyId));
  state = applyAction(state, accion);
  const { error } = await supabase
    .from('stories')
    .update({ wizard_state: state })
    .eq('id', storyId);
  if (error) throw error;
  await writeCache(storyId, state);
}

export async function continuarCuento(storyId: string): Promise<string> {
  const state = await fetchFromDb(storyId);
  await writeCache(storyId, state);
  const orden: (keyof WizardState)[] = [
    '1.personajes',
    '2.cuento',
    '3.diseno',
    '4.vistaPrevia',
  ];
  for (const etapa of orden) {
    if (state[etapa].estado === 'borrador') return etapa;
  }
  return '1.personajes';
}
