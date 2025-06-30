import React, { createContext, useContext } from 'react';
import { useCartStore } from '../hooks/state-management/useCartStore';
import { priceService } from '../services/priceService';

// Tipos simplificados para el contexto del carrito
export interface CartItem {
  id: string;
  storyId: string;
  storyTitle: string;
  storyThumbnail?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productTypeId: string;
  productTypeName: string;
  addedAt: string;
}

export interface CartContextType {
  // Estado básico
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isEmpty: boolean;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Funciones básicas
  addStoryToCart: (storyId: string, storyTitle: string, storyThumbnail?: string) => Promise<void>;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // UI
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Checkout
  createOrderFromCart: () => Promise<{ success: boolean; orderId?: string; error?: string }>;
  isProcessingOrder: boolean;
  
  // Utilidades
  formatPrice: (amount: number) => string;
  hasItem: (storyId: string) => boolean;
  canCheckout: () => boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext debe usarse dentro de CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Usar Zustand store gradualmente
  const cartStore = useCartStore();
  const [isProcessingOrder, setIsProcessingOrder] = React.useState(false);

  // Cálculos derivados del store
  const { items, totalItems, totalPrice, isOpen, isLoading, error } = cartStore;
  const isEmpty = items.length === 0;

  // Funciones con implementación real usando Zustand store
  const addStoryToCart = async (storyId: string, storyTitle: string, storyThumbnail?: string) => {
    try {
      cartStore.setLoading(true);
      cartStore.setError(null);

      // Obtener el tipo de producto por defecto
      const defaultProductType = await priceService.getDefaultProductType();
      if (!defaultProductType) {
        throw new Error('No hay productos disponibles en este momento');
      }

      // Obtener precio actual
      const priceInfo = await priceService.getCurrentPrice(defaultProductType.id);
      if (!priceInfo) {
        throw new Error('No se pudo obtener el precio del producto');
      }

      // Agregar al carrito usando el store
      cartStore.addItem({
        storyId,
        storyTitle,
        storyThumbnail,
        quantity: 1,
        unitPrice: priceInfo.final_price,
        productTypeId: defaultProductType.id,
        productTypeName: defaultProductType.name
      });

      console.log(`Historia "${storyTitle}" agregada al carrito`);
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      cartStore.setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      cartStore.setLoading(false);
    }
  };

  // Delegar funciones al store de Zustand
  const removeItem = cartStore.removeItem;
  const updateQuantity = cartStore.updateQuantity;
  const clearCart = cartStore.clearCart;
  const openCart = cartStore.openCart;
  const closeCart = cartStore.closeCart;
  const toggleCart = cartStore.toggleCart;

  const createOrderFromCart = async () => {
    try {
      setIsProcessingOrder(true);
      cartStore.setError(null);

      if (isEmpty) {
        throw new Error('El carrito está vacío');
      }

      // Crear orden usando el servicio de precios
      const orderData = {
        order_type: 'cart' as const,
        items: items.map(item => ({
          product_type_id: item.productTypeId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          story_id: item.storyId,
          story_title: item.storyTitle,
          story_thumbnail: item.storyThumbnail
        })),
        subtotal: totalPrice,
        total_amount: totalPrice // Por ahora sin impuestos ni descuentos
      };

      const order = await priceService.createOrder(orderData);
      
      if (order) {
        console.log('Orden creada exitosamente:', order.id);
        return { success: true, orderId: order.id };
      } else {
        throw new Error('No se pudo crear la orden');
      }
    } catch (error) {
      console.error('Error creando orden:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      cartStore.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Usar funciones del store de Zustand
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const hasItem = cartStore.hasItem;
  const canCheckout = () => {
    return items.length > 0 && !isLoading && !isProcessingOrder;
  };

  // Valor del contexto
  const contextValue: CartContextType = {
    items,
    totalItems,
    totalPrice,
    isEmpty,
    isOpen,
    isLoading,
    error,
    addStoryToCart,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    createOrderFromCart,
    isProcessingOrder,
    formatPrice,
    hasItem,
    canCheckout
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Hook de conveniencia
export const useCartOperations = () => {
  const context = useCartContext();
  return {
    // Re-export todo el contexto para compatibilidad
    ...context,
    // Alias para compatibilidad
    addItem: context.addStoryToCart,
    createOrder: context.createOrderFromCart
  };
};