import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promptMetricsService } from '../promptMetricsService';

const insert = vi.fn();
const select = vi.fn();
const single = vi.fn();
const order = vi.fn();
const eq = vi.fn();
const chain = { insert, select, single, order, eq };
const from = vi.fn(() => chain);

vi.mock('../../../lib/supabase', () => ({
  supabase: { from }
}));


describe('promptMetricsService', () => {
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
