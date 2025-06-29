import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart, CartItem } from '../hooks/state-management/useCartStore';
import { priceService } from '../services/priceService';
import { fulfillmentService } from '../services/fulfillmentService';

// Tipos para el contexto del carrito
export interface CartContextType {
  // Re-export del store para acceso directo
  cart: ReturnType<typeof useCart>;
  
  // Funciones de alto nivel
  addStoryToCart: (storyId: string, storyTitle: string, storyThumbnail?: string) => Promise<void>;
  createOrderFromCart: () => Promise<{ success: boolean; orderId?: string; error?: string }>;
  
  // Estado de operaciones asíncronas
  isProcessingOrder: boolean;
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
  const { user } = useAuth();
  const cart = useCart();
  const [isProcessingOrder, setIsProcessingOrder] = React.useState(false);
  
  // Referencias para evitar efectos infinitos
  const lastSyncRef = useRef<string>('');
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Limpiar carrito al logout
  useEffect(() => {
    if (!user) {
      cart.clearCart();
      cart.setError(null);
      setIsProcessingOrder(false);
    }
  }, [user, cart]);

  // Sincronización automática con servidor (debounced)
  useEffect(() => {
    // Solo sincronizar si hay usuario y hay cambios
    if (!user || cart.lastUpdated === lastSyncRef.current) {
      return;
    }

    // Limpiar timeout anterior
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Programar sincronización con delay de 2 segundos
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        lastSyncRef.current = cart.lastUpdated;
        await cart.syncWithServer();
      } catch (error) {
        console.error('Error sincronizando carrito:', error);
        cart.setError('Error al sincronizar carrito');
      }
    }, 2000);

    // Cleanup del timeout
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user, cart.lastUpdated, cart]);

  // Función para agregar historia al carrito
  const addStoryToCart = useCallback(async (
    storyId: string, 
    storyTitle: string, 
    storyThumbnail?: string
  ) => {
    if (!user) {
      cart.setError('Debes iniciar sesión para agregar al carrito');
      return;
    }

    try {
      cart.setLoading(true);
      cart.setError(null);

      // Verificar si ya está en el carrito
      if (cart.hasItem(storyId)) {
        cart.setError('Esta historia ya está en tu carrito');
        return;
      }

      // Obtener producto tipo por defecto y su precio
      const defaultProduct = await priceService.getDefaultProductType();
      if (!defaultProduct) {
        cart.setError('No hay productos disponibles en este momento');
        return;
      }

      const priceInfo = await priceService.getCurrentPrice(defaultProduct.id);
      if (!priceInfo) {
        cart.setError('No se pudo obtener el precio del producto');
        return;
      }

      // Agregar al carrito
      const cartItem: Omit<CartItem, 'id' | 'totalPrice' | 'addedAt'> = {
        storyId,
        storyTitle,
        storyThumbnail,
        quantity: 1,
        unitPrice: priceInfo.final_price,
        productTypeId: defaultProduct.id,
        productTypeName: defaultProduct.name
      };

      cart.addItem(cartItem);
      
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      cart.setError('Error al agregar al carrito');
    } finally {
      cart.setLoading(false);
    }
  }, [user, cart]);

  // Función para crear orden desde el carrito
  const createOrderFromCart = useCallback(async (): Promise<{ 
    success: boolean; 
    orderId?: string; 
    error?: string;
  }> => {
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    if (cart.isEmpty) {
      return { success: false, error: 'El carrito está vacío' };
    }

    try {
      setIsProcessingOrder(true);
      cart.setLoading(true);
      cart.setError(null);

      // Obtener producto tipo por defecto
      const defaultProduct = await priceService.getDefaultProductType();
      if (!defaultProduct) {
        return { success: false, error: 'No hay productos disponibles' };
      }

      // Crear orden con todas las historias del carrito
      const storyIds = cart.items.map(item => item.storyId);
      const order = await priceService.createOrder({
        storyIds,
        productTypeId: defaultProduct.id,
        paymentMethod: 'pending' // Se actualizará cuando se procese el pago
      });

      // Simular procesamiento de pago exitoso (para demo)
      const paymentResult = await priceService.processPayment(
        order.id,
        'simulation',
        { 
          transaction_id: `sim_${Date.now()}`,
          simulated: true,
          timestamp: new Date().toISOString()
        }
      );

      if (paymentResult.success) {
        // Crear registros de fulfillment automáticamente
        try {
          await fulfillmentService.crearFulfillmentParaOrden(order.id);
          console.log('Fulfillment records created for order:', order.id);
        } catch (fulfillmentError) {
          console.error('Error creating fulfillment records:', fulfillmentError);
          // No fallar la orden por esto, pero loggear el error
        }
      }

      return { success: true, orderId: order.id };
      
    } catch (error) {
      console.error('Error creando orden:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la orden';
      cart.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessingOrder(false);
      cart.setLoading(false);
    }
  }, [user, cart]);

  // Limpiar carrito después de checkout exitoso
  const clearCartAfterCheckout = useCallback(() => {
    cart.clearCart();
    cart.closeCart();
  }, [cart]);

  // Valor del contexto
  const contextValue: CartContextType = {
    cart,
    addStoryToCart,
    createOrderFromCart,
    isProcessingOrder
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Hook de conveniencia que combina CartContext y operaciones comunes
export const useCartOperations = () => {
  const { cart, addStoryToCart, createOrderFromCart, isProcessingOrder } = useCartContext();
  const { user } = useAuth();

  return {
    // Estado del carrito
    items: cart.items,
    totalItems: cart.totalItems,
    totalPrice: cart.totalPrice,
    isEmpty: cart.isEmpty,
    isOpen: cart.isOpen,
    isLoading: cart.isLoading || isProcessingOrder,
    error: cart.error,
    
    // Operaciones básicas
    addItem: addStoryToCart,
    removeItem: cart.removeItem,
    updateQuantity: cart.updateQuantity,
    clearCart: cart.clearCart,
    
    // UI
    openCart: cart.openCart,
    closeCart: cart.closeCart,
    toggleCart: cart.toggleCart,
    
    // Checkout
    createOrder: createOrderFromCart,
    canCheckout: cart.canCheckout() && !!user,
    
    // Utilidades
    formatPrice: cart.formatPrice,
    getSummary: cart.getSummary,
    hasItem: cart.hasItem,
    getItemByStoryId: cart.getItemByStoryId
  };
};