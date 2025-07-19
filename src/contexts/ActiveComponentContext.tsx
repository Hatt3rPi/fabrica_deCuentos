import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ComponentConfig } from '../types/styleConfig';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface ComponentUpdateInfo {
  /** ID del componente que se está actualizando */
  componentId: string;
  
  /** Timestamp de la última actualización */
  lastUpdated: number;
  
  /** Tipo de actualización en curso */
  updateType: 'minor' | 'major' | 'complex';
  
  /** Si la actualización está en progreso */
  isUpdating: boolean;
}

interface ActiveComponentContextValue {
  /** ID del componente actualmente activo/seleccionado */
  activeComponentId: string | null;
  
  /** Información de componentes que se están actualizando */
  updatingComponents: Map<string, ComponentUpdateInfo>;
  
  /** Función para establecer el componente activo */
  setActiveComponent: (componentId: string | null) => void;
  
  /** Función para marcar un componente como en actualización */
  markComponentUpdating: (
    componentId: string, 
    updateType: 'minor' | 'major' | 'complex'
  ) => void;
  
  /** Función para marcar un componente como actualizado */
  markComponentUpdated: (componentId: string) => void;
  
  /** Verificar si un componente específico se está actualizando */
  isComponentUpdating: (componentId: string) => boolean;
  
  /** Obtener información de actualización de un componente */
  getComponentUpdateInfo: (componentId: string) => ComponentUpdateInfo | null;
  
  /** Obtener estadísticas de actualizaciones */
  getUpdateStats: () => {
    totalUpdating: number;
    byType: Record<'minor' | 'major' | 'complex', number>;
    oldestUpdate: number | null;
  };
  
  /** Limpiar componentes que no se han actualizado recientemente */
  cleanupStaleUpdates: (maxAge?: number) => void;
}

// ============================================================================
// CONTEXTO
// ============================================================================

const ActiveComponentContext = createContext<ActiveComponentContextValue | null>(null);

// ============================================================================
// HOOK PARA USAR EL CONTEXTO
// ============================================================================

/**
 * Hook para acceder al contexto de componente activo
 */
export function useActiveComponent(): ActiveComponentContextValue {
  const context = useContext(ActiveComponentContext);
  
  if (!context) {
    throw new Error('useActiveComponent debe usarse dentro de un ActiveComponentProvider');
  }
  
  return context;
}

// ============================================================================
// PROVIDER DEL CONTEXTO
// ============================================================================

interface ActiveComponentProviderProps {
  children: React.ReactNode;
  
  /** Callback cuando cambia el componente activo */
  onActiveComponentChange?: (componentId: string | null) => void;
  
  /** Callback cuando se inicia una actualización */
  onUpdateStart?: (componentId: string, updateType: 'minor' | 'major' | 'complex') => void;
  
  /** Callback cuando se completa una actualización */
  onUpdateComplete?: (componentId: string, duration: number) => void;
  
  /** Tiempo máximo para considerar una actualización como obsoleta (ms) */
  maxUpdateAge?: number;
  
  /** Si habilitar logging de debug */
  enableLogging?: boolean;
}

export const ActiveComponentProvider: React.FC<ActiveComponentProviderProps> = ({
  children,
  onActiveComponentChange,
  onUpdateStart,
  onUpdateComplete,
  maxUpdateAge = 5000, // 5 segundos por defecto
  enableLogging = false
}) => {
  // Estado del componente activo
  const [activeComponentId, setActiveComponentIdState] = useState<string | null>(null);
  
  // Estado de componentes en actualización
  const [updatingComponents, setUpdatingComponents] = useState<Map<string, ComponentUpdateInfo>>(
    new Map()
  );
  
  // Función para establecer el componente activo
  const setActiveComponent = useCallback((componentId: string | null) => {
    if (enableLogging) {
      console.log('[ActiveComponent] Cambiando componente activo:', {
        prev: activeComponentId,
        next: componentId
      });
    }
    
    setActiveComponentIdState(componentId);
    onActiveComponentChange?.(componentId);
  }, [activeComponentId, onActiveComponentChange, enableLogging]);
  
  // Función para marcar un componente como en actualización
  const markComponentUpdating = useCallback((
    componentId: string, 
    updateType: 'minor' | 'major' | 'complex'
  ) => {
    const now = Date.now();
    
    if (enableLogging) {
      console.log('[ActiveComponent] Marcando componente como updating:', {
        componentId,
        updateType,
        timestamp: now
      });
    }
    
    setUpdatingComponents(prev => {
      const newMap = new Map(prev);
      newMap.set(componentId, {
        componentId,
        lastUpdated: now,
        updateType,
        isUpdating: true
      });
      return newMap;
    });
    
    onUpdateStart?.(componentId, updateType);
  }, [onUpdateStart, enableLogging]);
  
  // Función para marcar un componente como actualizado
  const markComponentUpdated = useCallback((componentId: string) => {
    const now = Date.now();
    
    setUpdatingComponents(prev => {
      const updateInfo = prev.get(componentId);
      if (!updateInfo) return prev;
      
      const duration = now - updateInfo.lastUpdated;
      
      if (enableLogging) {
        console.log('[ActiveComponent] Componente actualizado:', {
          componentId,
          duration: `${duration}ms`,
          updateType: updateInfo.updateType
        });
      }
      
      onUpdateComplete?.(componentId, duration);
      
      // Remover del mapa de actualizaciones
      const newMap = new Map(prev);
      newMap.delete(componentId);
      return newMap;
    });
  }, [onUpdateComplete, enableLogging]);
  
  // Función para verificar si un componente se está actualizando
  const isComponentUpdating = useCallback((componentId: string): boolean => {
    return updatingComponents.has(componentId);
  }, [updatingComponents]);
  
  // Función para obtener información de actualización
  const getComponentUpdateInfo = useCallback((componentId: string): ComponentUpdateInfo | null => {
    return updatingComponents.get(componentId) || null;
  }, [updatingComponents]);
  
  // Función para obtener estadísticas
  const getUpdateStats = useCallback(() => {
    const stats = {
      totalUpdating: updatingComponents.size,
      byType: { minor: 0, major: 0, complex: 0 } as Record<'minor' | 'major' | 'complex', number>,
      oldestUpdate: null as number | null
    };
    
    let oldestTimestamp = Infinity;
    
    for (const updateInfo of updatingComponents.values()) {
      stats.byType[updateInfo.updateType]++;
      
      if (updateInfo.lastUpdated < oldestTimestamp) {
        oldestTimestamp = updateInfo.lastUpdated;
      }
    }
    
    if (oldestTimestamp !== Infinity) {
      stats.oldestUpdate = Date.now() - oldestTimestamp;
    }
    
    return stats;
  }, [updatingComponents]);
  
  // Función para limpiar actualizaciones obsoletas
  const cleanupStaleUpdates = useCallback((customMaxAge?: number) => {
    const maxAge = customMaxAge || maxUpdateAge;
    const now = Date.now();
    
    setUpdatingComponents(prev => {
      const newMap = new Map(prev);
      let removedCount = 0;
      
      for (const [componentId, updateInfo] of prev.entries()) {
        if (now - updateInfo.lastUpdated > maxAge) {
          newMap.delete(componentId);
          removedCount++;
        }
      }
      
      if (enableLogging && removedCount > 0) {
        console.log('[ActiveComponent] Limpieza de actualizaciones obsoletas:', {
          removedCount,
          maxAge: `${maxAge}ms`,
          remaining: newMap.size
        });
      }
      
      return newMap;
    });
  }, [maxUpdateAge, enableLogging]);
  
  // Limpieza automática periódica
  React.useEffect(() => {
    const interval = setInterval(() => {
      cleanupStaleUpdates();
    }, maxUpdateAge);
    
    return () => clearInterval(interval);
  }, [cleanupStaleUpdates, maxUpdateAge]);
  
  // Valor del contexto memoizado
  const contextValue = useMemo<ActiveComponentContextValue>(() => ({
    activeComponentId,
    updatingComponents,
    setActiveComponent,
    markComponentUpdating,
    markComponentUpdated,
    isComponentUpdating,
    getComponentUpdateInfo,
    getUpdateStats,
    cleanupStaleUpdates
  }), [
    activeComponentId,
    updatingComponents,
    setActiveComponent,
    markComponentUpdating,
    markComponentUpdated,
    isComponentUpdating,
    getComponentUpdateInfo,
    getUpdateStats,
    cleanupStaleUpdates
  ]);
  
  return (
    <ActiveComponentContext.Provider value={contextValue}>
      {children}
    </ActiveComponentContext.Provider>
  );
};

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default ActiveComponentContext;
export type { 
  ActiveComponentContextValue, 
  ComponentUpdateInfo,
  ActiveComponentProviderProps 
};