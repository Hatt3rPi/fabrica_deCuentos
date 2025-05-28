import { supabase } from '../../lib/supabase';

export interface PromptMetric {
  id: string;
  prompt_id: string;
  timestamp: string;
  modelo_ia: string;
  tiempo_respuesta_ms: number;
  estado: 'success' | 'error';
  tokens_entrada: number;
  tokens_salida: number;
  usuario_id?: string | null;
  metadatos?: Record<string, unknown> | null;
}

export const promptMetricsService = {
  async logMetric(metric: Omit<PromptMetric, 'id' | 'timestamp'> & { timestamp?: string }) {
    const { data, error } = await supabase
      .from('prompt_metrics')
      .insert({ ...metric, timestamp: metric.timestamp ?? new Date().toISOString() })
      .select('*')
      .single();
    if (error) throw error;
    return data as PromptMetric;
  },

  async fetchMetrics(options?: { prompt_id?: string; modelo_ia?: string }) {
    let query = supabase.from('prompt_metrics').select('*');
    if (options?.prompt_id) query = query.eq('prompt_id', options.prompt_id);
    if (options?.modelo_ia) query = query.eq('modelo_ia', options.modelo_ia);
    const { data, error } = await query.order('timestamp', { ascending: false });
    if (error) throw error;
    return data as PromptMetric[];
  },
};
