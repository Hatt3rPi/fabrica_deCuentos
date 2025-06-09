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
import { formatNumber } from '../../../lib/formatNumber';

const PromptAnalytics: React.FC = () => {
  const isAdmin = useAdmin();
  // Establecer rango por defecto: desde 1 de enero de 2025 hasta hoy
  const defaultFromDate = new Date(2025, 0, 1); // Enero es 0 en JavaScript
  const defaultToDate = new Date();
  
  const [from, setFrom] = useState<string>(defaultFromDate.toISOString().split('T')[0]);
  const [to, setTo] = useState<string>(defaultToDate.toISOString().split('T')[0]);
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
      // Usar el rango de fechas seleccionado
      const range = {
        from: from ? new Date(from) : defaultFromDate,
        to: to ? new Date(to) : defaultToDate
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
            <p className="text-xl font-semibold">{formatNumber(general.activeUsers)}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-500">Cuentos generados</p>
            <p className="text-xl font-semibold">{formatNumber(general.storiesGenerated)}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-500">Personajes creados</p>
            <p className="text-xl font-semibold">{formatNumber(general.charactersCreated)}</p>
          </div>
        </div>
      )}
      {tokens && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-500">Tokens de entrada</p>
            <p className="text-xl font-semibold">
              {formatNumber(tokens.totalInputTokens)} ({formatNumber(tokens.averageInputTokens)})
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-500">Tokens de salida</p>
            <p className="text-xl font-semibold">
              {formatNumber(tokens.totalOutputTokens)} ({formatNumber(tokens.averageOutputTokens)})
            </p>
          </div>
        </div>
      )}
      {prompts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Rendimiento de prompts</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Ejecuciones</th>
                  <th className="p-2">Tasa éxito</th>
                  <th className="p-2">Tokens in</th>
                  <th className="p-2">Tokens out</th>
                  <th className="p-2">Tokens cacheados</th>
                  <th className="p-2">Prom. respuesta (ms)</th>
                </tr>
              </thead>
              <tbody>
                {prompts.map((p) => (
                  <tr key={p.promptId || 'unknown'} className="border-t">
                    <td className="p-2">{p.promptType || 'N/A'}</td>
                    <td className="p-2">{formatNumber(p.totalExecutions)}</td>
                    <td className="p-2">
                      {((p.successCount / p.totalExecutions) * 100).toFixed(0)}%
                    </td>
                    <td className="p-2">
                      {formatNumber(p.totalInputTokens)} ({formatNumber(p.averageInputTokens)})
                    </td>
                    <td className="p-2">
                      {formatNumber(p.totalOutputTokens)} ({formatNumber(p.averageOutputTokens)})
                    </td>
                    <td className="p-2">
                      {formatNumber(p.totalCachedInputTokens)} ({formatNumber(p.averageCachedInputTokens)})
                    </td>
                    <td className="p-2">{formatNumber(Math.round(p.averageResponseMs))}</td>
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
                  <th className="p-2">Tasa éxito</th>
                  <th className="p-2">Tokens in</th>
                  <th className="p-2">Tokens out</th>
                  <th className="p-2">Tokens cacheados</th>
                  <th className="p-2">Prom. respuesta (ms)</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.model} className="border-t">
                    <td className="p-2">{m.model}</td>
                    <td className="p-2">{formatNumber(m.executions)}</td>
                    <td className="p-2">
                      {((m.successCount / m.executions) * 100).toFixed(0)}%
                    </td>
                    <td className="p-2">
                      {formatNumber(m.totalInputTokens)} ({formatNumber(m.averageInputTokens)})
                    </td>
                    <td className="p-2">
                      {formatNumber(m.totalOutputTokens)} ({formatNumber(m.averageOutputTokens)})
                    </td>
                    <td className="p-2">
                      {formatNumber(m.totalCachedInputTokens)}
                    </td>
                    <td className="p-2">{formatNumber(Math.round(m.averageResponseMs))}</td>
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
                    <td className="p-2">{formatNumber(er.count)}</td>
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
                  <th className="p-2">Tasa éxito</th>
                  <th className="p-2">Tokens in</th>
                  <th className="p-2">Tokens out</th>
                  <th className="p-2">Tokens cacheados</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId || 'unknown'} className="border-t">
                    <td className="p-2">{u.userEmail || u.userId || 'Desconocido'}</td>
                    <td className="p-2">{formatNumber(u.executions)}</td>
                    <td className="p-2">
                      {((u.successCount / u.executions) * 100).toFixed(0)}%
                    </td>
                    <td className="p-2">
                      {formatNumber(u.totalInputTokens)} ({formatNumber(u.averageInputTokens)})
                    </td>
                    <td className="p-2">
                      {formatNumber(u.totalOutputTokens)} ({formatNumber(u.averageOutputTokens)})
                    </td>
                    <td className="p-2">
                      {formatNumber(u.totalCachedInputTokens)} ({formatNumber(u.averageCachedInputTokens)})
                    </td>
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
