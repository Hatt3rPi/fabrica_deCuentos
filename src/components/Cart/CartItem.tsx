import React, { useState } from 'react';
import { Minus, Plus, Trash2, BookOpen } from 'lucide-react';
import { CartItem as CartItemType } from '../../hooks/state-management/useCartStore';
import { useCartOperations } from '../../contexts/CartContext';
import Button from '../UI/Button';
import ConfirmDialog from '../UI/ConfirmDialog';

interface CartItemProps {
  item: CartItemType;
  className?: string;
}

const CartItem: React.FC<CartItemProps> = ({ item, className = '' }) => {
  const { updateQuantity, removeItem, formatPrice, isLoading } = useCartOperations();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handler para cambio de cantidad con optimistic UI
  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setIsUpdating(true);
      updateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler para eliminar item
  const handleRemove = () => {
    try {
      removeItem(item.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleIncrement = () => handleQuantityChange(item.quantity + 1);
  const handleDecrement = () => handleQuantityChange(item.quantity - 1);

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:shadow-md ${className}`}>
        <div className="flex items-start gap-4">
          {/* Thumbnail o ícono */}
          <div className="flex-shrink-0">
            {item.storyThumbnail ? (
              <img
                src={item.storyThumbnail}
                alt={`Portada de ${item.storyTitle}`}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
            )}
          </div>

          {/* Información del item */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">
              {item.storyTitle}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {item.productTypeName}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatPrice(item.unitPrice)} c/u
            </p>
          </div>

          {/* Controles y precio */}
          <div className="flex flex-col items-end gap-2">
            {/* Precio total */}
            <div className="font-semibold text-lg text-purple-600">
              {formatPrice(item.totalPrice)}
            </div>

            {/* Controles de cantidad */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecrement}
                disabled={item.quantity <= 1 || isUpdating || isLoading}
                className="w-8 h-8 p-0 flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <span className="w-8 text-center font-medium">
                {item.quantity}
              </span>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleIncrement}
                disabled={isUpdating || isLoading}
                className="w-8 h-8 p-0 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Botón eliminar */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Indicador de carga */}
        {(isUpdating || isLoading) && (
          <div className="mt-2 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-sm text-gray-500">Actualizando...</span>
          </div>
        )}
      </div>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Eliminar del carrito"
        message={`¿Estás seguro que deseas eliminar "${item.storyTitle}" del carrito?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleRemove}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};

export default CartItem;