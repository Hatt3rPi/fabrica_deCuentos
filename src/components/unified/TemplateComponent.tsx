import React, { useMemo, useCallback, CSSProperties } from 'react';
import { ComponentTemplate } from '../../types/unifiedTemplate';
import { UnifiedRenderConfig } from '../../utils/storyStyleUtils';
import { applyUnifiedStyles, UNIFIED_PAGE_DIMENSIONS } from '../../utils/storyStyleUtils';
import { scaleStyleObject } from '../../utils/scaleUtils';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

interface TemplateComponentProps {
  /** Configuración del componente a renderizar */
  component: ComponentTemplate;
  
  /** Contenido dinámico del componente */
  content?: string;
  
  /** Configuración de renderizado unificado */
  renderConfig: UnifiedRenderConfig;
  
  /** Si el componente está seleccionado */
  isSelected?: boolean;
  
  /** Callback para seleccionar componente */
  onSelect?: (componentId: string) => void;
  
  /** Callback para actualizar componente */
  onUpdate?: (componentId: string, updates: Partial<ComponentTemplate>) => void;
  
  /** Dimensiones del contenedor padre */
  containerDimensions?: { width: number; height: number };
  
  /** Flag de debug */
  debug?: boolean;
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Comparación profunda optimizada para props del componente
 */
function arePropsEqual(prevProps: TemplateComponentProps, nextProps: TemplateComponentProps): boolean {
  // Comparaciones rápidas primero
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.content !== nextProps.content) return false;
  if (prevProps.debug !== nextProps.debug) return false;
  
  // Comparar dimensiones del contenedor
  if (prevProps.containerDimensions?.width !== nextProps.containerDimensions?.width ||
      prevProps.containerDimensions?.height !== nextProps.containerDimensions?.height) {
    return false;
  }
  
  // Comparar configuración de renderizado (solo propiedades clave)
  const prevConfig = prevProps.renderConfig;
  const nextConfig = nextProps.renderConfig;
  if (prevConfig.enableScaling !== nextConfig.enableScaling ||
      prevConfig.targetDimensions?.width !== nextConfig.targetDimensions?.width ||
      prevConfig.targetDimensions?.height !== nextConfig.targetDimensions?.height) {
    return false;
  }
  
  // Comparación granular del componente (solo propiedades que afectan el renderizado)
  const prevComp = prevProps.component;
  const nextComp = nextProps.component;
  
  if (prevComp.id !== nextComp.id) return false;
  if (prevComp.x !== nextComp.x || prevComp.y !== nextComp.y) return false;
  if (prevComp.width !== nextComp.width || prevComp.height !== nextComp.height) return false;
  if (prevComp.zIndex !== nextComp.zIndex || prevComp.visible !== nextComp.visible) return false;
  if (prevComp.url !== nextComp.url || prevComp.objectFit !== nextComp.objectFit) return false;
  
  // Comparar estilos (stringify para comparación profunda optimizada)
  if (JSON.stringify(prevComp.style) !== JSON.stringify(nextComp.style)) return false;
  if (JSON.stringify(prevComp.containerStyle) !== JSON.stringify(nextComp.containerStyle)) return false;
  
  // Si llegamos aquí, los props son iguales
  return true;
}

/**
 * Calcular factor de escala basado en dimensiones
 */
function calculateScaleFactor(
  containerDimensions: { width: number; height: number } | undefined,
  enableScaling: boolean
): number {
  if (!enableScaling || !containerDimensions) return 1;
  
  const scaleX = containerDimensions.width / UNIFIED_PAGE_DIMENSIONS.width;
  const scaleY = containerDimensions.height / UNIFIED_PAGE_DIMENSIONS.height;
  
  // Usar el factor menor para mantener aspect ratio
  return Math.min(scaleX, scaleY);
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Componente individual optimizado para renderizado granular
 * Solo se re-renderiza cuando sus props específicos cambian
 */
const TemplateComponent: React.FC<TemplateComponentProps> = ({
  component,
  content,
  renderConfig,
  isSelected = false,
  onSelect,
  onUpdate,
  containerDimensions,
  debug = false
}) => {
  
  // Memoizar factor de escala
  const scaleFactor = useMemo(() => {
    // 🚨 VALIDACIÓN CRÍTICA: Verificar que renderConfig no sea undefined
    if (!renderConfig) {
      console.error('🎯[TEMPLATE-DEBUG] 🚨 CRITICAL: renderConfig is undefined in scaleFactor calculation:', {
        componentId: component.id,
        componentName: component.name,
        hasContainerDimensions: !!containerDimensions,
        timestamp: new Date().toISOString()
      });
      return 1; // Factor de escala por defecto
    }
    
    return calculateScaleFactor(containerDimensions, renderConfig.enableScaling);
  }, [containerDimensions, renderConfig]);
  
  // Memoizar estilos aplicados - usar estilos directamente del component
  const appliedStyles = useMemo(() => {
    if (debug) {
      console.log(`🎯[TEMPLATE-DEBUG] TemplateComponent usando estilos directos para ${component.id}:`, {
        componentName: component.name,
        hasStyle: !!component.style,
        hasContainerStyle: !!component.containerStyle,
        scaleFactor: scaleFactor.toFixed(3)
      });
    }
    
    // Usar estilos directamente del component en lugar de applyUnifiedStyles
    // Los estilos ya deberían venir aplicados desde TemplateRenderer
    return {
      textStyle: component.style || {},
      containerStyle: component.containerStyle || {},
      positioning: {
        alignItems: 'center', // Default positioning
        justifyContent: 'center'
      }
    };
  }, [component.style, component.containerStyle, component.id, debug, scaleFactor]);
  
  // Memoizar coordenadas y dimensiones escaladas
  const scaledGeometry = useMemo(() => {
    const scaledX = component.x * scaleFactor;
    const scaledY = component.y * scaleFactor;
    const scaledWidth = component.width ? component.width * scaleFactor : undefined;
    const scaledHeight = component.height ? component.height * scaleFactor : undefined;
    
    if (debug) {
      console.log(`[TemplateComponent] Geometría escalada para ${component.id}:`, {
        original: { x: component.x, y: component.y, width: component.width, height: component.height },
        scaled: { x: scaledX, y: scaledY, width: scaledWidth, height: scaledHeight },
        scaleFactor: scaleFactor.toFixed(3)
      });
    }
    
    return { scaledX, scaledY, scaledWidth, scaledHeight };
  }, [component.x, component.y, component.width, component.height, scaleFactor, component.id, debug]);
  
  // Memoizar estilos del contenedor
  const containerStyle: CSSProperties = useMemo(() => {
    const { scaledX, scaledY, scaledWidth, scaledHeight } = scaledGeometry;
    
    // ✨ SOLUCIÓN: Background images deben mostrarse completas escalándose dentro del contenedor
    if (component.isBackground && component.type === 'image') {
      const bgContainerStyle = {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: containerDimensions?.width || '100%',
        height: containerDimensions?.height || '100%',
        zIndex: component.zIndex || 0,
        display: component.visible === false ? 'none' as const : 'block' as const,
        overflow: 'hidden' as const,
        ...scaleStyleObject(appliedStyles.containerStyle, scaleFactor)
      };
      
      console.log(`🐛[DEBUG] Background ${component.name} container style:`, {
        componentId: component.id,
        containerDimensions,
        finalContainerStyle: bgContainerStyle,
        componentOriginalSize: { width: component.width, height: component.height },
        isBackground: component.isBackground,
        scaleFactor: scaleFactor.toFixed(3),
        scaleCalculation: {
          enableScaling: renderConfig?.enableScaling,
          containerWidth: containerDimensions?.width,
          containerHeight: containerDimensions?.height,
          pageWidth: 1536, // UNIFIED_PAGE_DIMENSIONS.width
          pageHeight: 1024 // UNIFIED_PAGE_DIMENSIONS.height
        }
      });
      
      return bgContainerStyle;
    }
    
    // Para otros tipos de componentes, usar geometría normal
    return {
      position: 'absolute',
      top: scaledY,
      left: scaledX,
      width: scaledWidth,
      height: scaledHeight,
      zIndex: component.zIndex,
      display: component.visible === false ? 'none' : 'flex',
      alignItems: appliedStyles.positioning.alignItems,
      justifyContent: appliedStyles.positioning.justifyContent,
      ...scaleStyleObject(appliedStyles.containerStyle, scaleFactor)
    };
  }, [scaledGeometry, component.zIndex, component.visible, appliedStyles, scaleFactor, component.isBackground, component.type, containerDimensions, component.id, debug]);
  
  // Memoizar estilos de texto
  const textStyle: CSSProperties = useMemo(() => {
    return scaleStyleObject(appliedStyles.textStyle, scaleFactor);
  }, [appliedStyles.textStyle, scaleFactor]);
  
  // Handlers memoizados
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(component.id);
  }, [component.id, onSelect]);
  
  const handleUpdate = useCallback((updates: Partial<ComponentTemplate>) => {
    onUpdate?.(component.id, updates);
  }, [component.id, onUpdate]);
  
  // Memoizar contenido dinámico
  const dynamicContent = useMemo(() => {
    return content || component.content || '';
  }, [content, component.content]);
  
  // Log de renderizado con posición real
  if (debug || isSelected) {
    console.log(`🐛[DEBUG] Render ${component.name}:`, {
      componentId: component.id,
      componentName: component.name,
      type: component.type,
      isSelected,
      isBackground: component.isBackground,
      visible: component.visible,
      positionData: {
        conceptual: component.position,
        coordinates: { x: component.x, y: component.y },
        scaled: scaledGeometry
      },
      containerStyleApplied: isSelected ? containerStyle : 'not-logged',
      scaleFactor: scaleFactor.toFixed(3)
    });
  }
  
  // No renderizar si el componente no es visible
  if (component.visible === false) {
    return null;
  }
  
  // Renderizado específico por tipo de componente
  return (
    <div
      data-component-id={component.id}
      style={containerStyle}
      onClick={handleClick}
      className={isSelected ? 'template-component-selected' : 'template-component'}
    >
      {component.type === 'text' && (
        <div style={textStyle}>
          {dynamicContent}
        </div>
      )}
      
      {component.type === 'image' && component.url && !component.isBackground && (
        <img
          src={component.url}
          alt={component.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: component.objectFit || 'cover',
            objectPosition: 'center center',
            ...scaleStyleObject(component.style || {}, scaleFactor)
          }}
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            console.log(`🐛[DEBUG] Image ${component.name} loaded:`, {
              componentId: component.id,
              isBackground: component.isBackground,
              objectFit: component.objectFit || 'cover',
              naturalSize: { width: img.naturalWidth, height: img.naturalHeight },
              displaySize: { width: img.width, height: img.height },
              containerSize: containerDimensions
            });
          }}
        />
      )}
      
      {component.type === 'image' && component.url && component.isBackground && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${component.url})`,
            backgroundSize: 'contain', // Mostrar imagen completa
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            ...scaleStyleObject(component.style || {}, scaleFactor)
          }}
          onLoad={() => {
            console.log(`🐛[DEBUG] Background ${component.name} loaded as div`);
          }}
        />
      )}
      
      {component.type === 'background' && component.url && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${component.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            ...scaleStyleObject(component.style || {}, scaleFactor)
          }}
        />
      )}
    </div>
  );
};

// Exportar con React.memo y comparación personalizada
export default React.memo(TemplateComponent, arePropsEqual);