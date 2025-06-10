import { describe, it, expect, vi, beforeEach } from 'vitest';

let insert: ReturnType<typeof vi.fn>;
let select: ReturnType<typeof vi.fn>;
let single: ReturnType<typeof vi.fn>;
let order: ReturnType<typeof vi.fn>;
let eq: ReturnType<typeof vi.fn>;
let from: ReturnType<typeof vi.fn>;

vi.mock('../../../lib/supabase', () => {
  insert = vi.fn();
  select = vi.fn();
  single = vi.fn();
  order = vi.fn();
  eq = vi.fn();
  const chain = { insert, select, single, order, eq };
  from = vi.fn(() => chain);
  return {
    supabase: { from }
  };
});

import { promptMetricsService } from '../promptMetricsService';


describe.skip('promptMetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logMetric inserts metric and returns created record', async () => {
    const mockData = { id: '1' };
    single.mockResolvedValue({ data: mockData, error: null });
    const result = await promptMetricsService.logMetric({
      prompt_id: 'p',
      modelo_ia: 'gpt',
      tiempo_respuesta_ms: 10,
      estado: 'success',
      tokens_entrada: 1,
      tokens_salida: 2,
    });
    expect(from).toHaveBeenCalledWith('prompt_metrics');
    expect(insert).toHaveBeenCalled();
    expect(select).toHaveBeenCalled();
    expect(single).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  it('fetchMetrics returns list', async () => {
    const mockData = [{ id: '1' }];
    order.mockResolvedValue({ data: mockData, error: null });
    const result = await promptMetricsService.fetchMetrics();
    expect(from).toHaveBeenCalledWith('prompt_metrics');
    expect(select).toHaveBeenCalled();
    expect(order).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });
});
