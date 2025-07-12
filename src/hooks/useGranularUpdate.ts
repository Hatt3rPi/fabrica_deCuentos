import { useCallback, useRef, useMemo } from 'react';
import { ComponentConfig, StoryStyleConfig } from '../types/styleConfig';
import { ComponentTemplate } from '../types/unifiedTemplate';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface GranularUpdateOptions {
  /** Habilitar actualizaciones granulares (feature flag) */
  enableGranularUpdates: boolean;
  
  /** Habilitar logging de debug */
  enableLogging: boolean;
  
  /** Callback para actualización de componente único */
  onComponentUpdate: (componentId: string, updates: Partial<ComponentConfig>) => void;
  
  /** Callback para actualización de configuración */
  onConfigUpdate: (config: StoryStyleConfig) => void;
  
  /** Configuración actual del sistema */
  activeConfig: StoryStyleConfig | null;
  
  /** Lista completa de componentes */
  allComponents: ComponentConfig[];
}

interface UpdateClassification {
  /** Tipo de actualización */
  type: 'minor' | 'major' | 'complex';
  
  /** Si requiere sincronización dual */
  requiresSync: boolean;
  
  /** Si afecta otros componentes */
  affectsOthers: boolean;
  
  /** Componentes afectados (IDs) */
  affectedComponents: string[];
}

interface GranularUpdateResult {
  /** Si la actualización fue aplicada */
  applied: boolean;
  
  /** Método usado para la actualización */
  method: 'granular' | 'fallback' | 'bypassed';
  
  /** Tiempo de ejecución en ms */
  executionTime: number;
  
  /** Clasificación de la actualización */
  classification: UpdateClassification;
}

// ============================================================================
// FUNCIONES DE CLASIFICACIÓN
// ============================================================================

/**
 * Clasificar tipo de actualización para determinar estrategia
 */
function classifyUpdate(
  componentId: string,
  updates: Partial<ComponentConfig>,
  allComponents: ComponentConfig[]
): UpdateClassification {
  const updateKeys = Object.keys(updates);
  
  // Actualizaciones menores (solo afectan visualización del componente)
  const minorKeys = ['x', 'y', 'width', 'height', 'zIndex', 'visible'];
  const isMinorUpdate = updateKeys.every(key => minorKeys.includes(key));
  
  // Actualizaciones de estilo (afectan solo este componente)
  const styleKeys = ['style', 'containerStyle'];
  const isStyleUpdate = updateKeys.some(key => styleKeys.includes(key));
  
  // Actualizaciones complejas (pueden afectar sincronización)
  const complexKeys = ['type', 'pageType', 'isDefault', 'position', 'horizontalPosition'];
  const isComplexUpdate = updateKeys.some(key => complexKeys.includes(key));
  
  // Determinar componentes afectados
  const affectedComponents = [componentId];
  
  // Si es un componente por defecto, puede afectar sincronización
  const targetComponent = allComponents.find(c => c.id === componentId);
  const requiresSync = targetComponent?.isDefault === true && 
                      (isComplexUpdate || updateKeys.includes('position'));
  
  if (isMinorUpdate && !requiresSync) {
    return {
      type: 'minor',
      requiresSync: false,
      affectsOthers: false,
      affectedComponents
    };
  }
  
  if (isStyleUpdate && !isComplexUpdate) {
    return {
      type: 'major',
      requiresSync: false,
      affectsOthers: false,
      affectedComponents
    };
  }
  
  return {
    type: 'complex',
    requiresSync: true,
    affectsOthers: true,
    affectedComponents
  };
}

/**
 * Aplicar actualización granular directa
 */
function applyGranularUpdate(
  componentId: string,
  updates: Partial<ComponentConfig>,
  allComponents: ComponentConfig[],
  onComponentUpdate: (componentId: string, updates: Partial<ComponentConfig>) => void,
  enableLogging: boolean
): GranularUpdateResult {
  const startTime = performance.now();
  
  try {
    // Clasificar actualización
    const classification = classifyUpdate(componentId, updates, allComponents);
    
    if (enableLogging) {
      console.log(`[GranularUpdate] Aplicando actualización ${classification.type} a ${componentId}:`, {
        updates,
        classification,
        affectedComponents: classification.affectedComponents
      });
    }
    
    // Aplicar actualización directa
    console.log('🐛[DEBUG] GranularUpdate calling onComponentUpdate:', { componentId, updates });
    onComponentUpdate(componentId, updates);
    
    const executionTime = performance.now() - startTime;
    
    if (enableLogging) {
      console.log(`[GranularUpdate] Actualización granular completada en ${executionTime.toFixed(2)}ms`);
    }
    
    return {
      applied: true,
      method: 'granular',
      executionTime,
      classification
    };
    
  } catch (error) {
    if (enableLogging) {
      console.error(`[GranularUpdate] Error en actualización granular:`, error);
    }
    
    return {
      applied: false,
      method: 'granular',
      executionTime: performance.now() - startTime,
      classification: classifyUpdate(componentId, updates, allComponents)
    };
  }
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para actualizaciones granulares de componentes
 * Optimiza el rendimiento aplicando solo cambios específicos cuando es posible
 */
export function useGranularUpdate(options: GranularUpdateOptions) {
  const {
    enableGranularUpdates,
    enableLogging,
    onComponentUpdate,
    onConfigUpdate,
    activeConfig,
    allComponents
  } = options;
  
  // Referencias para tracking de performance
  const updateStatsRef = useRef({
    granularUpdates: 0,
    fallbackUpdates: 0,
    totalTime: 0,
    averageTime: 0
  });
  
  // Memoizar estadísticas (sin dependencias para evitar renders infinitos)
  const updateStats = useMemo(() => {
    const stats = updateStatsRef.current;
    const totalUpdates = stats.granularUpdates + stats.fallbackUpdates;
    
    return {
      ...stats,
      totalUpdates,
      granularRatio: totalUpdates > 0 ? (stats.granularUpdates / totalUpdates) * 100 : 0,
      averageTime: totalUpdates > 0 ? stats.totalTime / totalUpdates : 0
    };
  }, []);
  
  /**
   * Función principal de actualización granular
   */
  const updateComponent = useCallback((
    componentId: string,
    updates: Partial<ComponentConfig>,
    forceGranular = false
  ): GranularUpdateResult => {
    
    // Si las actualizaciones granulares están deshabilitadas, usar fallback
    if (!enableGranularUpdates && !forceGranular) {
      if (enableLogging) {
        console.log(`[GranularUpdate] Granular updates deshabilitado, usando fallback para ${componentId}`);
      }
      
      onComponentUpdate(componentId, updates);
      updateStatsRef.current.fallbackUpdates++;
      
      return {
        applied: true,
        method: 'fallback',
        executionTime: 0,
        classification: classifyUpdate(componentId, updates, allComponents)
      };
    }
    
    // Aplicar actualización granular
    const result = applyGranularUpdate(
      componentId,
      updates,
      allComponents,
      onComponentUpdate,
      enableLogging
    );
    
    // Actualizar estadísticas
    if (result.method === 'granular') {
      updateStatsRef.current.granularUpdates++;
    } else {
      updateStatsRef.current.fallbackUpdates++;
    }
    updateStatsRef.current.totalTime += result.executionTime;
    
    // Calcular promedio
    const totalUpdates = updateStatsRef.current.granularUpdates + updateStatsRef.current.fallbackUpdates;
    updateStatsRef.current.averageTime = updateStatsRef.current.totalTime / totalUpdates;
    
    return result;
    
  }, [
    enableGranularUpdates, 
    enableLogging, 
    onComponentUpdate, 
    allComponents
  ]);
  
  /**
   * Actualización de múltiples componentes
   */
  const updateMultipleComponents = useCallback((
    updates: Array<{ componentId: string; updates: Partial<ComponentConfig> }>
  ): GranularUpdateResult[] => {
    
    if (enableLogging) {
      console.log(`[GranularUpdate] Actualizando ${updates.length} componentes en batch`);
    }
    
    return updates.map(({ componentId, updates: componentUpdates }) => 
      updateComponent(componentId, componentUpdates)
    );
    
  }, [updateComponent, enableLogging]);
  
  /**
   * Verificar si una actualización debe usar granular update
   */
  const shouldUseGranularUpdate = useCallback((
    componentId: string,
    updates: Partial<ComponentConfig>
  ): boolean => {
    if (!enableGranularUpdates) return false;
    
    const classification = classifyUpdate(componentId, updates, allComponents);
    
    // Usar granular para actualizaciones menores y mayores
    return classification.type === 'minor' || classification.type === 'major';
    
  }, [enableGranularUpdates, allComponents]);
  
  /**
   * Reset de estadísticas
   */
  const resetStats = useCallback(() => {
    updateStatsRef.current = {
      granularUpdates: 0,
      fallbackUpdates: 0,
      totalTime: 0,
      averageTime: 0
    };
    
    if (enableLogging) {
      console.log('[GranularUpdate] Estadísticas reseteadas');
    }
  }, [enableLogging]);
  
  /**
   * Clasificar actualización sin aplicarla
   */
  const classifyUpdateOnly = useCallback((
    componentId: string,
    updates: Partial<ComponentConfig>
  ): UpdateClassification => {
    return classifyUpdate(componentId, updates, allComponents);
  }, [allComponents]);
  
  // Log de estadísticas si logging está habilitado
  if (enableLogging && updateStats.totalUpdates > 0 && updateStats.totalUpdates % 10 === 0) {
    console.log('[GranularUpdate] Estadísticas actuales:', updateStats);
  }
  
  return {
    // Funciones principales
    updateComponent,
    updateMultipleComponents,
    
    // Utilidades
    shouldUseGranularUpdate,
    classifyUpdate: classifyUpdateOnly,
    
    // Estadísticas y debugging
    updateStats,
    resetStats,
    
    // Estado
    isEnabled: enableGranularUpdates
  };
}

export default useGranularUpdate;