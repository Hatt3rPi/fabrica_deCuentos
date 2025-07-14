// StylePreviewTDD - Integración del nuevo sistema unificado con el AdminStyleEditor
import React, { useMemo } from 'react';
import { StoryRenderer } from '../../../../components/StoryRenderer/UnifiedStoryRenderer';
import { convertLegacyToUnified } from '../../../../utils/styleConfigMigrator';
import { ComponentConfig } from '../../../../types/styleConfig';

interface StylePreviewTDDProps {
  activeConfig: any;
  currentPageType: 'cover' | 'page' | 'dedicatoria';
  sampleText: string;
  zoomLevel: number;
  showGrid: boolean;
  showRulers: boolean;
  selectedComponent?: ComponentConfig | null;
  onComponentSelect?: (componentId: string) => void;
  allComponents?: ComponentConfig[];
}

const StylePreviewTDD: React.FC<StylePreviewTDDProps> = ({
  activeConfig,
  currentPageType,
  sampleText,
  zoomLevel,
  showGrid,
  showRulers,
  selectedComponent,
  onComponentSelect,
  allComponents = []
}) => {
  // Convertir la configuración legacy a formato unificado
  const unifiedConfig = useMemo(() => {
    if (!activeConfig) return null;

    // Crear estructura legacy para migración
    const legacyConfig: any = {};
    
    // Construir configuración de la página actual
    if (currentPageType === 'cover' && activeConfig.coverConfig) {
      legacyConfig.cover = {
        background: activeConfig.coverConfig.background,
        components: allComponents.filter(c => c.pageType === 'cover')
      };
    } else if (currentPageType === 'page' && activeConfig.pageConfig) {
      legacyConfig.page = {
        background: activeConfig.pageConfig.background,
        components: allComponents.filter(c => c.pageType === 'page')
      };
    } else if (currentPageType === 'dedicatoria' && activeConfig.dedicatoriaConfig) {
      legacyConfig.dedicatoria = {
        background: activeConfig.dedicatoriaConfig.background,
        components: allComponents.filter(c => c.pageType === 'dedicatoria')
      };
    }

    return convertLegacyToUnified(legacyConfig);
  }, [activeConfig, currentPageType, allComponents]);

  // Datos de historia para reemplazo de contenido
  const storyData = useMemo(() => ({
    title: sampleText,
    pages: []
  }), [sampleText]);

  if (!unifiedConfig) {
    return <div>Loading...</div>;
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
    >
      {/* Grid overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="grid grid-cols-3 grid-rows-3 h-full w-full">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-dashed border-gray-300 dark:border-gray-600 opacity-50" />
            ))}
          </div>
        </div>
      )}

      {/* Rulers */}
      {showRulers && (
        <>
          <div className="absolute top-0 left-0 right-0 h-6 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 pointer-events-none z-20">
            {/* Ruler marks */}
            <div className="relative h-full">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 w-px h-3 bg-gray-400 dark:bg-gray-500"
                  style={{ left: `${i * 5}%` }}
                />
              ))}
            </div>
          </div>
          <div className="absolute top-0 left-0 bottom-0 w-6 bg-gray-100 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 pointer-events-none z-20">
            {/* Ruler marks */}
            <div className="relative w-full h-full">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 h-px w-3 bg-gray-400 dark:bg-gray-500"
                  style={{ top: `${i * 5}%` }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Story Renderer with TDD system */}
      <div 
        data-testid="story-preview"
        className={`relative ${showRulers ? 'ml-6 mt-6' : ''}`}
      >
        <StoryRenderer
          config={unifiedConfig}
          pageType={currentPageType}
          context="admin-edit"
          storyData={storyData}
          selectedComponentId={selectedComponent?.id}
          onComponentSelect={onComponentSelect}
        />
      </div>
    </div>
  );
};

export default StylePreviewTDD;