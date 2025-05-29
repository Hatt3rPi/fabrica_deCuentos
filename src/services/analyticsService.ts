import { supabase } from '../lib/supabase';
import {
  DateRange,
  GeneralUsageMetrics,
  PromptPerformanceMetric,
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
};
