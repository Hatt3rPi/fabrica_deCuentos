// Componente unificado para renderizado de cuentos
// Usado por Admin, Wizard y como base para PDF
// Garantiza consistencia visual perfecta entre contextos

import React from 'react';
import { StoryStyleConfig } from '../../types/styleConfig';
import { 
  applyStandardStyles, 
  PageType, 
  RenderContext,
  debugStyleConfig 
} from '../../utils/storyStyleUtils';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface StoryRendererProps {
  /** Configuración de estilos a aplicar */
  config: StoryStyleConfig | null | undefined;
  
  /** Tipo de página a renderizar */
  pageType: PageType;
  
  /** Contenido de texto a mostrar */
  content: string;
  
  /** URL de imagen de fondo (opcional) */
  imageUrl?: string;
  
  /** Contexto de renderizado para optimizaciones específicas */
  context?: RenderContext;
  
  /** Dimensiones del contenedor (para admin con zoom) */
  dimensions?: {
    width: number;
    height: number;
  };
  
  /** Configuraciones adicionales por contexto */
  contextConfig?: {
    admin?: {
      showGrid?: boolean;
      showRulers?: boolean;
      zoomLevel?: number;
      allowInlineEdit?: boolean;
    };
    wizard?: {
      allowInlineEdit?: boolean;
      onTextChange?: (newText: string) => void;
      showNavigation?: boolean;
    };
    pdf?: {
      aspectRatio?: 'portrait' | 'landscape' | 'square';
      optimizeForPrint?: boolean;
    };
  };
  
  /** Props adicionales para debugging */
  debug?: boolean;
  
  /** Callback para errores */
  onError?: (error: Error) => void;
  
  /** ID único para identificar esta instancia */
  instanceId?: string;
}

export interface StoryRendererRef {
  getAppliedStyles: () => ReturnType<typeof applyStandardStyles>;
  validateConfig: () => boolean;
  captureHTML: () => string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const StoryRenderer = React.forwardRef<StoryRendererRef, StoryRendererProps>(
  ({
    config,
    pageType,
    content,
    imageUrl,
    context = 'admin',
    dimensions = { width: 1536, height: 1024 },
    contextConfig,
    debug = false,
    onError,
    instanceId = 'story-renderer'
  }, ref) => {
    
    // ========================================================================
    // ESTADO Y REFS
    // ========================================================================
    
    const containerRef = React.useRef<HTMLDivElement>(null);
    
    // ========================================================================
    // MEMOIZACIÓN DE ESTILOS (OPTIMIZADO)
    // ========================================================================
    
    // Memoizar el cálculo de estilos para evitar recálculos innecesarios
    const appliedStyles = React.useMemo(() => {
      try {
        const styles = applyStandardStyles(config, pageType, context);
        
        if (debug) {
          console.log(`[StoryRenderer:${instanceId}] Estilos aplicados:`, {
            pageType,
            context,
            config: debugStyleConfig(config, pageType)
          });
        }
        
        return styles;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`[StoryRenderer:${instanceId}] Error aplicando estilos:`, err);
        onError?.(err);
        
        // Devolver estilos por defecto en caso de error
        return applyStandardStyles(null, pageType, context);
      }
    }, [config, pageType, context, debug, instanceId, onError]);
    
    // ========================================================================
    // IMPERATIVO API (useImperativeHandle)
    // ========================================================================
    
    React.useImperativeHandle(ref, () => ({
      getAppliedStyles: () => appliedStyles,
      validateConfig: () => {
        try {
          applyStandardStyles(config, pageType, context);
          return true;
        } catch {
          return false;
        }
      },
      captureHTML: () => {
        return containerRef.current?.innerHTML || '';
      }
    }));
    
    // ========================================================================
    // CONFIGURACIONES POR CONTEXTO
    // ========================================================================
    
    const adminConfig = contextConfig?.admin;
    const wizardConfig = contextConfig?.wizard;
    const pdfConfig = contextConfig?.pdf;
    
    // ========================================================================
    // ESTILOS CALCULADOS
    // ========================================================================
    
    const { textStyle, containerStyle, positioning } = appliedStyles;
    
    // Estilo del contenedor principal de la página
    const pageContainerStyle: React.CSSProperties = {
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      overflow: 'hidden'
    };
    
    // Estilo del contenedor de posicionamiento
    const positioningContainerStyle: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      ...positioning,
      padding: pageType === 'page' ? '0' : '2rem'
    };
    
    // Estilo del contenedor de texto con configuración aplicada
    const textContainerStyle: React.CSSProperties = {
      ...containerStyle,
      position: 'relative',
      ...(pageType === 'page' && appliedStyles.textStyle && positioning.alignItems === 'flex-end' ? {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%'
      } : {})
    };
    
    // ========================================================================
    // RENDERIZADO DE CONTENIDO
    // ========================================================================
    
    const renderTextContent = () => {
      const textProps = {
        style: textStyle,
        'data-page-type': pageType,
        'data-context': context,
        'data-instance': instanceId
      };
      
      // Renderizado específico por tipo de página
      switch (pageType) {
        case 'cover':
          return <h1 {...textProps}>{content}</h1>;
          
        case 'dedicatoria':
          return <div {...textProps}>{content}</div>;
          
        case 'page':
        default:
          return <p {...textProps}>{content}</p>;
      }
    };
    
    // ========================================================================
    // OVERLAYS Y HERRAMIENTAS DE DESARROLLO
    // ========================================================================
    
    const renderAdminOverlays = () => {
      if (context !== 'admin' || !adminConfig) return null;
      
      return (
        <>
          {/* Grid Overlay */}
          {adminConfig.showGrid && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <svg className="w-full h-full">
                <defs>
                  <pattern id={`grid-${instanceId}`} width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(147, 51, 234, 0.2)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#grid-${instanceId})`} />
              </svg>
            </div>
          )}
          
          {/* Rulers */}
          {adminConfig.showRulers && (
            <>
              {/* Horizontal Ruler */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 z-30">
                <div className="relative h-full">
                  {Array.from({ length: 40 }, (_, i) => (
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
                  {Array.from({ length: 30 }, (_, i) => (
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
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {pageType === 'cover' ? 'Portada' : 
             pageType === 'dedicatoria' ? 'Dedicatoria' : 
             'Página Interior'}
          </div>
          
          {/* Zoom Indicator */}
          {adminConfig.zoomLevel && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {adminConfig.zoomLevel}%
            </div>
          )}
        </>
      );
    };
    
    // ========================================================================
    // DEBUG INFO
    // ========================================================================
    
    const renderDebugInfo = () => {
      if (!debug) return null;
      
      return (
        <div className="absolute top-0 left-0 bg-yellow-100 border border-yellow-300 p-2 text-xs max-w-xs z-50">
          <strong>Debug: {instanceId}</strong>
          <div>Tipo: {pageType}</div>
          <div>Contexto: {context}</div>
          <div>Config ID: {config?.id || 'none'}</div>
          <div>Dimensiones: {dimensions.width}x{dimensions.height}</div>
        </div>
      );
    };
    
    // ========================================================================
    // RENDER PRINCIPAL
    // ========================================================================
    
    return (
      <div 
        ref={containerRef}
        className="story-renderer relative"
        data-page-type={pageType}
        data-context={context}
        data-instance={instanceId}
        data-testid="story-renderer"
      >
        {/* Overlays de admin (grid, rulers) */}
        {renderAdminOverlays()}
        
        {/* Contenedor principal de la página */}
        <div 
          className="story-page relative bg-cover bg-center bg-no-repeat"
          style={pageContainerStyle}
        >
          {/* Contenedor de posicionamiento */}
          <div 
            className="story-positioning-container"
            style={positioningContainerStyle}
          >
            {/* Contenedor de texto con estilos aplicados */}
            <div
              className="story-text-container"
              style={textContainerStyle}
            >
              {renderTextContent()}
            </div>
          </div>
        </div>
        
        {/* Debug info */}
        {renderDebugInfo()}
      </div>
    );
  }
);

StoryRenderer.displayName = 'StoryRenderer';

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default StoryRenderer;
export type { StoryRendererProps, StoryRendererRef };