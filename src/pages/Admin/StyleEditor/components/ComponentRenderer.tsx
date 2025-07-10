import React, { useState, useRef, useCallback } from 'react';
import { ComponentConfig, TextComponentConfig, ImageComponentConfig } from '../../../../types/styleConfig';
import { getScaledFontSize } from '../../../../utils/storyStyleUtils';

interface ComponentRendererProps {
  components: ComponentConfig[];
  pageType: 'cover' | 'page' | 'dedicatoria';
  selectedComponentId?: string;
  onComponentSelect?: (componentId: string | null) => void;
  onComponentUpdate?: (componentId: string, updates: Partial<ComponentConfig>) => void;
  containerDimensions?: { width: number; height: number };
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  components,
  pageType,
  selectedComponentId,
  onComponentSelect,
  onComponentUpdate,
  containerDimensions
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0, isSnapping: false });
  const containerRef = useRef<HTMLDivElement>(null);

  
  // Función para manejar el drag and drop
  const handleMouseDown = useCallback((e: React.MouseEvent, component: ComponentConfig) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    onComponentSelect?.(component.id);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const container = containerRef.current?.getBoundingClientRect();
    
    if (container) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, [onComponentSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedComponentId || !containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - container.left - dragOffset.x;
    const newY = e.clientY - container.top - dragOffset.y;
    
    // Limitar a los bounds del contenedor
    let boundedX = Math.max(0, Math.min(newX, container.width - 50));
    let boundedY = Math.max(0, Math.min(newY, container.height - 50));
    
    // Snap to grid si se mantiene presionado Ctrl
    const isSnapping = e.ctrlKey;
    if (isSnapping) {
      const gridSize = 10;
      boundedX = Math.round(boundedX / gridSize) * gridSize;
      boundedY = Math.round(boundedY / gridSize) * gridSize;
    }
    
    // Actualizar posición visual durante el drag
    setDragPosition({ x: boundedX, y: boundedY, isSnapping });
    
    onComponentUpdate?.(selectedComponentId, {
      x: boundedX,
      y: boundedY
    });
  }, [isDragging, selectedComponentId, dragOffset, onComponentUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Event listeners para drag and drop
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const renderComponent = (component: ComponentConfig) => {
    if (!component.visible) return null;

    const isSelected = selectedComponentId === component.id;
    
    // Estilos de posición comunes
    const getPositionStyles = (comp: ComponentConfig) => {
      const styles: React.CSSProperties = {
        position: 'absolute',
        zIndex: comp.zIndex || 1,
        cursor: isSelected ? 'move' : 'pointer',
      };

      // Si tiene coordenadas precisas, usarlas
      if (typeof comp.x === 'number' && typeof comp.y === 'number') {
        // Para componentes de fondo, usar posicionamiento especial
        if (comp.isBackground) {
          styles.left = '0';
          styles.top = '0';
          styles.width = '100%';
          styles.height = '100%';
        } else {
          styles.left = `${comp.x}px`;
          styles.top = `${comp.y}px`;
        }
        return styles;
      }

      // Fallback a posicionamiento por zones
      switch (comp.position) {
        case 'top':
          styles.top = '5%';
          break;
        case 'center':
          styles.top = '50%';
          styles.transform = 'translateY(-50%)';
          break;
        case 'bottom':
          styles.bottom = '5%';
          break;
      }

      switch (comp.horizontalPosition) {
        case 'left':
          styles.left = '5%';
          break;
        case 'center':
          styles.left = '50%';
          styles.transform = styles.transform 
            ? `${styles.transform} translateX(-50%)`
            : 'translateX(-50%)';
          break;
        case 'right':
          styles.right = '5%';
          break;
      }

      return styles;
    };

    if (component.type === 'text') {
      const textComponent = component as TextComponentConfig;
      const positionStyles = getPositionStyles(component);
      
      // Crear estilos escalados para el texto
      const scaledStyles = textComponent.style ? {
        ...textComponent.style,
        fontSize: textComponent.style.fontSize ? getScaledFontSize(textComponent.style.fontSize, containerDimensions) : textComponent.style.fontSize
      } : {};
      

      // Decodificar HTML entities en fontFamily para CSS
      const decodedFontFamily = scaledStyles?.fontFamily 
        ? scaledStyles.fontFamily
            .replace(/&amp;quot;/g, '"')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;#39;/g, "'")
        : undefined;
      
      // Calcular alineación y escalado del contenedor
      const containerStyle = (component as TextComponentConfig).containerStyle || {};
      
      // Aplicar alineación y escalado del contenedor
      let alignmentStyles: any = {};
      
      // Aplicar sistema de alineación si está configurado
      if (containerStyle.horizontalAlignment || containerStyle.verticalAlignment) {
        
        // Hacer el contenedor un flexbox
        alignmentStyles.display = 'flex';
        alignmentStyles.flexDirection = 'column';
        alignmentStyles.height = '100%';
        alignmentStyles.width = '100%';
        
        // Aplicar alineación horizontal (afecta alignItems en flexbox)
        if (containerStyle.horizontalAlignment) {
          switch (containerStyle.horizontalAlignment) {
            case 'left':
              alignmentStyles.alignItems = 'flex-start';
              alignmentStyles.textAlign = 'left';
              break;
            case 'center':
              alignmentStyles.alignItems = 'center';
              alignmentStyles.textAlign = 'center';
              break;
            case 'right':
              alignmentStyles.alignItems = 'flex-end';
              alignmentStyles.textAlign = 'right';
              break;
          }
        }
        
        // Aplicar alineación vertical (afecta justifyContent en flexbox)
        if (containerStyle.verticalAlignment) {
          switch (containerStyle.verticalAlignment) {
            case 'top':
              alignmentStyles.justifyContent = 'flex-start';
              break;
            case 'center':
              alignmentStyles.justifyContent = 'center';
              break;
            case 'bottom':
              alignmentStyles.justifyContent = 'flex-end';
              break;
          }
        }
      }
      
      // Aplicar escalado de contenido
      let scaleStyles: any = {};
      if (containerStyle.scaleWidth || containerStyle.scaleHeight) {
        
        // Aplicar ancho - CORREGIDO: usar maxWidth para evitar overflow
        if (containerStyle.scaleWidth && containerStyle.scaleWidth !== '100') {
          const widthValue = containerStyle.scaleWidth + (containerStyle.scaleWidthUnit || '%');
          if (containerStyle.scaleWidthUnit === 'auto') {
            scaleStyles.width = 'auto';
          } else {
            scaleStyles.maxWidth = widthValue;
            scaleStyles.width = widthValue;
          }
        }
        
        // Aplicar alto - Para componentes de texto, priorizar altura automática
        if (containerStyle.scaleHeight && containerStyle.scaleHeight !== '100') {
          const heightValue = containerStyle.scaleHeight + (containerStyle.scaleHeightUnit || '%');
          if (containerStyle.scaleHeightUnit === 'auto') {
            scaleStyles.height = 'auto';
          } else {
            // Para componentes de texto, usar height: auto por defecto a menos que se especifique lo contrario
            if (component.type === 'text') {
              scaleStyles.height = 'auto';
              // Solo aplicar minHeight si es realmente necesario (valores muy pequeños)
              const heightNumber = parseInt(containerStyle.scaleHeight);
              if (heightNumber < 50 && containerStyle.scaleHeightUnit === '%') {
                scaleStyles.minHeight = heightValue;
              }
            } else {
              scaleStyles.minHeight = heightValue;
            }
            
            // Para textos, usar min-height en lugar de height fija
            if (containerStyle.scaleHeightUnit === 'px') {
              scaleStyles.fontSize = 'calc(' + (scaledStyles.fontSize || '2rem') + ' * ' + (parseInt(containerStyle.scaleHeight) / 100) + ')';
            }
          }
        }
        
        // Mantener calidad al escalar
        if (containerStyle.maintainAspectRatio) {
          scaleStyles.aspectRatio = 'auto';
          scaleStyles.objectFit = 'contain';
        }
      }
      
      // Log adicional para verificar el style final que se aplicará
      const finalStyle = {
        ...positionStyles,
        // Aplicar maxWidth - para componentes de autor usar 95%, otros 85%
        maxWidth: scaleStyles.width || scaleStyles.maxWidth || 
                  (component.name?.includes('Autor') ? '95%' : '85%'),
        transition: isDragging ? 'none' : 'all 0.2s ease',
        ...scaledStyles,
        ...alignmentStyles,
        ...scaleStyles,
        background: scaledStyles?.backgroundColor || 'transparent',
        borderRadius: scaledStyles?.borderRadius || '0',
        padding: scaledStyles?.padding || '0',
        border: scaledStyles?.border || 'none',
        boxShadow: scaledStyles?.boxShadow || 'none',
        backdropFilter: scaledStyles?.backdropFilter || 'none',
        opacity: scaledStyles?.opacity !== undefined ? scaledStyles.opacity : 1,
        zIndex: component.zIndex || 0,
        userSelect: 'none',
        fontFamily: decodedFontFamily,  // ✅ Usar la versión decodificada
        // Asegurar que la altura sea automática para texto
        height: component.type === 'text' ? 'auto' : finalStyle.height,
        // Estilos adicionales para debug
        border: alignmentStyles.display ? '2px dashed rgba(128, 90, 213, 0.3)' : (scaledStyles?.border || 'none'),
      };
      
      
      return (
        <div
          key={component.id}
          data-component-id={component.id}
          onClick={(e) => {
            e.stopPropagation();
            onComponentSelect?.(component.id);
          }}
          onMouseDown={(e) => handleMouseDown(e, component)}
          style={finalStyle}
          className={`
            ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
            hover:outline hover:outline-2 hover:outline-purple-300
            ${isDragging ? 'cursor-grabbing' : ''}
          `}
        >
          {textComponent.content || component.name}
        </div>
      );
    }

    if (component.type === 'image') {
      const imageComponent = component as ImageComponentConfig;
      const positionStyles = getPositionStyles(component);
      
      // Calcular escalado y alineación del contenedor para imágenes
      const containerStyle = (component as ImageComponentConfig).containerStyle || {};
      
      
      // Determinar tamaño base
      let sizeStyles: React.CSSProperties = {};
      
      // Para componentes de fondo, usar tamaño completo
      if (imageComponent.isBackground) {
        sizeStyles = { width: '100%', height: '100%' };
      } else {
        // Aplicar escalado personalizado si existe
        if (containerStyle.scaleWidth || containerStyle.scaleHeight) {
          
          if (containerStyle.scaleWidth) {
            const widthValue = containerStyle.scaleWidth + (containerStyle.scaleWidthUnit || '%');
            sizeStyles.width = containerStyle.scaleWidthUnit === 'auto' ? 'auto' : widthValue;
          }
          
          if (containerStyle.scaleHeight) {
            const heightValue = containerStyle.scaleHeight + (containerStyle.scaleHeightUnit || '%');
            sizeStyles.height = containerStyle.scaleHeightUnit === 'auto' ? 'auto' : heightValue;
          }
          
          // Mantener aspecto si está habilitado
          if (containerStyle.maintainAspectRatio) {
            sizeStyles.aspectRatio = 'auto';
            sizeStyles.objectFit = 'contain';
          }
        } else {
          // Usar tamaños predefinidos
          switch (imageComponent.size) {
            case 'small':
              sizeStyles = { width: '100px', height: '100px' };
              break;
            case 'medium':
              sizeStyles = { width: '200px', height: '200px' };
              break;
            case 'large':
              sizeStyles = { width: '300px', height: '300px' };
              break;
            case 'custom':
              sizeStyles = { 
                width: imageComponent.width || '200px', 
                height: imageComponent.height || '200px' 
              };
              break;
            default:
              sizeStyles = { width: '200px', height: '200px' };
          }
        }
      }
      
      // Aplicar alineación a imágenes
      let imageAlignmentStyles: any = {};
      if (containerStyle.horizontalAlignment || containerStyle.verticalAlignment) {
        
        imageAlignmentStyles.display = 'flex';
        imageAlignmentStyles.width = '100%';
        imageAlignmentStyles.height = '100%';
        
        // Alineación horizontal
        if (containerStyle.horizontalAlignment) {
          switch (containerStyle.horizontalAlignment) {
            case 'left':
              imageAlignmentStyles.justifyContent = 'flex-start';
              break;
            case 'center':
              imageAlignmentStyles.justifyContent = 'center';
              break;
            case 'right':
              imageAlignmentStyles.justifyContent = 'flex-end';
              break;
          }
        }
        
        // Alineación vertical
        if (containerStyle.verticalAlignment) {
          switch (containerStyle.verticalAlignment) {
            case 'top':
              imageAlignmentStyles.alignItems = 'flex-start';
              break;
            case 'center':
              imageAlignmentStyles.alignItems = 'center';
              break;
            case 'bottom':
              imageAlignmentStyles.alignItems = 'flex-end';
              break;
          }
        }
      }

      return (
        <div
          key={component.id}
          data-component-id={component.id}
          onClick={(e) => {
            e.stopPropagation();
            onComponentSelect?.(component.id);
          }}
          onMouseDown={(e) => handleMouseDown(e, component)}
          style={{
            ...positionStyles,
            ...sizeStyles,
            ...imageAlignmentStyles,
            cursor: isSelected ? 'move' : 'pointer',
            transition: isDragging ? 'none' : 'all 0.2s ease',
            ...imageComponent.style,
            // Aplicar estilos específicos para garantizar compatibilidad
            borderRadius: imageComponent.style?.borderRadius || '0',
            border: imageAlignmentStyles.display ? '2px dashed rgba(128, 90, 213, 0.3)' : (imageComponent.style?.border || 'none'),
            boxShadow: imageComponent.style?.boxShadow || 'none',
            backdropFilter: imageComponent.style?.backdropFilter || 'none',
            opacity: imageComponent.style?.opacity !== undefined ? imageComponent.style.opacity : 1,
            zIndex: component.zIndex || 0,
            userSelect: 'none', // Evitar selección durante drag
          }}
          className={`
            ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
            hover:outline hover:outline-2 hover:outline-purple-300
            ${isDragging ? 'cursor-grabbing' : ''}
          `}
        >
          {imageComponent.url ? (
            <img
              src={imageComponent.url}
              alt={component.name}
              onError={(e) => console.error('❌ Image failed to load:', imageComponent.url, e)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: imageComponent.objectFit || 'cover',
                borderRadius: 'inherit', // Heredar el borderRadius del contenedor
              }}
            />
          ) : (
            <div 
              className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm"
              style={{ borderRadius: 'inherit' }}
            >
              {imageComponent.imageType === 'dynamic' ? (
                <div className="text-center">
                  <div className="font-medium text-green-600 dark:text-green-400">Imagen Usuario</div>
                  <div className="text-xs mt-1">Referencia</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="font-medium">Sin imagen</div>
                  <div className="text-xs mt-1">{component.name}</div>
                </div>
              )}
            </div>
          )}
          
          {/* Overlay para imágenes dinámicas */}
          {imageComponent.imageType === 'dynamic' && imageComponent.url && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded flex items-center justify-center">
              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                REFERENCIA
              </span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Filtrar componentes por tipo de página y ordenar por zIndex
  const pageComponents = components
    .filter(comp => comp.pageType === pageType)
    .sort((a, b) => {
      const zIndexA = a.zIndex || 0;
      const zIndexB = b.zIndex || 0;
      return zIndexA - zIndexB; // Orden ascendente: -1, 0, 1, 10, etc.
    });
  

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      {pageComponents.map(component => renderComponent(component))}
      
      {/* Indicador de coordenadas durante drag */}
      {isDragging && selectedComponentId && (
        <div
          className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded shadow-lg z-50 pointer-events-none ${
            dragPosition.isSnapping ? 'bg-green-600' : 'bg-purple-600'
          }`}
          style={{
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          x: {Math.round(dragPosition.x)}px, y: {Math.round(dragPosition.y)}px
          {dragPosition.isSnapping && <span className="ml-1">📏</span>}
        </div>
      )}
      
      {/* Estilos CSS para animación */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `
      }} />
    </div>
  );
};

export default ComponentRenderer;