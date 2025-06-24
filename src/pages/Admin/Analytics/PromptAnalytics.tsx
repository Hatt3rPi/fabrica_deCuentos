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
import DateRangeSelector from '../../../components/Admin/DateRangeSelector';
import MetricCard from '../../../components/Admin/MetricCard';
import MiniChart from '../../../components/Admin/MiniChart';
import DualLineChart from '../../../components/Admin/DualLineChart';
import {
  UsersIcon,
  BookOpenIcon,
  UserGroupIcon,
  CpuChipIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

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
  const [dailyData, setDailyData] = useState<{ date: string; tokens: number; activeUsers: number }[]>([]);

  const loadMetrics = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      // Usar el rango de fechas seleccionado
      const range = {
        from: from ? new Date(from) : defaultFromDate,
        to: to ? new Date(to) : defaultToDate
      };
      
      const [g, p, t, m, e, u, d] = await Promise.all([
        analyticsService.fetchGeneralUsage(range),
        analyticsService.fetchPromptPerformance(range),
        analyticsService.fetchTokenUsage(range),
        analyticsService.fetchModelUsage(range),
        analyticsService.fetchErrorBreakdown(range),
        analyticsService.fetchUserUsage(range),
        analyticsService.fetchDailyMetrics(range),
      ]);
      setGeneral(g);
      setPrompts(p);
      setTokens(t);
      setModels(m);
      setErrors(e);
      setUsers(u);
      setDailyData(d);
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

  // Generar datos de ejemplo para mini gráficos
  const generateMiniChartData = (baseValue: number) => {
    return Array.from({ length: 7 }, (_, i) => ({
      value: Math.floor(baseValue * (0.7 + Math.random() * 0.6)),
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Analytics</h1>
            <p className="text-gray-600 mt-1">Panel de control y métricas de rendimiento</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <DateRangeSelector
          from={from}
          to={to}
          onChange={(newFrom, newTo) => {
            setFrom(newFrom);
            setTo(newTo);
          }}
          onApply={loadMetrics}
        />

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Cargando métricas...</span>
          </div>
        )}

        {/* Main Metrics Dashboard */}
        {general && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Usuarios Activos"
              value={general.activeUsers}
              change={{ value: 12, type: 'increase' }}
              icon={<UsersIcon className="w-6 h-6" />}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              miniChart={
                <MiniChart
                  data={generateMiniChartData(general.activeUsers)}
                  type="area"
                  color="#3b82f6"
                />
              }
            />
            <MetricCard
              title="Cuentos Generados"
              value={general.storiesGenerated}
              change={{ value: 8, type: 'increase' }}
              icon={<BookOpenIcon className="w-6 h-6" />}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
              miniChart={
                <MiniChart
                  data={generateMiniChartData(general.storiesGenerated / 10)}
                  type="bar"
                  color="#10b981"
                />
              }
            />
            <MetricCard
              title="Personajes Creados"
              value={general.charactersCreated}
              change={{ value: 15, type: 'increase' }}
              icon={<UserGroupIcon className="w-6 h-6" />}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
              miniChart={
                <MiniChart
                  data={generateMiniChartData(general.charactersCreated / 5)}
                  type="area"
                  color="#8b5cf6"
                />
              }
            />
            {tokens && (
              <MetricCard
                title="Total Tokens"
                value={formatNumber(tokens.totalInputTokens + tokens.totalOutputTokens)}
                change={{ value: 5, type: 'increase' }}
                icon={<CpuChipIcon className="w-6 h-6" />}
                iconBgColor="bg-orange-100"
                iconColor="text-orange-600"
                miniChart={
                  <MiniChart
                    data={generateMiniChartData((tokens.totalInputTokens + tokens.totalOutputTokens) / 1000)}
                    type="bar"
                    color="#f97316"
                  />
                }
              />
            )}
          </div>
        )}

        {/* Dual Line Chart */}
        <DualLineChart data={dailyData} loading={loading} />

        {/* Token Details */}
        {tokens && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
                Tokens de Entrada
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">{formatNumber(tokens.totalInputTokens)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Promedio:</span>
                  <span className="font-semibold">{formatNumber(tokens.averageInputTokens)}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-green-600" />
                Tokens de Salida
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">{formatNumber(tokens.totalOutputTokens)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Promedio:</span>
                  <span className="font-semibold">{formatNumber(tokens.averageOutputTokens)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prompt Performance */}
        {prompts.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CpuChipIcon className="w-5 h-5 text-purple-600" />
                Rendimiento de Prompts
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejecuciones</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa Éxito</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo (ms)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prompts.map((p, index) => (
                    <tr key={p.promptId || 'unknown'} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          {p.promptType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatNumber(p.totalExecutions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${
                              ((p.successCount / p.totalExecutions) * 100) >= 90 
                                ? 'bg-green-100 text-green-800' 
                                : ((p.successCount / p.totalExecutions) * 100) >= 70 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {((p.successCount / p.totalExecutions) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{formatNumber(p.totalInputTokens)}</div>
                          <div className="text-gray-500">({formatNumber(p.averageInputTokens)} avg)</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{formatNumber(p.totalOutputTokens)}</div>
                          <div className="text-gray-500">({formatNumber(p.averageOutputTokens)} avg)</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatNumber(Math.round(p.averageResponseMs))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Model Usage */}
        {models.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CpuChipIcon className="w-5 h-5 text-indigo-600" />
                Uso por Modelo IA
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {models.map((m) => (
                <div key={m.model} className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 truncate">{m.model}</h4>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      ((m.successCount / m.executions) * 100) >= 90 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {((m.successCount / m.executions) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ejecuciones:</span>
                      <span className="font-medium">{formatNumber(m.executions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tokens In:</span>
                      <span className="font-medium">{formatNumber(m.totalInputTokens)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tokens Out:</span>
                      <span className="font-medium">{formatNumber(m.totalOutputTokens)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiempo promedio:</span>
                      <span className="font-medium">{formatNumber(Math.round(m.averageResponseMs))}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Breakdown */}
        {errors.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                Clasificación de Errores
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {errors.map((er) => (
                  <div key={er.status} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-900">{er.status}</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">{formatNumber(er.count)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Metrics */}
        {users.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-teal-600" />
                Métricas por Usuario
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejecuciones</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa Éxito</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.slice(0, 10).map((u, index) => (
                    <tr key={u.userId || 'unknown'} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-teal-800">
                                {(u.userEmail || u.userId || 'U')?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {u.userEmail || u.userId || 'Desconocido'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {formatNumber(u.executions)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ((u.successCount / u.executions) * 100) >= 90 
                            ? 'bg-green-100 text-green-800' 
                            : ((u.successCount / u.executions) * 100) >= 70 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {((u.successCount / u.executions) * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{formatNumber(u.totalInputTokens + u.totalOutputTokens)}</div>
                          <div className="text-gray-500 text-xs">
                            In: {formatNumber(u.totalInputTokens)} | Out: {formatNumber(u.totalOutputTokens)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length > 10 && (
                <div className="bg-gray-50 px-6 py-3 text-center">
                  <span className="text-sm text-gray-500">Mostrando los primeros 10 usuarios de {users.length} total</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptAnalytics;