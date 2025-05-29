import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { analyticsService } from '../../../services/analyticsService';
import {
  GeneralUsageMetrics,
  PromptPerformanceMetric,
  TokenUsage,
  ModelUsageMetric,
  ErrorBreakdownMetric,
  UserUsageMetric,
} from '../../../types/analytics';

const PromptAnalytics: React.FC = () => {
  const isAdmin = useAdmin();
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [general, setGeneral] = useState<GeneralUsageMetrics | null>(null);
  const [prompts, setPrompts] = useState<PromptPerformanceMetric[]>([]);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);
  const [models, setModels] = useState<ModelUsageMetric[]>([]);
  const [errors, setErrors] = useState<ErrorBreakdownMetric[]>([]);
  const [users, setUsers] = useState<UserUsageMetric[]>([]);

  const loadMetrics = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const range = {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      };
      const [g, p, t, m, e, u] = await Promise.all([
        analyticsService.fetchGeneralUsage(range),
        analyticsService.fetchPromptPerformance(range),
        analyticsService.fetchTokenUsage(range),
        analyticsService.fetchModelUsage(range),
        analyticsService.fetchErrorBreakdown(range),
        analyticsService.fetchUserUsage(range),
      ]);
      setGeneral(g);
      setPrompts(p);
      setTokens(t);
      setModels(m);
      setErrors(e);
      setUsers(u);
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
      {tokens && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-500">Tokens de entrada</p>
            <p className="text-xl font-semibold">{tokens.totalInputTokens}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-500">Tokens de salida</p>
            <p className="text-xl font-semibold">{tokens.totalOutputTokens}</p>
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
      {models.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Uso por modelo</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Modelo</th>
                  <th className="p-2">Ejecuciones</th>
                  <th className="p-2">% Éxito</th>
                  <th className="p-2">Prom. tokens in</th>
                  <th className="p-2">Prom. tokens out</th>
                  <th className="p-2">Prom. respuesta (ms)</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.model} className="border-t">
                    <td className="p-2">{m.model}</td>
                    <td className="p-2">{m.executions}</td>
                    <td className="p-2">
                      {((m.successCount / m.executions) * 100).toFixed(0)}%
                    </td>
                    <td className="p-2">{m.averageInputTokens.toFixed(1)}</td>
                    <td className="p-2">{m.averageOutputTokens.toFixed(1)}</td>
                    <td className="p-2">{Math.round(m.averageResponseMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {errors.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Clasificación de errores</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((er) => (
                  <tr key={er.status} className="border-t">
                    <td className="p-2">{er.status}</td>
                    <td className="p-2">{er.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {users.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Métricas por usuario</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Usuario</th>
                  <th className="p-2">Ejecuciones</th>
                  <th className="p-2">% Éxito</th>
                  <th className="p-2">Tokens in</th>
                  <th className="p-2">Tokens out</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId || 'unknown'} className="border-t">
                    <td className="p-2">{u.userId ?? 'Desconocido'}</td>
                    <td className="p-2">{u.executions}</td>
                    <td className="p-2">
                      {((u.successCount / u.executions) * 100).toFixed(0)}%
                    </td>
                    <td className="p-2">{u.totalInputTokens}</td>
                    <td className="p-2">{u.totalOutputTokens}</td>
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
