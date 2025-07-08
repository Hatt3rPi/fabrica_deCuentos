import React, { useState, useRef, useCallback } from 'react';
import { ComponentConfig, TextComponentConfig, ImageComponentConfig } from '../../../../types/styleConfig';

interface ComponentRendererProps {
  components: ComponentConfig[];
  pageType: 'cover' | 'page' | 'dedicatoria';
  selectedComponentId?: string;
  onComponentSelect?: (componentId: string | null) => void;
  onComponentUpdate?: (componentId: string, updates: Partial<ComponentConfig>) => void;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  components,
  pageType,
  selectedComponentId,
  onComponentSelect,
  onComponentUpdate
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
        styles.left = `${comp.x}px`;
        styles.top = `${comp.y}px`;
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
            maxWidth: '85%',
            transition: isDragging ? 'none' : 'all 0.2s ease',
            ...textComponent.style,
            // Aplicar estilos específicos para garantizar compatibilidad
            background: textComponent.style?.backgroundColor || 'transparent',
            borderRadius: textComponent.style?.borderRadius || '0',
            padding: textComponent.style?.padding || '0',
            border: textComponent.style?.border || 'none',
            boxShadow: textComponent.style?.boxShadow || 'none',
            backdropFilter: textComponent.style?.backdropFilter || 'none',
            opacity: textComponent.style?.opacity !== undefined ? textComponent.style.opacity : 1,
            userSelect: 'none', // Evitar selección de texto durante drag
          }}
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
      
      // Determinar tamaño
      let sizeStyles: React.CSSProperties = {};
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
            cursor: isSelected ? 'move' : 'pointer',
            transition: isDragging ? 'none' : 'all 0.2s ease',
            ...imageComponent.style,
            // Aplicar estilos específicos para garantizar compatibilidad
            borderRadius: imageComponent.style?.borderRadius || '0',
            border: imageComponent.style?.border || 'none',
            boxShadow: imageComponent.style?.boxShadow || 'none',
            backdropFilter: imageComponent.style?.backdropFilter || 'none',
            opacity: imageComponent.style?.opacity !== undefined ? imageComponent.style.opacity : 1,
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

  // Filtrar componentes por tipo de página
  const pageComponents = components.filter(comp => comp.pageType === pageType);

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