import React, { useRef, useEffect, useState } from 'react';
import { StoryStyleConfig, ComponentConfig } from '../../../../types/styleConfig';
import { StoryRenderer } from '../../../../components/StoryRenderer';
import ComponentRenderer from './ComponentRenderer';

interface StylePreviewProps {
  config: StoryStyleConfig;
  pageType: 'cover' | 'page' | 'dedicatoria';
  sampleImage: string;
  sampleText: string;
  showGrid: boolean;
  showRulers: boolean;
  zoomLevel: number;
  selectedComponentId?: string;
  onComponentSelect?: (componentId: string | null) => void;
  components?: ComponentConfig[];
}

const StylePreview: React.FC<StylePreviewProps> = ({
  config,
  pageType,
  sampleImage,
  sampleText,
  showGrid,
  showRulers,
  zoomLevel,
  selectedComponentId,
  onComponentSelect,
  components = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = zoomLevel / 100;
  const [dimensions, setDimensions] = useState({ width: 1536, height: 1024 });

  // Calcular dimensiones responsivas
  useEffect(() => {
    const updateDimensions = () => {
      const container = containerRef.current?.parentElement;
      if (!container) return;
      
      const { width: containerWidth } = container.getBoundingClientRect();
      const padding = 64; // 4rem total (2rem cada lado)
      const availableWidth = containerWidth - padding;
      
      // Mantener aspect ratio 3:2
      const aspectRatio = 3/2;
      const maxWidth = 1536;
      const maxHeight = 1024;
      
      // Calcular basado en el ancho disponible
      let width = Math.min(availableWidth, maxWidth);
      let height = width / aspectRatio;
      
      // Si la altura calculada excede el máximo, ajustar por altura
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      // Para móviles, usar el 100% del ancho disponible
      if (window.innerWidth < 768) {
        width = availableWidth;
        height = width / aspectRatio;
      }
      
      setDimensions({ 
        width: Math.floor(width), 
        height: Math.floor(height) 
      });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [zoomLevel]);

  // Manejar clicks en el preview
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onComponentSelect) return;
    
    const target = e.target as HTMLElement;
    
    // Buscar el componente más cercano
    const componentElement = target.closest('[data-component-id]') as HTMLElement;
    
    if (componentElement) {
      const componentId = componentElement.getAttribute('data-component-id');
      onComponentSelect(componentId);
    } else {
      // Click en área vacía - seleccionar página
      onComponentSelect(null);
    }
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Estilos CSS inyectados para feedback visual de selección */}
      <style dangerouslySetInnerHTML={{
        __html: `
          [data-component-id] {
            transition: all 0.2s ease;
            border-radius: 4px;
            cursor: pointer;
          }
          
          [data-component-id]:hover {
            outline: 2px solid rgba(147, 51, 234, 0.3);
            outline-offset: 2px;
            background-color: rgba(147, 51, 234, 0.05);
          }
          
          ${selectedComponentId ? `
            [data-component-id="${selectedComponentId}"] {
              outline: 2px solid rgba(147, 51, 234, 0.8) !important;
              outline-offset: 2px;
              background-color: rgba(147, 51, 234, 0.1) !important;
              box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.2);
            }
            
            [data-component-id="${selectedComponentId}"]:after {
              content: '';
              position: absolute;
              top: -8px;
              right: -8px;
              width: 12px;
              height: 12px;
              background: #9333ea;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
          ` : ''}

          .story-page {
            position: relative;
            cursor: pointer;
          }
          
          .story-page:hover {
            outline: ${selectedComponentId ? 'none' : '1px dashed rgba(147, 51, 234, 0.4)'};
            outline-offset: 4px;
          }
        `
      }} />
      
      {/* Preview Container con zoom */}
      <div 
        ref={containerRef}
        className="relative"
        onClick={handleClick}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          marginLeft: showRulers ? '1.5rem' : 0,
          marginTop: showRulers ? '1.5rem' : 0,
        }}
      >
        {/* Contenedor de página con imagen de fondo */}
        <div 
          className="story-page relative w-full h-full bg-cover bg-center bg-no-repeat overflow-hidden"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            backgroundImage: sampleImage ? `url(${sampleImage})` : undefined,
            backgroundColor: sampleImage ? 'transparent' : '#f3f4f6'
          }}
        >
          {/* Overlay para grid si está habilitado */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <svg className="w-full h-full">
                <defs>
                  <pattern id={`grid-${pageType}`} width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(147, 51, 234, 0.2)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#grid-${pageType})`} />
              </svg>
            </div>
          )}
          
          {/* Rulers si están habilitados */}
          {showRulers && (
            <>
              {/* Horizontal Ruler */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 z-30">
                <div className="relative h-full">
                  {Array.from({ length: Math.floor(dimensions.width / 50) }, (_, i) => (
                    <div
                      key={`h-${i}`}
                      className="absolute top-0 w-px bg-gray-400 dark:bg-gray-500"
                      style={{ 
                        left: `${i * 50}px`,
                        height: i % 5 === 0 ? '100%' : '50%'
                      }}
                    >
                      {i % 5 === 0 && i > 0 && (
                        <span className="absolute -top-1 -left-3 text-xs text-gray-600 dark:text-gray-400">
                          {i * 50}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Vertical Ruler */}
              <div className="absolute top-0 left-0 bottom-0 w-6 bg-gray-100 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600 z-30">
                <div className="relative w-full h-full">
                  {Array.from({ length: Math.floor(dimensions.height / 50) }, (_, i) => (
                    <div
                      key={`v-${i}`}
                      className="absolute left-0 h-px bg-gray-400 dark:bg-gray-500"
                      style={{ 
                        top: `${i * 50}px`,
                        width: i % 5 === 0 ? '100%' : '50%'
                      }}
                    >
                      {i % 5 === 0 && i > 0 && (
                        <span className="absolute -left-1 -top-2 text-xs text-gray-600 dark:text-gray-400 -rotate-90 origin-left">
                          {i * 50}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {/* Page Type Indicator */}
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-40">
            {pageType === 'cover' ? 'Portada' : 
             pageType === 'dedicatoria' ? 'Dedicatoria' : 
             'Página Interior'}
          </div>
          
          {/* Zoom Indicator */}
          {zoomLevel !== 100 && (
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-40">
              {zoomLevel}%
            </div>
          )}

          {/* Componentes renderizados */}
          <ComponentRenderer
            components={components}
            pageType={pageType}
            selectedComponentId={selectedComponentId}
            onComponentSelect={onComponentSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default StylePreview;