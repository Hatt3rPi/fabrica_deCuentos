import { useCallback, useEffect, useRef } from 'react';
import { StoryStyleConfig, ComponentConfig, TextComponentConfig, ImageComponentConfig, PageType } from '../types/styleConfig';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface DualSystemSyncOptions {
  enableSync: boolean;
  enableLogging: boolean;
  debounceMs: number;
  experimentalPositionSync?: boolean;
}

export interface SyncResult {
  success: boolean;
  changes: string[];
  errors: string[];
}

// ============================================================================
// FUNCIONES DE SINCRONIZACIÓN
// ============================================================================

/**
 * Sincroniza configuración legacy (activeConfig) → componentes (allComponents)
 * Sistema A → Sistema B
 */
export function syncConfigToComponents(
  activeConfig: StoryStyleConfig | null,
  currentComponents: ComponentConfig[],
  enableLogging = false
): { updatedComponents: ComponentConfig[]; syncResult: SyncResult } {
  const syncResult: SyncResult = {
    success: true,
    changes: [],
    errors: []
  };

  if (!activeConfig) {
    if (enableLogging) {
      console.log('[DualSystemSync] A→B: No activeConfig, no sync needed');
    }
    return { updatedComponents: currentComponents, syncResult };
  }

  let updatedComponents = [...currentComponents];
  
  try {
    // Mapear configuraciones legacy a componentes
    const configMappings = [
      {
        pageType: 'cover' as PageType,
        config: activeConfig.coverConfig?.title,
        componentType: 'text' as const
      },
      {
        pageType: 'page' as PageType, 
        config: activeConfig.pageConfig?.text,
        componentType: 'text' as const
      },
      {
        pageType: 'dedicatoria' as PageType,
        config: activeConfig.dedicatoriaConfig?.text,
        componentType: 'text' as const
      }
    ];

    for (const mapping of configMappings) {
      if (!mapping.config) continue;

      // Buscar componente por defecto para esta página
      const componentIndex = updatedComponents.findIndex(comp => 
        comp.pageType === mapping.pageType && 
        comp.type === mapping.componentType && 
        comp.isDefault === true
      );

      if (componentIndex >= 0 && mapping.componentType === 'text') {
        const currentComponent = updatedComponents[componentIndex] as TextComponentConfig;
        
        // Crear estilo actualizado desde la configuración legacy
        const updatedStyle = {
          ...currentComponent.style,
          fontSize: mapping.config.fontSize,
          fontFamily: mapping.config.fontFamily,
          fontWeight: mapping.config.fontWeight,
          color: mapping.config.color,
          textAlign: mapping.config.textAlign,
          textShadow: mapping.config.textShadow,
          letterSpacing: mapping.config.letterSpacing,
          lineHeight: (mapping.config as any).lineHeight,
          textTransform: (mapping.config as any).textTransform
        };

        // Crear containerStyle actualizado
        const updatedContainerStyle = {
          ...currentComponent.containerStyle,
          background: mapping.config.containerStyle?.background,
          padding: mapping.config.containerStyle?.padding,
          margin: mapping.config.containerStyle?.margin,
          borderRadius: mapping.config.containerStyle?.borderRadius,
          maxWidth: mapping.config.containerStyle?.maxWidth,
          minHeight: mapping.config.containerStyle?.minHeight,
          border: mapping.config.containerStyle?.border,
          boxShadow: mapping.config.containerStyle?.boxShadow,
          backdropFilter: mapping.config.containerStyle?.backdropFilter,
          // Propiedades de alineación
          horizontalAlignment: mapping.config.containerStyle?.horizontalAlignment,
          verticalAlignment: mapping.config.containerStyle?.verticalAlignment,
          scaleWidth: mapping.config.containerStyle?.scaleWidth,
          scaleHeight: mapping.config.containerStyle?.scaleHeight,
          scaleWidthUnit: mapping.config.containerStyle?.scaleWidthUnit,
          scaleHeightUnit: mapping.config.containerStyle?.scaleHeightUnit,
          maintainAspectRatio: mapping.config.containerStyle?.maintainAspectRatio
        };

        // Actualizar posición si está definida en la config
        const updatedPosition = mapping.config.position || currentComponent.position;
        const updatedHorizontalPosition = mapping.config.horizontalPosition || currentComponent.horizontalPosition;
        
        // CRÍTICO: Sincronizar también coordenadas x, y del sistema legacy
        const updatedX = (mapping.config as any).x !== undefined ? (mapping.config as any).x : currentComponent.x;
        const updatedY = (mapping.config as any).y !== undefined ? (mapping.config as any).y : currentComponent.y;

        // Crear componente actualizado
        const updatedComponent: TextComponentConfig = {
          ...currentComponent,
          style: updatedStyle,
          containerStyle: updatedContainerStyle,
          position: updatedPosition,
          horizontalPosition: updatedHorizontalPosition,
          x: updatedX,
          y: updatedY
        };

        updatedComponents[componentIndex] = updatedComponent;
        syncResult.changes.push(`Updated ${mapping.pageType} text component from config`);

        if (enableLogging) {
          console.log(`[DualSystemSync] A→B: Updated ${mapping.pageType} component:`, {
            componentId: updatedComponent.id,
            styleChanges: Object.keys(updatedStyle),
            containerChanges: Object.keys(updatedContainerStyle),
            positionChanges: {
              position: `${currentComponent.position} → ${updatedPosition}`,
              horizontalPosition: `${currentComponent.horizontalPosition} → ${updatedHorizontalPosition}`,
              x: `${currentComponent.x} → ${updatedX}`,
              y: `${currentComponent.y} → ${updatedY}`
            }
          });
        }
      }
    }

    if (enableLogging) {
      console.log('[DualSystemSync] A→B: Sync completed', {
        totalChanges: syncResult.changes.length,
        changes: syncResult.changes
      });
    }

  } catch (error) {
    syncResult.success = false;
    syncResult.errors.push(`Sync A→B failed: ${error}`);
    console.error('[DualSystemSync] A→B: Error during sync:', error);
  }

  return { updatedComponents, syncResult };
}

/**
 * Sincroniza componentes (allComponents) → configuración legacy (activeConfig)  
 * Sistema B → Sistema A
 */
export function syncComponentsToConfig(
  allComponents: ComponentConfig[],
  currentConfig: StoryStyleConfig | null,
  enableLogging = false
): { updatedConfig: StoryStyleConfig | null; syncResult: SyncResult } {
  const syncResult: SyncResult = {
    success: true,
    changes: [],
    errors: []
  };

  if (!currentConfig) {
    if (enableLogging) {
      console.log('[DualSystemSync] B→A: No currentConfig, no sync needed');
    }
    return { updatedConfig: currentConfig, syncResult };
  }

  let updatedConfig = { ...currentConfig };

  try {
    // Mapear componentes por defecto de vuelta a configuración legacy
    const pageTypes: PageType[] = ['cover', 'page', 'dedicatoria'];

    for (const pageType of pageTypes) {
      // Buscar componente de texto por defecto para esta página
      const defaultTextComponent = allComponents.find(comp => 
        comp.pageType === pageType && 
        comp.type === 'text' && 
        comp.isDefault === true
      ) as TextComponentConfig;

      if (defaultTextComponent && defaultTextComponent.style) {
        // Actualizar la configuración correspondiente
        if (pageType === 'cover' && updatedConfig.coverConfig) {
          updatedConfig.coverConfig = {
            ...updatedConfig.coverConfig,
            title: {
              ...updatedConfig.coverConfig.title,
              fontSize: defaultTextComponent.style.fontSize || updatedConfig.coverConfig.title.fontSize,
              fontFamily: defaultTextComponent.style.fontFamily || updatedConfig.coverConfig.title.fontFamily,
              fontWeight: defaultTextComponent.style.fontWeight || updatedConfig.coverConfig.title.fontWeight,
              color: defaultTextComponent.style.color || updatedConfig.coverConfig.title.color,
              textAlign: defaultTextComponent.style.textAlign as any || updatedConfig.coverConfig.title.textAlign,
              textShadow: defaultTextComponent.style.textShadow || updatedConfig.coverConfig.title.textShadow,
              letterSpacing: defaultTextComponent.style.letterSpacing || updatedConfig.coverConfig.title.letterSpacing,
              textTransform: defaultTextComponent.style.textTransform as any || updatedConfig.coverConfig.title.textTransform,
              position: defaultTextComponent.position || updatedConfig.coverConfig.title.position,
              horizontalPosition: defaultTextComponent.horizontalPosition || updatedConfig.coverConfig.title.horizontalPosition,
              // CRÍTICO: Sincronizar coordenadas x, y hacia el sistema legacy
              x: defaultTextComponent.x !== undefined ? defaultTextComponent.x : (updatedConfig.coverConfig.title as any).x,
              y: defaultTextComponent.y !== undefined ? defaultTextComponent.y : (updatedConfig.coverConfig.title as any).y,
              containerStyle: {
                ...updatedConfig.coverConfig.title.containerStyle,
                ...defaultTextComponent.containerStyle
              }
            }
          };
          syncResult.changes.push('Updated cover config from component');
        } else if (pageType === 'page' && updatedConfig.pageConfig) {
          updatedConfig.pageConfig = {
            ...updatedConfig.pageConfig,
            text: {
              ...updatedConfig.pageConfig.text,
              fontSize: defaultTextComponent.style.fontSize || updatedConfig.pageConfig.text.fontSize,
              fontFamily: defaultTextComponent.style.fontFamily || updatedConfig.pageConfig.text.fontFamily,
              fontWeight: defaultTextComponent.style.fontWeight || updatedConfig.pageConfig.text.fontWeight,
              color: defaultTextComponent.style.color || updatedConfig.pageConfig.text.color,
              textAlign: defaultTextComponent.style.textAlign as any || updatedConfig.pageConfig.text.textAlign,
              textShadow: defaultTextComponent.style.textShadow || updatedConfig.pageConfig.text.textShadow,
              letterSpacing: defaultTextComponent.style.letterSpacing || updatedConfig.pageConfig.text.letterSpacing,
              lineHeight: defaultTextComponent.style.lineHeight || updatedConfig.pageConfig.text.lineHeight,
              textTransform: defaultTextComponent.style.textTransform as any || updatedConfig.pageConfig.text.textTransform,
              position: defaultTextComponent.position || updatedConfig.pageConfig.text.position,
              horizontalPosition: defaultTextComponent.horizontalPosition || updatedConfig.pageConfig.text.horizontalPosition,
              // CRÍTICO: Sincronizar coordenadas x, y hacia el sistema legacy
              x: defaultTextComponent.x !== undefined ? defaultTextComponent.x : (updatedConfig.pageConfig.text as any).x,
              y: defaultTextComponent.y !== undefined ? defaultTextComponent.y : (updatedConfig.pageConfig.text as any).y,
              containerStyle: {
                ...updatedConfig.pageConfig.text.containerStyle,
                ...defaultTextComponent.containerStyle
              }
            }
          };
          syncResult.changes.push('Updated page config from component');
        } else if (pageType === 'dedicatoria' && updatedConfig.dedicatoriaConfig) {
          updatedConfig.dedicatoriaConfig = {
            ...updatedConfig.dedicatoriaConfig,
            text: {
              ...updatedConfig.dedicatoriaConfig.text,
              fontSize: defaultTextComponent.style.fontSize || updatedConfig.dedicatoriaConfig.text.fontSize,
              fontFamily: defaultTextComponent.style.fontFamily || updatedConfig.dedicatoriaConfig.text.fontFamily,
              fontWeight: defaultTextComponent.style.fontWeight || updatedConfig.dedicatoriaConfig.text.fontWeight,
              color: defaultTextComponent.style.color || updatedConfig.dedicatoriaConfig.text.color,
              textAlign: defaultTextComponent.style.textAlign as any || updatedConfig.dedicatoriaConfig.text.textAlign,
              textShadow: defaultTextComponent.style.textShadow || updatedConfig.dedicatoriaConfig.text.textShadow,
              letterSpacing: defaultTextComponent.style.letterSpacing || updatedConfig.dedicatoriaConfig.text.letterSpacing,
              lineHeight: defaultTextComponent.style.lineHeight || updatedConfig.dedicatoriaConfig.text.lineHeight,
              textTransform: defaultTextComponent.style.textTransform as any || updatedConfig.dedicatoriaConfig.text.textTransform,
              position: defaultTextComponent.position || updatedConfig.dedicatoriaConfig.text.position,
              horizontalPosition: defaultTextComponent.horizontalPosition || updatedConfig.dedicatoriaConfig.text.horizontalPosition,
              // CRÍTICO: Sincronizar coordenadas x, y hacia el sistema legacy
              x: defaultTextComponent.x !== undefined ? defaultTextComponent.x : (updatedConfig.dedicatoriaConfig.text as any).x,
              y: defaultTextComponent.y !== undefined ? defaultTextComponent.y : (updatedConfig.dedicatoriaConfig.text as any).y,
              containerStyle: {
                ...updatedConfig.dedicatoriaConfig.text.containerStyle,
                ...defaultTextComponent.containerStyle
              }
            }
          };
          syncResult.changes.push('Updated dedicatoria config from component');
        }

        if (enableLogging) {
          console.log(`[DualSystemSync] B→A: Updated ${pageType} config from component:`, {
            componentId: defaultTextComponent.id,
            styleChanges: Object.keys(defaultTextComponent.style)
          });
        }
      }
    }

    if (enableLogging) {
      console.log('[DualSystemSync] B→A: Sync completed', {
        totalChanges: syncResult.changes.length,
        changes: syncResult.changes
      });
    }

  } catch (error) {
    syncResult.success = false;
    syncResult.errors.push(`Sync B→A failed: ${error}`);
    console.error('[DualSystemSync] B→A: Error during sync:', error);
  }

  return { updatedConfig, syncResult };
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para mantener sincronizados los dos sistemas de estilos
 */
export function useDualSystemSync(
  activeConfig: StoryStyleConfig | null,
  allComponents: ComponentConfig[],
  onConfigUpdate: (config: StoryStyleConfig) => void,
  onComponentsUpdate: (components: ComponentConfig[]) => void,
  options: Partial<DualSystemSyncOptions> = {}
) {
  const defaultOptions: DualSystemSyncOptions = {
    enableSync: true,
    enableLogging: true,
    debounceMs: 100
  };

  const syncOptions = { ...defaultOptions, ...options };
  
  // Referencias para evitar loops infinitos
  const lastConfigRef = useRef<StoryStyleConfig | null>(null);
  const lastComponentsRef = useRef<ComponentConfig[]>([]);
  const syncInProgressRef = useRef<boolean>(false);

  // Función para sincronización A→B inmediata (sin debounce) - EXPERIMENTAL
  const forceAtoB = useCallback(() => {
    if (!activeConfig || !syncOptions.enableSync || syncInProgressRef.current) return;
    
    syncInProgressRef.current = true;
    
    try {
      const { updatedComponents, syncResult } = syncConfigToComponents(
        activeConfig,
        allComponents,
        syncOptions.enableLogging
      );

      if (syncResult.success && syncResult.changes.length > 0) {
        lastComponentsRef.current = updatedComponents;
        onComponentsUpdate(updatedComponents);
        
        if (syncOptions.enableLogging) {
          console.log('[EXPERIMENTAL] Forced A→B sync completed:', {
            changes: syncResult.changes
          });
        }
      }
    } finally {
      syncInProgressRef.current = false;
    }
  }, [activeConfig, allComponents, syncOptions, onComponentsUpdate]);

  // Función debounced para sincronización A→B (Config → Components)
  const debouncedSyncAtoB = useCallback(
    debounce((config: StoryStyleConfig | null, components: ComponentConfig[]) => {
      if (!syncOptions.enableSync || syncInProgressRef.current) return;
      
      syncInProgressRef.current = true;
      
      try {
        const { updatedComponents, syncResult } = syncConfigToComponents(
          config, 
          components, 
          syncOptions.enableLogging
        );

        if (syncResult.success && syncResult.changes.length > 0) {
          lastComponentsRef.current = updatedComponents;
          onComponentsUpdate(updatedComponents);
          
          if (syncOptions.enableLogging) {
            console.log('[DualSystemSync] A→B: Config changes applied to components', {
              changes: syncResult.changes
            });
          }
        }
      } finally {
        syncInProgressRef.current = false;
      }
    }, syncOptions.debounceMs),
    [syncOptions, onComponentsUpdate]
  );

  // Función debounced para sincronización B→A (Components → Config)
  const debouncedSyncBtoA = useCallback(
    debounce((components: ComponentConfig[], config: StoryStyleConfig | null) => {
      if (!syncOptions.enableSync || syncInProgressRef.current) return;
      
      syncInProgressRef.current = true;
      
      try {
        const { updatedConfig, syncResult } = syncComponentsToConfig(
          components, 
          config, 
          syncOptions.enableLogging
        );

        if (syncResult.success && syncResult.changes.length > 0 && updatedConfig) {
          lastConfigRef.current = updatedConfig;
          onConfigUpdate(updatedConfig);
          
          if (syncOptions.enableLogging) {
            console.log('[DualSystemSync] B→A: Component changes applied to config', {
              changes: syncResult.changes
            });
          }
        }
      } finally {
        syncInProgressRef.current = false;
      }
    }, syncOptions.debounceMs),
    [syncOptions, onConfigUpdate]
  );

  // Detectar cambios en activeConfig y sincronizar a componentes
  useEffect(() => {
    if (!activeConfig || !syncOptions.enableSync) return;

    const configChanged = JSON.stringify(activeConfig) !== JSON.stringify(lastConfigRef.current);
    
    if (configChanged && !syncInProgressRef.current) {
      lastConfigRef.current = activeConfig;
      debouncedSyncAtoB(activeConfig, allComponents);
    }
  }, [activeConfig, allComponents, debouncedSyncAtoB, syncOptions.enableSync]);

  // Detectar cambios en allComponents y sincronizar a config
  useEffect(() => {
    if (!allComponents.length || !syncOptions.enableSync) return;

    const componentsChanged = JSON.stringify(allComponents) !== JSON.stringify(lastComponentsRef.current);
    
    if (componentsChanged && !syncInProgressRef.current) {
      lastComponentsRef.current = allComponents;
      debouncedSyncBtoA(allComponents, activeConfig);
    }
  }, [allComponents, activeConfig, debouncedSyncBtoA, syncOptions.enableSync]);

  return {
    syncConfigToComponents: useCallback(
      () => syncConfigToComponents(activeConfig, allComponents, syncOptions.enableLogging),
      [activeConfig, allComponents, syncOptions.enableLogging]
    ),
    syncComponentsToConfig: useCallback(
      () => syncComponentsToConfig(allComponents, activeConfig, syncOptions.enableLogging),
      [allComponents, activeConfig, syncOptions.enableLogging]
    ),
    forceAtoB: syncOptions.experimentalPositionSync ? forceAtoB : undefined
  };
}

// ============================================================================
// UTILIDADES
// ============================================================================

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default useDualSystemSync;