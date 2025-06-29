import { useState, useCallback } from 'react';
import { useCartOperations } from '../contexts/CartContext';

// Tipos para el hook
export interface AddToCartResult {
  success: boolean;
  error?: string;
}

export interface UseAddToCartReturn {
  addToCart: (storyId: string, storyTitle: string, storyThumbnail?: string) => Promise<AddToCartResult>;
  isAdding: boolean;
  error: string | null;
  isInCart: (storyId: string) => boolean;
  clearError: () => void;
}

// Hook para manejar la adición de historias al carrito con estados y validaciones
export const useAddToCart = (): UseAddToCartReturn => {
  const { addItem, hasItem, error: cartError } = useCartOperations();
  const [isAdding, setIsAdding] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Error combinado del carrito y local
  const error = localError || cartError;

  const addToCart = useCallback(async (
    storyId: string,
    storyTitle: string,
    storyThumbnail?: string
  ): Promise<AddToCartResult> => {
    try {
      setIsAdding(true);
      setLocalError(null);

      // Validaciones básicas
      if (!storyId || !storyTitle) {
        const errorMsg = 'Faltan datos de la historia';
        setLocalError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Verificar si ya está en el carrito
      if (hasItem(storyId)) {
        const errorMsg = 'Esta historia ya está en tu carrito';
        setLocalError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Agregar al carrito usando el contexto
      await addItem(storyId, storyTitle, storyThumbnail);

      // Verificar si se agregó correctamente
      if (hasItem(storyId)) {
        return { success: true };
      } else {
        const errorMsg = 'No se pudo agregar al carrito';
        setLocalError(errorMsg);
        return { success: false, error: errorMsg };
      }

    } catch (error) {
      console.error('Error en useAddToCart:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error inesperado';
      setLocalError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsAdding(false);
    }
  }, [addItem, hasItem]);

  const isInCart = useCallback((storyId: string): boolean => {
    return hasItem(storyId);
  }, [hasItem]);

  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  return {
    addToCart,
    isAdding,
    error,
    isInCart,
    clearError
  };
};