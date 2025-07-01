import React from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useAddToCart } from '../../hooks/useAddToCart';
import Button from '../UI/Button';

interface AddToCartButtonProps {
  storyId: string;
  storyTitle: string;
  storyThumbnail?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  disabled?: boolean;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  storyId,
  storyTitle,
  storyThumbnail,
  variant = 'primary',
  size = 'md',
  showText = true,
  className = '',
  disabled = false
}) => {
  const { addToCart, isAdding, error, isInCart, clearError } = useAddToCart();
  const [showSuccess, setShowSuccess] = React.useState(false);

  // Estado del botón
  const inCart = isInCart(storyId);
  const isDisabled = disabled || isAdding || inCart;

  // Handler para agregar al carrito
  const handleAddToCart = async () => {
    clearError(); // Limpiar errores previos
    
    const result = await addToCart(storyId, storyTitle, storyThumbnail);
    
    if (result.success) {
      setShowSuccess(true);
      // Ocultar el mensaje de éxito después de 2 segundos
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  // Texto del botón
  const getButtonText = () => {
    if (isAdding) return 'Agregando...';
    if (inCart) return 'En carrito';
    if (showSuccess) return 'Agregado';
    return 'Agregar al carrito';
  };

  // Ícono del botón
  const getButtonIcon = () => {
    if (isAdding) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (inCart || showSuccess) return <Check className="w-4 h-4" />;
    return <ShoppingCart className="w-4 h-4" />;
  };

  // Variante del botón cuando está en carrito
  const getButtonVariant = () => {
    if (inCart) return 'outline';
    if (showSuccess) return 'secondary';
    return variant;
  };

  return (
    <div className="space-y-1">
      <Button
        onClick={handleAddToCart}
        disabled={isDisabled}
        variant={getButtonVariant()}
        size={size}
        className={`transition-all duration-200 ${
          showSuccess ? 'bg-green-100 text-green-700 border-green-300' : ''
        } ${className}`}
      >
        <span className="flex items-center gap-2">
          {getButtonIcon()}
          {showText && <span>{getButtonText()}</span>}
        </span>
      </Button>

      {/* Mensaje de error */}
      {error && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default AddToCartButton;