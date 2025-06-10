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

/* eslint-disable @typescript-eslint/no-explicit-any */

function applyDateFilter(query: any, column: string, range?: DateRange) {
  if (range?.from) {
    query = query.gte(column, range.from.toISOString());
  }
  if (range?.to) {
    query = query.lte(column, range.to.toISOString());
  }
  return query;
}

const PAGE_SIZE = 1000;

async function fetchAllRows(builder: (from: number, to: number) => any) {
  let page = 0;
  let all: any[] = [];
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await builder(
      page * PAGE_SIZE,
      (page + 1) * PAGE_SIZE - 1,
    );
    if (error) throw error;
    if (data && data.length > 0) {
      all = [...all, ...data];
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }
  return all;
}

export const analyticsService = {
  async fetchGeneralUsage(range?: DateRange): Promise<GeneralUsageMetrics> {
    const stories = await fetchAllRows((from, to) => {
      let q = supabase.from('stories').select('user_id').range(from, to);
      q = applyDateFilter(q, 'created_at', range);
      return q;
    });

    const { count: storiesCount } = await applyDateFilter(
      supabase.from('stories').select('*', { count: 'exact', head: true }),
      'created_at',
      range,
    );

    const { count: charactersCount } = await applyDateFilter(
      supabase.from('characters').select('*', { count: 'exact', head: true }),
      'created_at',
      range,
    );

    const activeUsers = new Set(stories.map((s: any) => s.user_id)).size;

    return {
      activeUsers,
      storiesGenerated: storiesCount || 0,
      charactersCreated: charactersCount || 0,
    };
  },

  async fetchPromptPerformance(range?: DateRange): Promise<PromptPerformanceMetric[]> {
    const data = await fetchAllRows((from, to) => {
      let q = supabase
        .from('prompt_metrics')
        .select(
          'prompt_id, tiempo_respuesta_ms, estado, tokens_entrada, tokens_salida, tokens_entrada_cacheados, tokens_salida_cacheados, prompts(type)'
        )
        .range(from, to);
      q = applyDateFilter(q, 'timestamp', range);
      return q;
    });

    const grouped: Record<string, PromptPerformanceMetric> = {};

    (data || []).forEach((item: any) => {
      const key = item.prompt_id || 'unknown';
      if (!grouped[key]) {
        grouped[key] = {
          promptId: item.prompt_id,
          promptType: item.prompts?.type ?? null,
          totalExecutions: 0,
          successCount: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          averageInputTokens: 0,
          averageOutputTokens: 0,
          averageResponseMs: 0,
          totalCachedInputTokens: 0,
          totalCachedOutputTokens: 0,
          averageCachedInputTokens: 0,
          averageCachedOutputTokens: 0,
        };
      }
      const metric = grouped[key];
      metric.totalExecutions++;
      if (item.estado === 'success') metric.successCount++;
      metric.totalInputTokens += item.tokens_entrada || 0;
      metric.totalOutputTokens += item.tokens_salida || 0;
      metric.totalCachedInputTokens += item.tokens_entrada_cacheados || 0;
      metric.totalCachedOutputTokens += item.tokens_salida_cacheados || 0;
      const prevAvg = metric.averageResponseMs;
      metric.averageResponseMs =
        (prevAvg * (metric.totalExecutions - 1) + (item.tiempo_respuesta_ms || 0)) /
        metric.totalExecutions;
      metric.averageInputTokens = metric.totalInputTokens / metric.totalExecutions;
      metric.averageOutputTokens = metric.totalOutputTokens / metric.totalExecutions;
      metric.averageCachedInputTokens = metric.totalCachedInputTokens / metric.totalExecutions;
      metric.averageCachedOutputTokens = metric.totalCachedOutputTokens / metric.totalExecutions;
    });

    return Object.values(grouped);
  },

  async fetchTokenUsage(range?: DateRange): Promise<TokenUsage> {
    const data = await fetchAllRows((from, to) => {
      let q = supabase
        .from('prompt_metrics')
        .select('tokens_entrada,tokens_salida')
        .range(from, to);
      q = applyDateFilter(q, 'timestamp', range);
      return q;
    });

    const { count } = await applyDateFilter(
      supabase.from('prompt_metrics').select('*', { count: 'exact', head: true }),
      'timestamp',
      range,
    );

    let totalInput = 0;
    let totalOutput = 0;
    (data || []).forEach((row: any) => {
      totalInput += row.tokens_entrada || 0;
      totalOutput += row.tokens_salida || 0;
    });

    const executions = count || (data ? data.length : 0);

    return {
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      averageInputTokens: executions ? totalInput / executions : 0,
      averageOutputTokens: executions ? totalOutput / executions : 0,
    };
  },

  async fetchModelUsage(range?: DateRange): Promise<ModelUsageMetric[]> {
    // Función para obtener todos los registros con paginación
    const fetchAllRecords = async () => {
      let allRecords: any[] = [];
      let page = 0;
      const pageSize = 1000; // Tamaño máximo de página de Supabase
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('prompt_metrics')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allRecords = [...allRecords, ...data];
          
          // Si obtuvimos menos registros que el tamaño de la página, es la última página
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      return allRecords;
    };

    const allRecords = await fetchAllRecords();
    
    // Aplicar filtro de fechas si es necesario
    let filteredRecords = allRecords;
    if (range) {
      filteredRecords = allRecords.filter((record: any) => {
        const recordDate = new Date(record.timestamp);
        return (!range.from || recordDate >= range.from) && 
               (!range.to || recordDate <= range.to);
      });
    }

    // Procesar los registros agrupados
    const grouped: Record<string, ModelUsageMetric> = {};
    
    // Usar los registros filtrados
    const data = filteredRecords;

    (data || []).forEach((row: any) => {
      const key = row.modelo_ia || 'unknown';
      if (!grouped[key]) {
        grouped[key] = {
          model: row.modelo_ia || 'unknown',
          executions: 0,
          successCount: 0,
          averageResponseMs: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          averageInputTokens: 0,
          averageOutputTokens: 0,
          totalCachedInputTokens: 0,
          totalCachedOutputTokens: 0,
          averageCachedInputTokens: 0,
          averageCachedOutputTokens: 0,
        };
      }
      const metric = grouped[key];
      metric.executions++;
      if (row.estado === 'success') metric.successCount++;

      metric.totalInputTokens += row.tokens_entrada || 0;
      metric.totalOutputTokens += row.tokens_salida || 0;
      metric.totalCachedInputTokens += row.tokens_entrada_cacheados || 0;
      metric.totalCachedOutputTokens += row.tokens_salida_cacheados || 0;

      metric.averageResponseMs =
        (metric.averageResponseMs * (metric.executions - 1) + (row.tiempo_respuesta_ms || 0)) /
        metric.executions;

      metric.averageInputTokens = metric.totalInputTokens / metric.executions;
      metric.averageOutputTokens = metric.totalOutputTokens / metric.executions;
      metric.averageCachedInputTokens = metric.totalCachedInputTokens / metric.executions;
      metric.averageCachedOutputTokens = metric.totalCachedOutputTokens / metric.executions;
    });

    return Object.values(grouped);
  },

  async fetchErrorBreakdown(range?: DateRange): Promise<ErrorBreakdownMetric[]> {

    const data = await fetchAllRows((from, to) => {
      let q = supabase.from('prompt_metrics')
        .select('estado, error_type')
        .range(from, to);
      q = applyDateFilter(q, 'timestamp', range);
      return q;
    });

    const counts: Record<string, number> = {};

    (data || []).forEach((row: any) => {      const key = row.error_type || row.estado || 'unknown';
      counts[key] = (counts[key] || 0) + 1;

    });

    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },

  async fetchUserUsage(range?: DateRange): Promise<UserUsageMetric[]> {
    // Primero, obtener todas las métricas
    const metrics = await fetchAllRows((from, to) => {
      let q = supabase
        .from('prompt_metrics')
        .select('usuario_id, estado, tokens_entrada, tokens_salida, tokens_entrada_cacheados, tokens_salida_cacheados, timestamp')
        .range(from, to);
      q = applyDateFilter(q, 'timestamp', range);
      return q;
    });

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
      } catch {
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
          averageInputTokens: 0,
          averageOutputTokens: 0,
          totalCachedInputTokens: 0,
          totalCachedOutputTokens: 0,
          averageCachedInputTokens: 0,
          averageCachedOutputTokens: 0,
        };
      }
      const metric = grouped[key];
      metric.executions++;
      if (row.estado === 'success') metric.successCount++;
      metric.totalInputTokens += row.tokens_entrada || 0;
      metric.totalOutputTokens += row.tokens_salida || 0;
      metric.totalCachedInputTokens += row.tokens_entrada_cacheados || 0;
      metric.totalCachedOutputTokens += row.tokens_salida_cacheados || 0;
      metric.averageInputTokens = metric.totalInputTokens / metric.executions;
      metric.averageOutputTokens = metric.totalOutputTokens / metric.executions;
      metric.averageCachedInputTokens = metric.totalCachedInputTokens / metric.executions;
      metric.averageCachedOutputTokens = metric.totalCachedOutputTokens / metric.executions;
    });

    return Object.values(grouped);
  },
};
