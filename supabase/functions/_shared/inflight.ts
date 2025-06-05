import { supabaseAdmin } from './metrics.ts';

export async function startInflightCall(params: {
  user_id: string | null;
  etapa: string;
  actividad: string;
  modelo: string;
  input: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from('inflight_calls').insert({
    user_id: params.user_id,
    etapa: params.etapa,
    actividad: params.actividad,
    modelo: params.modelo,
    input: params.input,
  });
  if (error) {
    console.error('[inflight] failed to insert:', error.message);
  }
}

export async function endInflightCall(user_id: string | null, actividad: string) {
  if (!user_id) return;
  const { error } = await supabaseAdmin
    .from('inflight_calls')
    .delete()
    .eq('user_id', user_id)
    .eq('actividad', actividad);
  if (error) {
    console.error('[inflight] failed to delete:', error.message);
  }
}
