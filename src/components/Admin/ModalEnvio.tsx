import React, { useState, useEffect } from 'react';
import { X, Save, Package, User, MapPin, Phone, Mail, Truck, Calendar, History } from 'lucide-react';
import { CuentoConPedido, InformacionEnvio, ESTADOS_FULFILLMENT } from '../../types';
import { fulfillmentService } from '../../services/fulfillmentService';

interface ModalEnvioProps {
  pedido: CuentoConPedido;
  onClose: () => void;
  onUpdate: () => void;
}

const ModalEnvio: React.FC<ModalEnvioProps> = ({ pedido, onClose, onUpdate }) => {
  const [datosEnvio, setDatosEnvio] = useState<Partial<InformacionEnvio>>({
    recipient_name: '',
    recipient_phone: '',
    recipient_email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    region: '',
    postal_code: '',
    tracking_number: '',
    courier: '',
    delivery_notes: ''
  });
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatosEnvio();
  }, [pedido.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarDatosEnvio = async () => {
    try {
      setCargando(true);
      const info = await fulfillmentService.obtenerInformacionEnvio(pedido.id);
      if (info) {
        setDatosEnvio(info);
      } else {
        // Pre-llenar con datos del usuario si no hay info de envío
        setDatosEnvio(prev => ({
          ...prev,
          recipient_name: pedido.user_name || '',
          recipient_email: pedido.user_email || ''
        }));
      }
    } catch (error) {
      console.error('Error cargando datos de envío:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      await fulfillmentService.actualizarInformacionEnvio(pedido.id, datosEnvio);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error guardando datos de envío:', error);
    } finally {
      setGuardando(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Detalles del Pedido</h2>
              <p className="text-purple-200 text-sm">{pedido.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {cargando ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Estado actual */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-600" />
                  Estado del Pedido
                </h3>
                {pedido.fulfillment_status && (
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-full font-medium ${ESTADOS_FULFILLMENT[pedido.fulfillment_status].bgColor} ${ESTADOS_FULFILLMENT[pedido.fulfillment_status].color}`}>
                      {ESTADOS_FULFILLMENT[pedido.fulfillment_status].icon} {ESTADOS_FULFILLMENT[pedido.fulfillment_status].label}
                    </div>
                    <span className="text-sm text-gray-600">
                      Completado: {formatearFecha(pedido.completed_at)}
                    </span>
                  </div>
                )}
              </div>

              {/* Información del cliente */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del destinatario
                    </label>
                    <input
                      type="text"
                      value={datosEnvio.recipient_name || ''}
                      onChange={(e) => setDatosEnvio({ ...datosEnvio, recipient_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        value={datosEnvio.recipient_phone || ''}
                        onChange={(e) => setDatosEnvio({ ...datosEnvio, recipient_phone: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        value={datosEnvio.recipient_email || ''}
                        onChange={(e) => setDatosEnvio({ ...datosEnvio, recipient_email: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dirección de envío */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  Dirección de Envío
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección línea 1
                    </label>
                    <input
                      type="text"
                      value={datosEnvio.address_line1 || ''}
                      onChange={(e) => setDatosEnvio({ ...datosEnvio, address_line1: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección línea 2 (opcional)
                    </label>
                    <input
                      type="text"
                      value={datosEnvio.address_line2 || ''}
                      onChange={(e) => setDatosEnvio({ ...datosEnvio, address_line2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={datosEnvio.city || ''}
                        onChange={(e) => setDatosEnvio({ ...datosEnvio, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Región
                      </label>
                      <input
                        type="text"
                        value={datosEnvio.region || ''}
                        onChange={(e) => setDatosEnvio({ ...datosEnvio, region: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        value={datosEnvio.postal_code || ''}
                        onChange={(e) => setDatosEnvio({ ...datosEnvio, postal_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de tracking */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gray-600" />
                  Información de Envío
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Tracking
                    </label>
                    <input
                      type="text"
                      value={datosEnvio.tracking_number || ''}
                      onChange={(e) => setDatosEnvio({ ...datosEnvio, tracking_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Courier
                    </label>
                    <select
                      value={datosEnvio.courier || ''}
                      onChange={(e) => setDatosEnvio({ ...datosEnvio, courier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar courier...</option>
                      <option value="Chilexpress">Chilexpress</option>
                      <option value="Starken">Starken</option>
                      <option value="Correos de Chile">Correos de Chile</option>
                      <option value="Bluexpress">Bluexpress</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas de entrega
                </label>
                <textarea
                  value={datosEnvio.delivery_notes || ''}
                  onChange={(e) => setDatosEnvio({ ...datosEnvio, delivery_notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Instrucciones especiales, referencias, etc."
                />
              </div>

              {/* Historial */}
              {pedido.history && pedido.history.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    Historial de Cambios
                  </h3>
                  <div className="space-y-2">
                    {pedido.history.map((cambio, index) => (
                      <div key={index} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {cambio.from_status ? ESTADOS_FULFILLMENT[cambio.from_status].label : 'Inicio'}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium">
                              {ESTADOS_FULFILLMENT[cambio.to_status].label}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            {formatearFecha(cambio.created_at)}
                            {cambio.notes && <span className="ml-2">- {cambio.notes}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEnvio;