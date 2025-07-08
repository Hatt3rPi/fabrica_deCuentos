import React, { useRef, useEffect, useState } from 'react';
import { StoryStyleConfig } from '../../../../types/styleConfig';
import { StoryRenderer } from '../../../../components/StoryRenderer';

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
  components?: any[];
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
        {/* StoryRenderer unificado con toda la lógica */}
        <StoryRenderer
          config={config}
          pageType={pageType}
          content={sampleText}
          imageUrl={sampleImage}
          context="admin"
          dimensions={dimensions}
          contextConfig={{
            admin: {
              showGrid,
              showRulers,
              zoomLevel
            }
          }}
          instanceId={`admin-preview-${pageType}`}
        />
      </div>
    </div>
  );
};

export default StylePreview;