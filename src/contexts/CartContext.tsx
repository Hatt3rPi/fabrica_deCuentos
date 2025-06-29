import React, { createContext, useContext } from 'react';

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
  // Estado simplificado
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = React.useState(false);

  // Cálculos derivados
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const isEmpty = items.length === 0;

  // Funciones básicas (implementación simple para no bloquear la app)
  const addStoryToCart = async (_storyId: string, _storyTitle: string, _storyThumbnail?: string) => {
    console.log('CartProvider: addStoryToCart called (simple implementation)');
    setError('Carrito en desarrollo - funcionalidad disponible próximamente');
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
        : item
    ));
  };

  const clearCart = () => {
    setItems([]);
    setError(null);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(prev => !prev);

  const createOrderFromCart = async () => {
    console.log('CartProvider: createOrderFromCart called (simple implementation)');
    return { success: false, error: 'Carrito en desarrollo' };
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const hasItem = (storyId: string) => {
    return items.some(item => item.storyId === storyId);
  };

  const canCheckout = () => {
    return items.length > 0 && !isLoading;
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