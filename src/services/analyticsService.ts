import { supabase } from '../lib/supabase';
import {
  DateRange,
  GeneralUsageMetrics,
  PromptPerformanceMetric,
  TokenUsage,
  ModelUsageMetric,
  ErrorBreakdownMetric,
  UserUsageMetric,
} from '../types/analytics';

function applyDateFilter(query: any, column: string, range?: DateRange) {
  if (range?.from) {
    query = query.gte(column, range.from.toISOString());
  }
  if (range?.to) {
    query = query.lte(column, range.to.toISOString());
  }
  return query;
}

export const analyticsService = {
  async fetchGeneralUsage(range?: DateRange): Promise<GeneralUsageMetrics> {
    let storiesQuery = supabase
      .from('stories')
      .select('id,user_id,created_at', { count: 'exact' });
    storiesQuery = applyDateFilter(storiesQuery, 'created_at', range);
    const { data: storiesData, count: storiesCount } = await storiesQuery;

    let charactersQuery = supabase
      .from('characters')
      .select('id,created_at', { count: 'exact' });
    charactersQuery = applyDateFilter(charactersQuery, 'created_at', range);
    const { count: charactersCount } = await charactersQuery;

    const activeUsers = new Set((storiesData || []).map((s: any) => s.user_id)).size;

    return {
      activeUsers,
      storiesGenerated: storiesCount || 0,
      charactersCreated: charactersCount || 0,
    };
  },

  async fetchPromptPerformance(range?: DateRange): Promise<PromptPerformanceMetric[]> {
    let query = supabase
      .from('prompt_metrics')
      .select('prompt_id, tiempo_respuesta_ms, estado, prompts(type)');
    query = applyDateFilter(query, 'timestamp', range);

    const { data, error } = await query;
    if (error) throw error;

    const grouped: Record<string, PromptPerformanceMetric> = {};

    (data || []).forEach((item: any) => {
      const key = item.prompt_id || 'unknown';
      if (!grouped[key]) {
        grouped[key] = {
          promptId: item.prompt_id,
          promptType: item.prompts?.type ?? null,
          totalExecutions: 0,
          successCount: 0,
          averageResponseMs: 0,
        };
      }
      const metric = grouped[key];
      metric.totalExecutions++;
      if (item.estado === 'success') metric.successCount++;
      const prevAvg = metric.averageResponseMs;
      metric.averageResponseMs =
        (prevAvg * (metric.totalExecutions - 1) + (item.tiempo_respuesta_ms || 0)) /
        metric.totalExecutions;
    });

    return Object.values(grouped);
  },

  async fetchTokenUsage(range?: DateRange): Promise<TokenUsage> {
    let query = supabase
      .from('prompt_metrics')
      .select('tokens_entrada,tokens_salida', { count: 'exact' });
    query = applyDateFilter(query, 'timestamp', range);

    const { data, error } = await query;
    if (error) throw error;

    let totalInput = 0;
    let totalOutput = 0;
    (data || []).forEach((row: any) => {
      totalInput += row.tokens_entrada || 0;
      totalOutput += row.tokens_salida || 0;
    });

    return { totalInputTokens: totalInput, totalOutputTokens: totalOutput };
  },

  async fetchModelUsage(range?: DateRange): Promise<ModelUsageMetric[]> {
    let query = supabase
      .from('prompt_metrics')
      .select(
        'modelo_ia, estado, tiempo_respuesta_ms, tokens_entrada, tokens_salida'
      );
    query = applyDateFilter(query, 'timestamp', range);

    const { data, error } = await query;
    if (error) throw error;

    const grouped: Record<string, ModelUsageMetric> = {};

    (data || []).forEach((row: any) => {
      const key = row.modelo_ia || 'unknown';
      if (!grouped[key]) {
        grouped[key] = {
          model: key,
          executions: 0,
          successCount: 0,
          averageResponseMs: 0,
          averageInputTokens: 0,
          averageOutputTokens: 0,
        };
      }
      const metric = grouped[key];
      metric.executions++;
      if (row.estado === 'success') metric.successCount++;

      metric.averageResponseMs =
        (metric.averageResponseMs * (metric.executions - 1) + (row.tiempo_respuesta_ms || 0)) /
        metric.executions;

      metric.averageInputTokens =
        (metric.averageInputTokens * (metric.executions - 1) + (row.tokens_entrada || 0)) /
        metric.executions;

      metric.averageOutputTokens =
        (metric.averageOutputTokens * (metric.executions - 1) + (row.tokens_salida || 0)) /
        metric.executions;
    });

    return Object.values(grouped);
  },

  async fetchErrorBreakdown(range?: DateRange): Promise<ErrorBreakdownMetric[]> {

    let query = supabase.from('prompt_metrics').select('estado, error_type');

    query = applyDateFilter(query, 'timestamp', range);

    const { data, error } = await query;
    if (error) throw error;

    const counts: Record<string, number> = {};

    (data || []).forEach((row: any) => {      const key = row.error_type || row.estado || 'unknown';
      counts[key] = (counts[key] || 0) + 1;

    });

    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },

  async fetchUserUsage(range?: DateRange): Promise<UserUsageMetric[]> {
    // Primero, obtener todas las métricas
    let query = supabase
      .from('prompt_metrics')
      .select('usuario_id, estado, tokens_entrada, tokens_salida, timestamp');
    query = applyDateFilter(query, 'timestamp', range);

    const { data: metrics, error } = await query;
    if (error) {
      console.error('Error al obtener métricas:', error);
      throw error;
    }
    if (!metrics) return [];

    // Obtener IDs de usuario únicos
    const userIds = [...new Set(metrics.map(m => m.usuario_id).filter(Boolean))];
    
    // Mapa de IDs a correos electrónicos
    const userEmails: Record<string, string> = {};
    
    // Si hay IDs de usuario, obtener sus correos usando la función de base de datos
    if (userIds.length > 0) {
      try {
        // Llamar a la función de base de datos
        const { data: userData, error: userError } = await supabase
          .rpc('get_user_emails', { 
            user_ids: userIds 
          });
        
        if (userError) {
          console.error('Error al obtener correos:', userError);
          throw userError;
        }
        
        // Mapear los resultados
        if (userData) {
          userData.forEach((user: { user_id: string; user_email: string }) => {
            if (user.user_id && user.user_email) {
              userEmails[user.user_id] = user.user_email;
            }
          });
        }
      } catch (err) {
        console.error('Error al obtener correos electrónicos:', err);
        // Si hay un error, usar el ID como fallback
        userIds.forEach(id => {
          if (id) userEmails[id] = id;
        });
      }
    }

    const grouped: Record<string, UserUsageMetric> = {};

    // Process the metrics data
    metrics.forEach((row) => {
      const key = row.usuario_id || 'unknown';
      if (!grouped[key]) {
        grouped[key] = {
          userId: row.usuario_id,
          userEmail: row.usuario_id ? userEmails[row.usuario_id] || null : null,
          executions: 0,
          successCount: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
        };
      }
      const metric = grouped[key];
      metric.executions++;
      if (row.estado === 'success') metric.successCount++;
      metric.totalInputTokens += row.tokens_entrada || 0;
      metric.totalOutputTokens += row.tokens_salida || 0;
    });

    return Object.values(grouped);
  },
};
