import React, { useState } from 'react';
import { ChevronRight, Calendar, User, Mail, MapPin, Truck, Clock, FileText } from 'lucide-react';
import { CuentoConPedido, EstadoFulfillment, ESTADOS_FULFILLMENT } from '../../types';

interface TarjetaPedidoProps {
  pedido: CuentoConPedido;
  onActualizarEstado: (pedidoId: string, nuevoEstado: EstadoFulfillment, notas?: string) => Promise<void>;
  onVerDetalles: () => void;
  actualizando: boolean;
}

const TarjetaPedido: React.FC<TarjetaPedidoProps> = ({
  pedido,
  onActualizarEstado,
  onVerDetalles,
  actualizando
}) => {
  const [mostrarCambioEstado, setMostrarCambioEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoFulfillment | ''>('');
  const [notasCambio, setNotasCambio] = useState('');

  // Debug temporal para verificar export_url
  console.log(`[TarjetaPedido] Pedido ${pedido.id}: export_url =`, pedido.export_url);

  const estadoConfig = pedido.fulfillment_status 
    ? ESTADOS_FULFILLMENT[pedido.fulfillment_status]
    : null;

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) return;

    await onActualizarEstado(pedido.id, nuevoEstado, notasCambio);
    setMostrarCambioEstado(false);
    setNuevoEstado('');
    setNotasCambio('');
  };

  const handleVerPDF = () => {
    if (pedido.export_url) {
      window.open(pedido.export_url, '_blank');
    }
  };

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular días desde completado
  const diasDesdeCompletado = pedido.completed_at 
    ? Math.floor((Date.now() - new Date(pedido.completed_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header con estado */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {pedido.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {pedido.user_name || 'Usuario'}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {pedido.user_email}
              </span>
            </div>
          </div>

          {estadoConfig && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${estadoConfig.bgColor} ${estadoConfig.color}`}>
              <span className="mr-1">{estadoConfig.icon}</span>
              {estadoConfig.label}
            </div>
          )}
        </div>

        {/* Información del pedido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Completado:</span>
            <span className="font-medium">{formatearFecha(pedido.completed_at)}</span>
          </div>

          {pedido.shipping_info?.city && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Destino:</span>
              <span className="font-medium">
                {pedido.shipping_info.city}, {pedido.shipping_info.region}
              </span>
            </div>
          )}

          {pedido.shipping_info?.tracking_number && (
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Tracking:</span>
              <span className="font-medium font-mono">
                {pedido.shipping_info.tracking_number}
              </span>
            </div>
          )}
        </div>

        {/* Alerta de tiempo */}
        {pedido.fulfillment_status === 'pendiente' && diasDesdeCompletado > 2 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Pedido pendiente hace {diasDesdeCompletado} días
            </span>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t">
          {!mostrarCambioEstado ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMostrarCambioEstado(true)}
                  className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                  disabled={actualizando}
                >
                  Cambiar estado
                </button>
                
                {pedido.export_url && (
                  <button
                    onClick={handleVerPDF}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver PDF del cuento"
                  >
                    <FileText className="w-4 h-4" />
                    Ver PDF
                  </button>
                )}
              </div>
              
              <button
                onClick={onVerDetalles}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Ver detalles
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value as EstadoFulfillment)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="">Seleccionar estado...</option>
                  {Object.entries(ESTADOS_FULFILLMENT)
                    .filter(([key]) => key !== pedido.fulfillment_status)
                    .map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                </select>
                
                <button
                  onClick={handleCambiarEstado}
                  disabled={!nuevoEstado || actualizando}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Confirmar
                </button>
                
                <button
                  onClick={() => {
                    setMostrarCambioEstado(false);
                    setNuevoEstado('');
                    setNotasCambio('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Notas del cambio (opcional)"
                value={notasCambio}
                onChange={(e) => setNotasCambio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TarjetaPedido;