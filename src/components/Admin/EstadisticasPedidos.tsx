import React from 'react';
import { Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { EstadoFulfillment, ESTADOS_FULFILLMENT } from '../../types';

interface EstadisticasPedidosProps {
  estadisticas: {
    total: number;
    porEstado: Record<EstadoFulfillment, number>;
    pendientes: number;
  };
}

const EstadisticasPedidos: React.FC<EstadisticasPedidosProps> = ({ estadisticas }) => {
  // Calcular porcentaje de completados (entregados)
  const entregados = estadisticas.porEstado.entregado || 0;
  const porcentajeCompletados = estadisticas.total > 0 
    ? Math.round((entregados / estadisticas.total) * 100)
    : 0;

  // Calcular pedidos en proceso (imprimiendo + enviando)
  const enProceso = (estadisticas.porEstado.imprimiendo || 0) + 
                    (estadisticas.porEstado.enviando || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total de pedidos */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{estadisticas.total}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-lg">
            <Package className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Pedidos pendientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{estadisticas.pendientes}</p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        {estadisticas.pendientes > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-yellow-700">Requieren atención</p>
          </div>
        )}
      </div>

      {/* En proceso */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">En Proceso</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{enProceso}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <div className="w-6 h-6 relative">
              <div className="absolute inset-0 rounded-full border-2 border-blue-600 animate-spin border-t-transparent"></div>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          {estadisticas.porEstado.imprimiendo || 0} imprimiendo, {estadisticas.porEstado.enviando || 0} enviando
        </div>
      </div>

      {/* Tasa de completados */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Completados</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{porcentajeCompletados}%</p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${porcentajeCompletados}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">{entregados} de {estadisticas.total}</p>
        </div>
      </div>

      {/* Desglose por estado */}
      <div className="md:col-span-4 bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Distribución por Estado</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(ESTADOS_FULFILLMENT).map(([key, config]) => {
            const cantidad = estadisticas.porEstado[key as EstadoFulfillment] || 0;
            const porcentaje = estadisticas.total > 0 
              ? Math.round((cantidad / estadisticas.total) * 100)
              : 0;

            return (
              <div key={key} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${config.bgColor} mb-2`}>
                  <span className="text-2xl">{config.icon}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{cantidad}</p>
                <p className="text-xs text-gray-600">{config.label}</p>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${config.bgColor}`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EstadisticasPedidos;