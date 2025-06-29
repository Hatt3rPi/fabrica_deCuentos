import React from 'react';
import { X, ShoppingCart as ShoppingCartIcon, ArrowRight, Trash2 } from 'lucide-react';
import { useCartOperations } from '../../contexts/CartContext';
import { useAuth } from '../../context/AuthContext';
import CartItem from './CartItem';
import Button from '../UI/Button';
import ConfirmDialog from '../UI/ConfirmDialog';
import CheckoutModal from './CheckoutModal';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void; // Opcional, usaremos CheckoutModal internamente
  className?: string;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  isOpen,
  onClose,
  onCheckout,
  className = ''
}) => {
  const { user } = useAuth();
  const {
    items,
    totalItems,
    totalPrice,
    isEmpty,
    isLoading,
    error,
    clearCart,
    canCheckout,
    formatPrice
  } = useCartOperations();

  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = React.useState(false);

  // Handler para limpiar carrito
  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  // Handler para checkout
  const handleCheckout = () => {
    if (!canCheckout) return;
    
    // Usar callback personalizado si se proporciona, sino usar modal interno
    if (onCheckout) {
      onCheckout();
    } else {
      setShowCheckoutModal(true);
    }
  };

  // Handler para éxito del checkout
  const handleCheckoutSuccess = (_orderId: string) => {
    // Orden completada
    setShowCheckoutModal(false);
    onClose(); // Cerrar carrito después del éxito
  };

  // No renderizar si no está abierto
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Panel del carrito */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold">
              Carrito ({totalItems})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del carrito */}
        <div className="flex-1 overflow-y-auto">
          {/* Mensaje de error */}
          {error && (
            <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Mensaje de no autenticado */}
          {!user && (
            <div className="m-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">
                Debes iniciar sesión para usar el carrito de compras.
              </p>
            </div>
          )}

          {/* Carrito vacío */}
          {isEmpty && user && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <ShoppingCartIcon className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tu carrito está vacío
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Agrega algunas historias para comenzar tu pedido
              </p>
              <Button onClick={onClose} variant="outline">
                Explorar historias
              </Button>
            </div>
          )}

          {/* Lista de items */}
          {!isEmpty && user && (
            <div className="p-4 space-y-3">
              {items.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer con resumen y acciones */}
        {!isEmpty && user && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Botón limpiar carrito */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                disabled={isLoading}
                className="text-gray-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Limpiar carrito
              </Button>
            </div>

            {/* Resumen de precios */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío:</span>
                <span className="text-green-600">Gratis</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-purple-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Botón de checkout */}
            <Button
              onClick={handleCheckout}
              disabled={!canCheckout || isLoading}
              className="w-full flex items-center justify-center gap-2"
              isLoading={isLoading}
            >
              {!isLoading && (
                <>
                  Proceder al pago
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {/* Nota sobre seguridad */}
            <p className="text-xs text-gray-500 text-center">
              🔒 Transacción segura y protegida
            </p>
          </div>
        )}
      </div>

      {/* Diálogo de confirmación para limpiar carrito */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Limpiar carrito"
        message="¿Estás seguro que deseas eliminar todos los elementos del carrito?"
        confirmLabel="Limpiar"
        cancelLabel="Cancelar"
        onConfirm={handleClearCart}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Modal de checkout */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onSuccess={handleCheckoutSuccess}
      />
    </>
  );
};

export default ShoppingCart;