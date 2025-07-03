import React, { useRef, useEffect, useState } from 'react';
import { StoryStyleConfig, PageType } from '../../../../types/styleConfig';
import { StoryRenderer } from '../../../../components/StoryRenderer';

interface StylePreviewProps {
  config: StoryStyleConfig;
  pageType: PageType;
  sampleImage: string;
  sampleText: string;
  showGrid: boolean;
  showRulers: boolean;
  zoomLevel: number;
  selectedComponentId?: string;
  onComponentSelect?: (componentId: string | null) => void;
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
  onComponentSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = zoomLevel / 100;
  // Usar dimensiones fijas consistentes como en Wizard para garantizar misma escala
  const dimensions = { width: 1536, height: 1024 };

  // Manejar clicks en componentes
  const handleComponentClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    
    // Buscar el componente más cercano
    const componentElement = target.closest('[data-component-id]') as HTMLElement;
    
    if (componentElement && onComponentSelect) {
      const componentId = componentElement.getAttribute('data-component-id');
      onComponentSelect(componentId);
    } else if (onComponentSelect) {
      // Click en área vacía - seleccionar página
      onComponentSelect(null);
    }
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Contenedor con scroll para dimensiones fijas */}
      <div className="overflow-auto max-h-[70vh] flex items-center justify-center p-4">
        {/* Preview Container con zoom */}
        <div 
          ref={containerRef}
          className="relative cursor-pointer"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            marginLeft: showRulers ? '1.5rem' : 0,
            marginTop: showRulers ? '1.5rem' : 0,
          }}
          onClick={handleComponentClick}
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

      {/* Estilos CSS inyectados para feedback visual de selección */}
      <style jsx>{`
        [data-component-id] {
          transition: all 0.2s ease;
          border-radius: 4px;
        }
        
        [data-component-id]:hover {
          outline: 2px solid rgba(147, 51, 234, 0.3);
          outline-offset: 2px;
          background-color: rgba(147, 51, 234, 0.05);
        }
        
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

        .story-page {
          position: relative;
        }
        
        .story-page:hover {
          outline: ${selectedComponentId ? 'none' : '1px dashed rgba(147, 51, 234, 0.4)'};
          outline-offset: 4px;
        }
      `}</style>
    </div>
  );
};

export default StylePreview;