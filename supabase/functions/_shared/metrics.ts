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
  error_type?: string | null;
  tokens_entrada?: number;
  tokens_salida?: number;
  usuario_id?: string | null;
  metadatos?: Record<string, unknown> | null;
  actividad?: string | null;
  edge_function?: string | null;
}

export async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error) {
      console.error('[metrics] failed to get user:', error.message);
      return null;
    }
    return data.user?.id ?? null;
  } catch (err) {
    console.error('[metrics] error getting user id:', err);
    return null;
  }
}

export async function logPromptMetric(metric: PromptMetric) {
  const { error } = await supabaseAdmin.from('prompt_metrics').insert(metric);
  if (error) {
    console.error('[metrics] failed to insert metric:', error.message);
  }
}
