import React from 'react';
import { ComponentConfig, TextComponentConfig, ImageComponentConfig } from '../../../../types/styleConfig';

interface ComponentRendererProps {
  components: ComponentConfig[];
  pageType: 'cover' | 'page' | 'dedicatoria';
  selectedComponentId?: string;
  onComponentSelect?: (componentId: string | null) => void;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  components,
  pageType,
  selectedComponentId,
  onComponentSelect
}) => {
  
  const renderComponent = (component: ComponentConfig) => {
    if (!component.visible) return null;

    const isSelected = selectedComponentId === component.id;
    
    // Estilos de posición comunes
    const getPositionStyles = (comp: ComponentConfig) => {
      const styles: React.CSSProperties = {
        position: 'absolute',
        zIndex: comp.zIndex || 1,
      };

      // Posición vertical
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

      // Posición horizontal
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
          style={{
            ...positionStyles,
            maxWidth: '85%',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ...textComponent.style,
            // Convertir algunos estilos para compatibilidad
            background: textComponent.style?.backgroundColor || 'transparent',
          }}
          className={`
            ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
            hover:outline hover:outline-2 hover:outline-purple-300
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
          style={{
            ...positionStyles,
            ...sizeStyles,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ...imageComponent.style,
          }}
          className={`
            ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
            hover:outline hover:outline-2 hover:outline-purple-300
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
                borderRadius: imageComponent.style?.borderRadius || '0',
              }}
            />
          ) : (
            <div 
              className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm"
              style={{ borderRadius: imageComponent.style?.borderRadius || '0' }}
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
    <>
      {pageComponents.map(component => renderComponent(component))}
    </>
  );
};

export default ComponentRenderer;