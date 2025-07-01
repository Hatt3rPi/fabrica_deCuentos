import React, { useState } from 'react';
import { Package, Calendar, CreditCard, ChevronDown, ChevronUp, User, Mail } from 'lucide-react';
import { OrderWithPayment, fulfillmentService } from '../../services/fulfillmentService';
import { EstadoFulfillment, ESTADOS_FULFILLMENT } from '../../types';
import Button from '../UI/Button';

interface OrderCardProps {
  order: OrderWithPayment;
  onUpdateStatus?: (orderId: string, status: EstadoFulfillment) => void;
  className?: string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onUpdateStatus,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Formatear precio
  const formatPrice = (amount: number, currency = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handler para actualizar estado
  const handleUpdateStatus = async (newStatus: EstadoFulfillment) => {
    if (!onUpdateStatus) return;

    try {
      setIsUpdating(true);
      await fulfillmentService.actualizarFulfillmentOrden(
        order.id,
        newStatus,
        `Actualización masiva desde admin`
      );
      onUpdateStatus(order.id, newStatus);
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Obtener estado visual de la orden
  const getOrderStatusBadge = () => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      paid: { label: 'Pagado', color: 'bg-green-100 text-green-800 border-green-200' },
      failed: { label: 'Fallido', color: 'bg-red-100 text-red-800 border-red-200' },
      refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      expired: { label: 'Expirado', color: 'bg-gray-100 text-gray-600 border-gray-200' }
    };

    const config = statusConfig[order.status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {/* Header de la orden */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Información principal */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">
                Orden #{order.id.slice(0, 8)}...
              </h3>
              {getOrderStatusBadge()}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              {/* Cliente */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{order.user_name || 'Usuario sin nombre'}</span>
              </div>
              
              {/* Email */}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="truncate">{order.user_email}</span>
              </div>
              
              {/* Tipo de orden */}
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>
                  {order.order_type === 'cart' && 'Carrito'}
                  {order.order_type === 'individual' && 'Individual'}
                  {order.order_type === 'subscription' && 'Suscripción'}
                </span>
              </div>
              
              {/* Fecha */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Total y acciones */}
          <div className="text-right">
            <div className="text-lg font-bold text-purple-600 mb-2">
              {formatPrice(order.total_amount, order.currency)}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Método de pago */}
              {order.payment_method && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CreditCard className="w-3 h-3" />
                  <span>{order.payment_method}</span>
                </div>
              )}
              
              {/* Botón expandir */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detalles expandidos */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {/* Items de la orden */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Historias en la orden ({order.items?.length || 0})
            </h4>
            
            {order.items && order.items.length > 0 ? (
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <div className="font-medium text-sm truncate">
                        {item.story_title || `Historia ${item.story_id.slice(0, 8)}...`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.product_type_name} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatPrice(item.total_price, order.currency)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay items en esta orden</p>
            )}
          </div>

          {/* Acciones de fulfillment */}
          {order.status === 'paid' && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Actualizar estado de fulfillment</h4>
              
              <div className="flex gap-2 flex-wrap">
                {Object.entries(ESTADOS_FULFILLMENT).map(([estado, config]) => (
                  <Button
                    key={estado}
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(estado as EstadoFulfillment)}
                    disabled={isUpdating}
                    className="text-xs"
                  >
                    {config.icon} {config.label}
                  </Button>
                ))}
              </div>
              
              {isUpdating && (
                <div className="mt-2 text-sm text-gray-500">
                  Actualizando estado de todas las historias...
                </div>
              )}
            </div>
          )}

          {/* Información de pago */}
          {order.paid_at && (
            <div className="mt-4 text-xs text-gray-500">
              Pagado el {formatDate(order.paid_at)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;