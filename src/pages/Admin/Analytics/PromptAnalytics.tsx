import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { analyticsService } from '../../../services/analyticsService';
import {
  GeneralUsageMetrics,
  PromptPerformanceMetric,
} from '../../../types/analytics';

const PromptAnalytics: React.FC = () => {
  const isAdmin = useAdmin();
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [general, setGeneral] = useState<GeneralUsageMetrics | null>(null);
  const [prompts, setPrompts] = useState<PromptPerformanceMetric[]>([]);

  const loadMetrics = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const range = {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      };
      const [g, p] = await Promise.all([
        analyticsService.fetchGeneralUsage(range),
        analyticsService.fetchPromptPerformance(range),
      ]);
      setGeneral(g);
      setPrompts(p);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [from, to]);

  if (!isAdmin) {
    return <p>No autorizado</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-sm">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <button
          onClick={loadMetrics}
          className="px-3 py-2 bg-purple-600 text-white rounded"
        >
          Filtrar
        </button>
      </div>
      {loading && <p>Cargando...</p>}
      {general && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-500">Usuarios activos</p>
            <p className="text-xl font-semibold">{general.activeUsers}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-500">Cuentos generados</p>
            <p className="text-xl font-semibold">{general.storiesGenerated}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-500">Personajes creados</p>
            <p className="text-xl font-semibold">{general.charactersCreated}</p>
          </div>
        </div>
      )}
      {prompts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Rendimiento de Prompts</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Prompt</th>
                  <th className="p-2">Ejecuciones</th>
                  <th className="p-2">Exitos</th>
                  <th className="p-2">% Éxito</th>
                  <th className="p-2">Prom. respuesta (ms)</th>
                </tr>
              </thead>
              <tbody>
                {prompts.map((p) => (
                  <tr key={p.promptId} className="border-t">
                    <td className="p-2">{p.promptType || p.promptId}</td>
                    <td className="p-2">{p.totalExecutions}</td>
                    <td className="p-2">{p.successCount}</td>
                    <td className="p-2">
                      {((p.successCount / p.totalExecutions) * 100).toFixed(0)}%
                    </td>
                    <td className="p-2">{Math.round(p.averageResponseMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptAnalytics;
