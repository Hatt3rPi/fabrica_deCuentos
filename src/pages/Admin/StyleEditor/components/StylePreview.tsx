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
}

const StylePreview: React.FC<StylePreviewProps> = ({
  config,
  pageType,
  sampleImage,
  sampleText,
  showGrid,
  showRulers,
  zoomLevel
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

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Preview Container con zoom */}
      <div 
        ref={containerRef}
        className="relative"
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