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
  // Usar dimensiones fijas consistentes como en Wizard para garantizar misma escala
  const dimensions = { width: 1536, height: 1024 };

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Contenedor con scroll para dimensiones fijas */}
      <div className="overflow-auto max-h-[70vh] flex items-center justify-center p-4">
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
    </div>
  );
};

export default StylePreview;