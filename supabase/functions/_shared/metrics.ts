import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface PromptMetric {
  prompt_id?: string;
  modelo_ia: string;
  tiempo_respuesta_ms: number;
  estado: 'success' | 'error';
  tokens_entrada?: number;
  tokens_salida?: number;
  usuario_id?: string | null;
  metadatos?: Record<string, unknown> | null;
}

export async function logPromptMetric(metric: PromptMetric) {
  const { error } = await supabaseAdmin.from('prompt_metrics').insert(metric);
  if (error) {
    console.error('[metrics] failed to insert metric:', error.message);
  }
}
