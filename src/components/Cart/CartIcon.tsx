import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartOperations } from '../../contexts/CartContext';

interface CartIconProps {
  onClick: () => void;
  className?: string;
}

const CartIcon: React.FC<CartIconProps> = ({ onClick, className = '' }) => {
  const { totalItems, isLoading } = useCartOperations();
  
  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors ${className}`}
      aria-label={`Carrito de compras (${totalItems} items)`}
    >
      <ShoppingCart className="w-6 h-6" />
      
      {/* Badge con contador */}
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
      
      {/* Indicador de carga */}
      {isLoading && (
        <span className="absolute -top-1 -right-1 animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></span>
      )}
    </button>
  );
};

export default CartIcon;