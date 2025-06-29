import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// Tipos para el carrito
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

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  lastUpdated: string;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface CartActions {
  // Gestión de items
  addItem: (item: Omit<CartItem, 'id' | 'totalPrice' | 'addedAt'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // UI State
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Loading y errores
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utilidades
  getItemByStoryId: (storyId: string) => CartItem | undefined;
  hasItem: (storyId: string) => boolean;
  getTotalByProductType: (productTypeId: string) => number;
  
  // Persistencia
  syncWithServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
}

export type CartStore = CartState & CartActions;

// Estado inicial
const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  lastUpdated: new Date().toISOString(),
  isOpen: false,
  isLoading: false,
  error: null
};

// Función para calcular totales
const calculateTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
  return { totalItems, totalPrice };
};

// Función para generar ID único para items del carrito
const generateCartItemId = () => {
  return `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Gestión de items
        addItem: (itemData) => {
          const state = get();
          
          // Verificar si ya existe el item para esta historia
          const existingItem = state.items.find(item => item.storyId === itemData.storyId);
          
          if (existingItem) {
            // Si existe, actualizar cantidad
            const updatedItems = state.items.map(item => 
              item.storyId === itemData.storyId
                ? {
                    ...item,
                    quantity: item.quantity + itemData.quantity,
                    totalPrice: (item.quantity + itemData.quantity) * item.unitPrice
                  }
                : item
            );
            
            const totals = calculateTotals(updatedItems);
            
            set({
              items: updatedItems,
              ...totals,
              lastUpdated: new Date().toISOString(),
              error: null
            });
          } else {
            // Si no existe, agregar nuevo item
            const newItem: CartItem = {
              ...itemData,
              id: generateCartItemId(),
              totalPrice: itemData.quantity * itemData.unitPrice,
              addedAt: new Date().toISOString()
            };
            
            const updatedItems = [...state.items, newItem];
            const totals = calculateTotals(updatedItems);
            
            set({
              items: updatedItems,
              ...totals,
              lastUpdated: new Date().toISOString(),
              error: null
            });
          }
        },

        removeItem: (itemId) => {
          const state = get();
          const updatedItems = state.items.filter(item => item.id !== itemId);
          const totals = calculateTotals(updatedItems);
          
          set({
            items: updatedItems,
            ...totals,
            lastUpdated: new Date().toISOString(),
            error: null
          });
        },

        updateQuantity: (itemId, quantity) => {
          if (quantity <= 0) {
            get().removeItem(itemId);
            return;
          }

          const state = get();
          const updatedItems = state.items.map(item => 
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  totalPrice: quantity * item.unitPrice
                }
              : item
          );
          
          const totals = calculateTotals(updatedItems);
          
          set({
            items: updatedItems,
            ...totals,
            lastUpdated: new Date().toISOString(),
            error: null
          });
        },

        clearCart: () => {
          set({
            items: [],
            totalItems: 0,
            totalPrice: 0,
            lastUpdated: new Date().toISOString(),
            error: null
          });
        },

        // UI State
        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),
        toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

        // Loading y errores
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        // Utilidades
        getItemByStoryId: (storyId) => {
          const state = get();
          return state.items.find(item => item.storyId === storyId);
        },

        hasItem: (storyId) => {
          const state = get();
          return state.items.some(item => item.storyId === storyId);
        },

        getTotalByProductType: (productTypeId) => {
          const state = get();
          return state.items
            .filter(item => item.productTypeId === productTypeId)
            .reduce((sum, item) => sum + item.totalPrice, 0);
        },

        // Persistencia (placeholder para futura implementación)
        syncWithServer: async () => {
          // TODO: Implementar sincronización con servidor
          console.log('CartStore: syncWithServer not implemented yet');
        },

        loadFromServer: async () => {
          // TODO: Implementar carga desde servidor
          console.log('CartStore: loadFromServer not implemented yet');
        }
      }),
      {
        name: 'lacuenteria-cart', // Nombre para localStorage
        version: 1,
        
        // Solo persistir ciertos campos
        partialize: (state) => ({
          items: state.items,
          totalItems: state.totalItems,
          totalPrice: state.totalPrice,
          lastUpdated: state.lastUpdated
        }),

        // Migrar estado si cambia la versión
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migración de versión 0 a 1
            return {
              ...persistedState,
              error: null,
              isLoading: false,
              isOpen: false
            };
          }
          return persistedState;
        }
      }
    ),
    {
      name: 'CartStore',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// Hook personalizado con funcionalidades adicionales
export const useCart = () => {
  const store = useCartStore();
  
  return {
    ...store,
    
    // Funciones helper adicionales
    isEmpty: store.items.length === 0,
    
    // Formatear precio
    formatPrice: (amount: number, currency = 'CLP') => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency
      }).format(amount);
    },
    
    // Obtener resumen del carrito
    getSummary: () => ({
      itemCount: store.totalItems,
      totalPrice: store.totalPrice,
      uniqueStories: store.items.length,
      lastUpdated: store.lastUpdated
    }),
    
    // Validar si se puede proceder al checkout
    canCheckout: () => {
      return store.items.length > 0 && !store.isLoading && store.error === null;
    }
  };
};