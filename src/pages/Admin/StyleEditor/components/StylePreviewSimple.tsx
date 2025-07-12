import React, { useRef, useEffect, useState } from 'react';
import { StoryStyleConfig, ComponentConfig } from '../../../../types/styleConfig';
import { StoryRenderer } from '../../../../components/StoryRenderer';
import ComponentRenderer from './ComponentRenderer';
import TemplateRenderer from '../../../../components/unified/TemplateRenderer';
import { UnifiedRenderOptions } from '../../../../types/unifiedTemplate';

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
  onComponentUpdate?: (componentId: string, updates: Partial<ComponentConfig>) => void;
  components?: ComponentConfig[];
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
  useUnifiedRenderer?: boolean;
}

const StylePreviewSimple: React.FC<StylePreviewProps> = ({
  config,
  pageType,
  sampleImage,
  sampleText,
  showGrid,
  showRulers,
  zoomLevel,
  selectedComponentId,
  onComponentSelect,
  onComponentUpdate,
  components = [],
  onDimensionsChange,
  useUnifiedRenderer = true
}) => {
  // Test 14: Agregar useRef y useState del original
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = zoomLevel / 100;
  const [dimensions, setDimensions] = useState({ width: 1536, height: 1024 });

  // Test 15: Agregar useEffect del original (SOSPECHOSO)
  useEffect(() => {
    const updateDimensions = () => {
      const container = containerRef.current?.parentElement;
      if (!container) return;
      
      const { width: containerWidth } = container.getBoundingClientRect();
      const padding = 64;
      const availableWidth = containerWidth - padding;
      
      // Mantener aspect ratio 3:2
      const aspectRatio = 3/2;
      const maxWidth = 1536;
      const maxHeight = 1024;
      
      let width = Math.min(availableWidth, maxWidth);
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      if (window.innerWidth < 768) {
        width = availableWidth;
        height = width / aspectRatio;
      }
      
      const newDimensions = { 
        width: Math.floor(width), 
        height: Math.floor(height) 
      };
      
      setDimensions(newDimensions);
      onDimensionsChange?.(newDimensions);
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [zoomLevel, onDimensionsChange]);

  // Test 16: Agregar handleClick del original
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onComponentSelect) return;
    
    const target = e.target as HTMLElement;
    const componentElement = target.closest('[data-component-id]') as HTMLElement;
    
    if (componentElement) {
      const componentId = componentElement.getAttribute('data-component-id');
      onComponentSelect(componentId);
    } else {
      onComponentSelect(null);
    }
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Test 16: Agregar el JSX complejo del StylePreview original */}
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
          ` : ''}

          .story-page {
            position: relative;
            cursor: pointer;
          }
        `
      }} />
      
      {/* Test 17: Agregar el TemplateRenderer - SOSPECHOSO MÁXIMO */}
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
        <div 
          className="story-page relative w-full h-full overflow-hidden"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            backgroundColor: 'transparent'
          }}
        >
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-40">
            Test 17: TemplateRenderer
          </div>
          
          {useUnifiedRenderer ? (
            <div className="absolute inset-0">
              <TemplateRenderer
                config={config}
                pageType={pageType === 'page' ? 'content' : pageType}
                content={{
                  title: pageType === 'cover' ? sampleText : undefined,
                  text: pageType !== 'cover' ? sampleText : undefined,
                  authorName: pageType === 'cover' ? 'Autor Demo' : undefined
                }}
                renderOptions={{
                  context: 'admin-edit',
                  enableScaling: true,
                  preserveAspectRatio: true,
                  targetDimensions: dimensions,
                  features: {
                    enableAnimations: false,
                    enableInteractions: true,
                    enableDebugInfo: false,
                    enableValidation: true
                  },
                  performance: {
                    lazyLoadImages: false,
                    optimizeFor: 'quality'
                  }
                } as UnifiedRenderOptions}
                onComponentSelect={onComponentSelect}
                onComponentUpdate={onComponentUpdate}
                selectedComponentId={selectedComponentId}
                debug={true}
              />
            </div>
          ) : (
            <ComponentRenderer
              components={components}
              pageType={pageType}
              selectedComponentId={selectedComponentId}
              onComponentSelect={onComponentSelect}
              onComponentUpdate={onComponentUpdate}
              containerDimensions={dimensions}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StylePreviewSimple;