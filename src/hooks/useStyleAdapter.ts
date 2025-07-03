import { useMemo, useCallback } from 'react';
import { ComponentConfig, TextComponentConfig, ImageComponentConfig, StoryStyleConfig, PageType } from '../types/styleConfig';

// Tipos para el sistema de selección
export interface SelectionTarget {
  type: 'page' | 'component';
  componentId?: string;
  componentName?: string;
  componentType?: string;
}

// Interfaz unificada para estilos
export interface UnifiedStyleConfig {
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
  
  // Colors
  color?: string;
  textShadow?: string;
  
  // Position & Layout
  position?: string;
  horizontalPosition?: string;
  
  // Effects & Container
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  opacity?: number;
  
  // Image specific
  objectFit?: string;
  width?: string;
  height?: string;
  size?: 'small' | 'medium' | 'large' | 'custom';
  
  // Component specific
  content?: string;
  imageUrl?: string;
}

export interface StyleAdapterReturn {
  /** Estilos actuales del elemento seleccionado */
  currentStyles: UnifiedStyleConfig;
  
  /** Función para actualizar estilos */
  updateStyles: (updates: Partial<UnifiedStyleConfig>) => void;
  
  /** Información del elemento seleccionado */
  selectionInfo: {
    type: 'page' | 'component';
    name: string;
    typeName: string;
    isEditable: boolean;
  };
  
  /** Indica si ciertos controles están disponibles */
  availableControls: {
    typography: boolean;
    colors: boolean;
    position: boolean;
    effects: boolean;
    container: boolean;
    image: boolean;
  };
}

/**
 * Hook para adaptar estilos entre página y componentes
 * Permite que los paneles de estilo existentes trabajen con ambas estructuras
 */
export const useStyleAdapter = (
  selectedTarget: SelectionTarget,
  config: StoryStyleConfig | null,
  pageType: PageType,
  components: ComponentConfig[],
  onConfigChange: (updates: Partial<StoryStyleConfig>) => void,
  onComponentChange: (componentId: string, updates: Partial<ComponentConfig>) => void
): StyleAdapterReturn => {
  
  // Obtener el componente seleccionado si aplica
  const selectedComponent = useMemo(() => {
    if (selectedTarget.type === 'component' && selectedTarget.componentId) {
      return components.find(c => c.id === selectedTarget.componentId);
    }
    return null;
  }, [selectedTarget, components]);
  
  // Mapear estilos de página a formato unificado
  const mapPageStylesToUnified = useCallback((config: StoryStyleConfig | null, pageType: PageType): UnifiedStyleConfig => {
    if (!config) return {
      fontFamily: 'Inter, sans-serif',
      fontSize: '1rem',
      fontWeight: '400',
      color: '#000000',
      textAlign: 'left',
      textShadow: 'none'
    };
    
    const getPageConfig = () => {
      switch (pageType) {
        case 'cover': return config.coverConfig?.title;
        case 'page': return config.pageConfig?.text;
        case 'dedicatoria': return config.dedicatoriaConfig?.text;
        case 'contraportada': return config.contraportadaConfig?.text;
        default: return config.pageConfig?.text;
      }
    };
    
    const pageConfig = getPageConfig();
    if (!pageConfig) return {
      fontFamily: 'Inter, sans-serif',
      fontSize: '1rem',
      fontWeight: '400',
      color: '#000000',
      textAlign: 'left',
      textShadow: 'none'
    };
    
    return {
      fontFamily: pageConfig.fontFamily || 'Inter, sans-serif',
      fontSize: pageConfig.fontSize || '1rem',
      fontWeight: pageConfig.fontWeight || '400',
      textAlign: pageConfig.textAlign || 'left',
      lineHeight: pageConfig.lineHeight,
      letterSpacing: pageConfig.letterSpacing,
      textTransform: pageConfig.textTransform,
      color: pageConfig.color || '#000000',
      textShadow: pageConfig.textShadow || 'none',
      position: pageConfig.position,
      backgroundColor: pageConfig.containerStyle?.background,
      borderRadius: pageConfig.containerStyle?.borderRadius,
      padding: pageConfig.containerStyle?.padding,
      opacity: 1
    };
  }, []);
  
  // Mapear estilos de componente a formato unificado
  const mapComponentStylesToUnified = useCallback((component: ComponentConfig): UnifiedStyleConfig => {
    const unified: UnifiedStyleConfig = {
      position: component.position || 'center',
      horizontalPosition: component.horizontalPosition || 'center'
    };
    
    if (component.type === 'text') {
      const textComp = component as TextComponentConfig;
      return {
        ...unified,
        fontFamily: textComp.style?.fontFamily || 'Inter, sans-serif',
        fontSize: textComp.style?.fontSize || '1rem',
        fontWeight: textComp.style?.fontWeight || '400',
        textAlign: textComp.style?.textAlign || 'left',
        lineHeight: textComp.style?.lineHeight,
        letterSpacing: textComp.style?.letterSpacing,
        color: textComp.style?.color || '#000000',
        textShadow: textComp.style?.textShadow || 'none',
        content: textComp.content
      };
    }
    
    if (component.type === 'image') {
      const imageComp = component as ImageComponentConfig;
      return {
        ...unified,
        imageUrl: imageComp.imageUrl || '',
        size: imageComp.size || 'medium',
        opacity: imageComp.opacity || 1,
        objectFit: imageComp.fit || 'cover',
        width: imageComp.customSize?.width,
        height: imageComp.customSize?.height
      };
    }
    
    return unified;
  }, []);
  
  // Obtener estilos actuales
  const currentStyles = useMemo((): UnifiedStyleConfig => {
    if (selectedTarget.type === 'component' && selectedComponent) {
      return mapComponentStylesToUnified(selectedComponent);
    } else {
      return mapPageStylesToUnified(config, pageType);
    }
  }, [selectedTarget, selectedComponent, config, pageType, mapComponentStylesToUnified, mapPageStylesToUnified]);
  
  // Función para actualizar estilos de página
  const updatePageStyles = useCallback((updates: Partial<UnifiedStyleConfig>) => {
    const pageKey = pageType;
    const currentPageConfig = config?.[pageKey] || {};
    
    const newPageConfig = {
      ...currentPageConfig,
      ...updates
    };
    
    onConfigChange({
      [pageKey]: newPageConfig
    });
  }, [pageType, config, onConfigChange]);
  
  // Función para actualizar estilos de componente
  const updateComponentStyles = useCallback((updates: Partial<UnifiedStyleConfig>) => {
    if (!selectedComponent || !selectedTarget.componentId) return;
    
    const componentUpdates: Partial<ComponentConfig> = {
      position: updates.position,
      horizontalPosition: updates.horizontalPosition
    };
    
    if (selectedComponent.type === 'text') {
      const currentStyle = (selectedComponent as TextComponentConfig).style || {};
      const textUpdates: Partial<TextComponentConfig> = {
        ...componentUpdates,
        content: updates.content,
        style: {
          fontFamily: updates.fontFamily !== undefined ? updates.fontFamily : currentStyle.fontFamily || 'Inter, sans-serif',
          fontSize: updates.fontSize !== undefined ? updates.fontSize : currentStyle.fontSize || '1rem',
          fontWeight: updates.fontWeight !== undefined ? updates.fontWeight : currentStyle.fontWeight || '400',
          textAlign: updates.textAlign !== undefined ? updates.textAlign : currentStyle.textAlign || 'left',
          lineHeight: updates.lineHeight !== undefined ? updates.lineHeight : currentStyle.lineHeight,
          letterSpacing: updates.letterSpacing !== undefined ? updates.letterSpacing : currentStyle.letterSpacing,
          color: updates.color !== undefined ? updates.color : currentStyle.color || '#000000',
          textShadow: updates.textShadow !== undefined ? updates.textShadow : currentStyle.textShadow || 'none',
          textTransform: updates.textTransform !== undefined ? updates.textTransform : currentStyle.textTransform
        }
      };
      onComponentChange(selectedTarget.componentId, textUpdates);
    }
    
    if (selectedComponent.type === 'image') {
      const imageUpdates: Partial<ImageComponentConfig> = {
        ...componentUpdates,
        imageUrl: updates.imageUrl,
        size: updates.size,
        opacity: updates.opacity,
        fit: updates.objectFit,
        customSize: updates.size === 'custom' ? {
          width: updates.width || '100px',
          height: updates.height || '100px'
        } : undefined
      };
      onComponentChange(selectedTarget.componentId, imageUpdates);
    }
  }, [selectedComponent, selectedTarget.componentId, onComponentChange]);
  
  // Función unificada para actualizar estilos
  const updateStyles = useCallback((updates: Partial<UnifiedStyleConfig>) => {
    if (selectedTarget.type === 'component') {
      updateComponentStyles(updates);
    } else {
      updatePageStyles(updates);
    }
  }, [selectedTarget.type, updateComponentStyles, updatePageStyles]);
  
  // Información de selección
  const selectionInfo = useMemo(() => {
    if (selectedTarget.type === 'component' && selectedComponent) {
      return {
        type: 'component' as const,
        name: selectedComponent.name,
        typeName: selectedComponent.type,
        isEditable: true
      };
    } else {
      const pageNames = {
        cover: 'Portada',
        page: 'Página Interior',
        dedicatoria: 'Dedicatoria',
        contraportada: 'Contraportada'
      };
      return {
        type: 'page' as const,
        name: pageNames[pageType] || 'Página',
        typeName: 'text',
        isEditable: true
      };
    }
  }, [selectedTarget, selectedComponent, pageType]);
  
  // Controles disponibles según el tipo
  const availableControls = useMemo(() => {
    if (selectedTarget.type === 'component' && selectedComponent) {
      const isText = selectedComponent.type === 'text';
      const isImage = selectedComponent.type === 'image';
      
      return {
        typography: isText,
        colors: isText,
        position: true,
        effects: isText,
        container: false,
        image: isImage
      };
    } else {
      return {
        typography: true,
        colors: true,
        position: true,
        effects: true,
        container: true,
        image: false
      };
    }
  }, [selectedTarget, selectedComponent]);
  
  return {
    currentStyles,
    updateStyles,
    selectionInfo,
    availableControls
  };
};

export default useStyleAdapter;