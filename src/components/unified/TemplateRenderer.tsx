import React, { useMemo, useEffect, useState } from 'react';
import { 
  UnifiedTemplateConfig, 
  UnifiedRenderOptions,
  UnifiedRenderResult,
  UnifiedRenderContext,
  PageTemplate,
  ComponentTemplate 
} from '../../types/unifiedTemplate';
import { 
  applyUnifiedStyles,
  generateUnifiedCSS,
  UNIFIED_PAGE_DIMENSIONS,
  UnifiedRenderConfig 
} from '../../utils/storyStyleUtils';
import { StoryStyleConfig } from '../../types/styleConfig';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

interface TemplateRendererProps {
  // Configuración del template (puede ser legacy o unificado)
  config: UnifiedTemplateConfig | StoryStyleConfig;
  
  // Tipo de página a renderizar
  pageType: 'cover' | 'content' | 'dedicatoria';
  
  // Contenido dinámico
  content?: {
    title?: string;
    text?: string;
    authorName?: string;
    dedicatoryText?: string;
    customTexts?: Record<string, string>;
  };
  
  // Opciones de renderizado
  renderOptions: UnifiedRenderOptions;
  
  // Callbacks para interacciones (solo en contextos interactivos)
  onComponentSelect?: (componentId: string | null) => void;
  onComponentUpdate?: (componentId: string, updates: any) => void;
  selectedComponentId?: string;
  
  // Props adicionales para debugging
  debug?: boolean;
  onRenderComplete?: (result: UnifiedRenderResult) => void;
}

// ============================================================================
// HOOK PARA CONVERSIÓN DE CONFIGURACIÓN
// ============================================================================

/**
 * Hook que convierte configuraciones legacy a formato unificado
 */
function useUnifiedConfig(
  config: UnifiedTemplateConfig | StoryStyleConfig
): UnifiedTemplateConfig {
  return useMemo(() => {
    // Si ya es configuración unificada, devolverla tal como está
    if ('pages' in config && 'dimensions' in config) {
      return config as UnifiedTemplateConfig;
    }
    
    // Convertir configuración legacy a unificada
    const legacyConfig = config as StoryStyleConfig;
    
    const unifiedConfig: UnifiedTemplateConfig = {
      id: legacyConfig.id || 'legacy-template',
      name: legacyConfig.name || 'Template Legacy',
      version: legacyConfig.version?.toString() || '1.0',
      
      dimensions: UNIFIED_PAGE_DIMENSIONS,
      
      globalStyles: {
        fontLoading: {
          googleFonts: extractGoogleFonts(legacyConfig),
          fallbackFonts: ['Arial', 'sans-serif']
        },
        colorScheme: {
          primary: legacyConfig.coverConfig?.title?.color || '#000000',
          secondary: legacyConfig.pageConfig?.text?.color || '#333333',
          accent: '#0066cc',
          text: '#000000',
          background: '#ffffff'
        },
        animations: {
          enabled: false,
          duration: 200,
          easing: 'ease-in-out'
        }
      },
      
      pages: {
        cover: convertLegacyPageTemplate(legacyConfig, 'cover'),
        content: convertLegacyPageTemplate(legacyConfig, 'content'),
        ...(legacyConfig.dedicatoriaConfig ? {
          dedicatoria: convertLegacyPageTemplate(legacyConfig, 'dedicatoria')
        } : {})
      },
      
      export: {
        pdf: {
          format: 'A4',
          orientation: 'landscape',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          quality: 'standard'
        },
        preview: {
          enableGrid: false,
          enableRulers: false,
          defaultZoom: 100
        }
      },
      
      compatibility: {
        minVersion: '1.0.0',
        legacySupport: true
      },
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return unifiedConfig;
  }, [config]);
}

// ============================================================================
// FUNCIONES DE CONVERSIÓN LEGACY
// ============================================================================

function extractGoogleFonts(config: StoryStyleConfig): string[] {
  const fonts = new Set<string>();
  
  // Extraer fuentes de la configuración legacy
  const titleFont = config.coverConfig?.title?.fontFamily;
  const textFont = config.pageConfig?.text?.fontFamily;
  const dedicatoriaFont = config.dedicatoriaConfig?.text?.fontFamily;
  
  [titleFont, textFont, dedicatoriaFont].forEach(font => {
    if (font) {
      // Extraer nombre de la fuente (antes de la coma)
      const fontName = font.split(',')[0].replace(/['"]/g, '').trim();
      if (fontName && !['Arial', 'sans-serif', 'serif', 'monospace'].includes(fontName)) {
        fonts.add(fontName);
      }
    }
  });
  
  return Array.from(fonts);
}

function convertLegacyPageTemplate(
  config: StoryStyleConfig, 
  pageType: 'cover' | 'content' | 'dedicatoria'
): PageTemplate {
  // NUEVO: Detectar si hay array de componentes (formato del admin/style)
  const configAny = config as any;
  
  console.log(`[fixing_style] convertLegacyPageTemplate - pageType: ${pageType}`, {
    hasComponents: !!(configAny.components && Array.isArray(configAny.components)),
    totalComponents: configAny.components?.length || 0,
    componentsPreview: configAny.components?.slice(0, 2).map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      pageType: c.pageType,
      visible: c.visible
    }))
  });
  
  if (configAny.components && Array.isArray(configAny.components)) {
    // Filtrar componentes por tipo de página
    const pageTypeFilter = pageType === 'content' ? 'page' : pageType;
    const filteredComponents = configAny.components.filter((comp: any) => comp.pageType === pageTypeFilter);
    const pageComponents = filteredComponents.map((comp: any) => convertAdminComponentToTemplate(comp));
    
    console.log(`[fixing_style] Componentes filtrados para ${pageType}:`, {
      pageTypeFilter,
      filteredCount: filteredComponents.length,
      convertedCount: pageComponents.length,
      componentNames: pageComponents.map(c => c.name),
      backgroundComponents: pageComponents.filter(c => c.isBackground).map(c => c.name)
    });
    
    // Buscar imagen de fondo para background del contenedor
    const backgroundComponent = pageComponents.find(comp => comp.isBackground);
    const backgroundUrl = backgroundComponent?.url;
    
    return {
      id: `${pageType}-page`,
      name: `Página ${pageType}`,
      type: pageType,
      background: {
        type: backgroundUrl ? 'image' : 'color',
        value: backgroundUrl || '#ffffff',
        position: 'cover'
      },
      components: pageComponents // Incluir TODOS los componentes, incluyendo background
    };
  }
  
  // LEGACY: Formato tradicional (fallback)
  const pageConfig = pageType === 'cover' 
    ? config.coverConfig?.title
    : pageType === 'dedicatoria'
    ? config.dedicatoriaConfig?.text || config.pageConfig?.text
    : config.pageConfig?.text;
    
  const backgroundUrl = pageType === 'cover'
    ? config.coverBackgroundUrl
    : pageType === 'dedicatoria'
    ? config.dedicatoriaBackgroundUrl
    : config.pageBackgroundUrl;
  
  return {
    id: `${pageType}-page`,
    name: `Página ${pageType}`,
    type: pageType,
    background: {
      type: backgroundUrl ? 'image' : 'color',
      value: backgroundUrl || '#ffffff',
      position: 'cover'
    },
    components: pageConfig ? [convertLegacyComponent(pageConfig, pageType)] : []
  };
}

function convertAdminComponentToTemplate(adminComponent: any): ComponentTemplate {
  // Limpiar estilos decodificando entidades HTML
  const cleanStyles = (styles: any) => {
    if (!styles || typeof styles !== 'object') return styles;
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(styles)) {
      if (typeof value === 'string') {
        // Decodificar múltiples niveles de entidades HTML
        let cleanValue = value;
        const originalValue = cleanValue;
        while (cleanValue.includes('&amp;') || cleanValue.includes('&quot;')) {
          cleanValue = cleanValue
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'");
        }
        if (originalValue !== cleanValue) {
          console.log(`[fixing_style] Decodificado ${key}: "${originalValue}" -> "${cleanValue}"`);
        }
        cleaned[key] = cleanValue;
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };
  
  console.log(`[fixing_style] Convirtiendo componente: ${adminComponent.id} (${adminComponent.name})`, {
    type: adminComponent.type,
    pageType: adminComponent.pageType,
    visible: adminComponent.visible,
    isBackground: adminComponent.isBackground,
    hasUrl: !!adminComponent.url,
    hasStyle: !!adminComponent.style,
    styleKeys: adminComponent.style ? Object.keys(adminComponent.style) : []
  });
  
  return {
    id: adminComponent.id,
    name: adminComponent.name || 'Componente',
    type: adminComponent.type,
    pageType: adminComponent.pageType,
    position: adminComponent.position || 'center',
    horizontalPosition: adminComponent.horizontalPosition || 'center',
    x: adminComponent.x || 0,
    y: adminComponent.y || 0,
    width: adminComponent.width,
    height: adminComponent.height,
    zIndex: adminComponent.zIndex || 10,
    visible: adminComponent.visible !== false,
    content: adminComponent.content || '',
    isDefault: adminComponent.isDefault || false,
    isBackground: adminComponent.isBackground || false,
    
    // Propiedades específicas de imagen
    url: adminComponent.url,
    imageType: adminComponent.imageType,
    objectFit: adminComponent.objectFit || 'cover',
    
    // Estilos del admin component - limpiar entidades HTML
    style: cleanStyles(adminComponent.style) || {},
    containerStyle: cleanStyles(adminComponent.containerStyle) || {},
    
    // Campos adicionales para template unificado
    renderPriority: adminComponent.zIndex || 0,
    responsive: {
      enabled: false
    },
    accessibility: {
      ariaLabel: adminComponent.name || 'Componente',
      role: adminComponent.type === 'text' ? 'textbox' : adminComponent.type === 'image' ? 'img' : undefined,
      altText: adminComponent.type === 'image' ? adminComponent.name : undefined
    },
    validation: {
      required: adminComponent.isDefault || false,
      maxLength: adminComponent.type === 'text' ? 500 : undefined
    }
  };
}

function convertLegacyComponent(
  config: any, 
  pageType: string
): ComponentTemplate {
  return {
    id: `${pageType}-text`,
    name: `Texto ${pageType}`,
    type: 'text',
    pageType: pageType as any,
    position: config.position || 'center',
    horizontalPosition: config.horizontalPosition || 'center',
    zIndex: 10,
    visible: true,
    content: '',
    isDefault: true,
    style: config,
    containerStyle: config.containerStyle || {},
    
    // Campos adicionales para template unificado
    renderPriority: 0,
    responsive: {
      enabled: false
    },
    accessibility: {
      ariaLabel: `Texto de ${pageType}`
    },
    validation: {
      required: true,
      maxLength: 500
    }
  };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  config,
  pageType,
  content = {},
  renderOptions,
  onComponentSelect,
  onComponentUpdate,
  selectedComponentId,
  debug = false,
  onRenderComplete
}) => {
  const [renderResult, setRenderResult] = useState<UnifiedRenderResult | null>(null);
  const [renderStartTime, setRenderStartTime] = useState<number>(0);
  
  // Convertir configuración a formato unificado
  const unifiedConfig = useUnifiedConfig(config);
  
  // Obtener template de la página actual
  const currentPageTemplate = unifiedConfig.pages[pageType === 'content' ? 'content' : pageType];
  
  // Configurar opciones de renderizado unificado
  const unifiedRenderConfig: UnifiedRenderConfig = useMemo(() => ({
    enableScaling: renderOptions.enableScaling,
    targetDimensions: renderOptions.targetDimensions,
    context: mapContextToRenderContext(renderOptions.context),
    preserveAspectRatio: renderOptions.preserveAspectRatio,
    enableFontValidation: renderOptions.features.enableValidation
  }), [renderOptions]);
  
  // Inicio del renderizado
  useEffect(() => {
    setRenderStartTime(performance.now());
  }, [config, pageType, renderOptions]);
  
  // Renderizar componentes
  const renderedComponents = useMemo(() => {
    if (!currentPageTemplate) {
      console.log(`[fixing_style] No currentPageTemplate para ${pageType}`);
      return [];
    }
    
    console.log(`[fixing_style] Renderizando componentes para ${pageType}:`, {
      templateId: currentPageTemplate.id,
      totalComponents: currentPageTemplate.components.length,
      componentDetails: currentPageTemplate.components.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        visible: c.visible,
        isBackground: c.isBackground,
        zIndex: c.zIndex,
        position: { x: c.x, y: c.y },
        hasStyle: !!c.style
      }))
    });
    
    const rendered = currentPageTemplate.components
      .sort((a, b) => a.renderPriority - b.renderPriority)
      .map(component => renderComponent(component, unifiedRenderConfig, content));
    
    console.log(`[fixing_style] Componentes renderizados: ${rendered.length} elementos React`);
    
    return rendered;
  }, [currentPageTemplate, unifiedRenderConfig, content, pageType]);
  
  // Estilos del contenedor principal
  const containerStyles = useMemo(() => {
    const dimensions = renderOptions.targetDimensions || unifiedConfig.dimensions;
    const backgroundStyle = getBackgroundStyle(currentPageTemplate?.background);
    
    // Debug opcional
    if (debug) {
      console.log('TemplateRenderer - Background debug:', {
        pageType,
        currentPageTemplate: currentPageTemplate?.id,
        background: currentPageTemplate?.background,
        backgroundStyle,
        componentsCount: currentPageTemplate?.components?.length
      });
    }
    
    return {
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      position: 'relative' as const,
      overflow: 'hidden',
      background: backgroundStyle,
      fontFamily: unifiedConfig.globalStyles.fontLoading.fallbackFonts.join(', ')
    };
  }, [currentPageTemplate, renderOptions.targetDimensions, unifiedConfig, debug, pageType]);
  
  // Manejar finalización del renderizado
  useEffect(() => {
    if (renderStartTime > 0) {
      const renderTime = performance.now() - renderStartTime;
      
      const result: UnifiedRenderResult = {
        success: true,
        renderedComponent: undefined, // Se establece por el componente padre
        
        debug: debug ? {
          renderTime,
          componentCount: renderedComponents.length,
          fontesUsed: unifiedConfig.globalStyles.fontLoading.googleFonts,
          scaleFactor: renderOptions.targetDimensions 
            ? renderOptions.targetDimensions.width / unifiedConfig.dimensions.width 
            : 1,
          warnings: [],
          errors: []
        } : undefined,
        
        metadata: {
          dimensions: unifiedConfig.dimensions,
          context: renderOptions.context,
          templateId: unifiedConfig.id,
          version: unifiedConfig.version
        }
      };
      
      setRenderResult(result);
      onRenderComplete?.(result);
    }
  }, [renderStartTime, renderedComponents.length, debug, unifiedConfig, renderOptions, onRenderComplete]);
  
  return (
    <div 
      style={{
        ...containerStyles,
        // Debug temporal: borde rojo para ver el contenedor
        border: debug ? '2px solid red' : undefined
      }}
      className="template-renderer"
      data-template-id={unifiedConfig.id}
      data-page-type={pageType}
      data-context={renderOptions.context}
    >
      {/* Cargar fuentes de Google Fonts */}
      {unifiedConfig.globalStyles.fontLoading.googleFonts.length > 0 && (
        <GoogleFontsLoader fonts={unifiedConfig.globalStyles.fontLoading.googleFonts} />
      )}
      
      {/* Renderizar componentes */}
      {renderedComponents}
      
      {/* Información de debug */}
      {debug && renderResult && (
        <DebugOverlay renderResult={renderResult} />
      )}
    </div>
  );
};

// ============================================================================
// FUNCIONES DE ESCALADO UNIVERSAL
// ============================================================================

/**
 * Escala un valor CSS individual basado en el factor de escala
 * Maneja diferentes unidades y valores complejos como textShadow y boxShadow
 */
function scaleStyleValue(value: string | number | undefined, scaleFactor: number, property: string): string | number | undefined {
  if (!value || scaleFactor === 1) return value;
  
  // Convertir a string para procesamiento
  const strValue = String(value);
  
  // Casos especiales para propiedades complejas
  if (property === 'textShadow' || property === 'boxShadow') {
    return scaleComplexShadow(strValue, scaleFactor);
  }
  
  // Manejo de valores con múltiples componentes (ej: "2rem 3rem", "10px 20px 30px 40px")
  if (strValue.includes(' ')) {
    return strValue.split(' ').map(part => scaleSingleValue(part.trim(), scaleFactor)).join(' ');
  }
  
  return scaleSingleValue(strValue, scaleFactor);
}

/**
 * Escala un valor CSS simple (una sola unidad)
 */
function scaleSingleValue(value: string, scaleFactor: number): string {
  // No escalar porcentajes, auto, inherit, none, etc.
  if (value.includes('%') || ['auto', 'inherit', 'initial', 'none', 'normal'].includes(value)) {
    return value;
  }
  
  // Escalar pixels
  const pxMatch = value.match(/^(-?\d*\.?\d+)px$/);
  if (pxMatch) {
    const scaledValue = parseFloat(pxMatch[1]) * scaleFactor;
    return `${Math.round(scaledValue * 100) / 100}px`; // Redondear a 2 decimales
  }
  
  // Escalar rem
  const remMatch = value.match(/^(-?\d*\.?\d+)rem$/);
  if (remMatch) {
    const scaledValue = parseFloat(remMatch[1]) * scaleFactor;
    return `${Math.round(scaledValue * 1000) / 1000}rem`; // Redondear a 3 decimales
  }
  
  // Escalar em
  const emMatch = value.match(/^(-?\d*\.?\d+)em$/);
  if (emMatch) {
    const scaledValue = parseFloat(emMatch[1]) * scaleFactor;
    return `${Math.round(scaledValue * 1000) / 1000}em`;
  }
  
  // Valores numéricos sin unidad (como lineHeight: "1.4")
  const numMatch = value.match(/^(-?\d*\.?\d+)$/);
  if (numMatch) {
    // No escalar ratios/multiplicadores puros
    return value;
  }
  
  // Si no coincide con ningún patrón, devolver sin cambios
  return value;
}

/**
 * Escala valores complejos de sombras (textShadow, boxShadow)
 * Ej: "2px 2px 4px rgba(0,0,0,0.5)" → "1.067px 1.067px 2.133px rgba(0,0,0,0.5)"
 */
function scaleComplexShadow(shadowValue: string, scaleFactor: number): string {
  if (shadowValue === 'none' || !shadowValue) return shadowValue;
  
  // Separar múltiples sombras por comas
  const shadows = shadowValue.split(',').map(shadow => shadow.trim());
  
  return shadows.map(shadow => {
    // Pattern para extraer valores de sombra: horizontal vertical blur spread color
    // Nota: spread es opcional, color puede estar al inicio o al final
    const parts = shadow.trim().split(/\s+/);
    
    return parts.map(part => {
      // Si es un valor de pixel, escalarlo
      if (part.includes('px') && !part.includes('rgba') && !part.includes('rgb') && !part.includes('#')) {
        return scaleSingleValue(part, scaleFactor);
      }
      // Mantener colores, palabras clave sin cambios
      return part;
    }).join(' ');
  }).join(', ');
}

/**
 * Escala todos los estilos CSS de un objeto
 */
function scaleStyleObject(styles: React.CSSProperties, scaleFactor: number): React.CSSProperties {
  if (!styles || scaleFactor === 1) return styles;
  
  const scaledStyles: React.CSSProperties = {};
  
  // Lista de propiedades que deben escalarse
  const scalableProps: (keyof React.CSSProperties)[] = [
    // Tipografía
    'fontSize', 'lineHeight', 'letterSpacing',
    // Espaciado
    'padding', 'margin', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    // Bordes
    'borderRadius', 'borderWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    // Efectos
    'textShadow', 'boxShadow',
    // Dimensiones (algunas veces definidas en estilos)
    'width', 'height', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight',
    // Posicionamiento
    'top', 'right', 'bottom', 'left'
  ];
  
  for (const [key, value] of Object.entries(styles)) {
    const prop = key as keyof React.CSSProperties;
    
    if (scalableProps.includes(prop)) {
      scaledStyles[prop] = scaleStyleValue(value as any, scaleFactor, key) as any;
    } else {
      // Mantener propiedades no escalables sin cambios
      scaledStyles[prop] = value as any;
    }
  }
  
  return scaledStyles;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function mapContextToRenderContext(context: UnifiedRenderContext): 'admin' | 'pdf' | 'wizard' {
  switch (context) {
    case 'admin-edit':
    case 'admin-preview':
      return 'admin';
    case 'pdf':
      return 'pdf';
    case 'wizard':
    case 'viewer':
    case 'thumbnail':
    default:
      return 'wizard';
  }
}

function renderComponent(
  component: ComponentTemplate,
  renderConfig: UnifiedRenderConfig,
  content: Record<string, string>
): React.ReactElement {
  if (!component.visible) {
    console.log(`[fixing_style] Componente ${component.id} no visible, ocultando`);
    return <div key={component.id} style={{ display: 'none' }} />;
  }
  
  // Si es un componente de background, renderizarlo como imagen de fondo absoluta
  if (component.isBackground && component.type === 'image') {
    console.log(`[fixing_style] Renderizando background: ${component.id}`, {
      url: component.url,
      hasUrl: !!component.url,
      zIndex: component.zIndex,
      style: component.style
    });
    
    return (
      <div
        key={component.id}
        data-component-id={component.id}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: component.zIndex || -1,
          backgroundImage: component.url ? `url(${component.url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          ...component.style
        }}
        aria-label={component.accessibility.ariaLabel}
        role="img"
      />
    );
  }
  
  // Calcular escalado basado en las dimensiones del contenedor vs dimensiones fijas
  const originalDimensions = { width: 1536, height: 1024 }; // Dimensiones originales de diseño
  const targetDimensions = renderConfig.targetDimensions || originalDimensions;
  
  const scaleX = targetDimensions.width / originalDimensions.width;
  const scaleY = targetDimensions.height / originalDimensions.height;
  
  // Usar el factor de escala menor para mantener proporciones (aspect ratio)
  const scaleFactor = Math.min(scaleX, scaleY);
  
  // Aplicar escalado a las coordenadas del componente
  const scaledX = Math.round((component.x || 0) * scaleFactor);
  const scaledY = Math.round((component.y || 0) * scaleFactor);
  const scaledWidth = component.width ? Math.round(component.width * scaleFactor) : 'auto';
  const scaledHeight = component.height ? Math.round(component.height * scaleFactor) : 'auto';
  
  // Obtener contenido dinámico o usar contenido del componente
  const dynamicContent = getDynamicContent(component, content);
  
  // Para componentes del admin, usar estilos directos en lugar de la conversión unificada
  const useDirectStyles = component.style && typeof component.style === 'object';
  
  let appliedStyles;
  if (useDirectStyles) {
    // Aplicar escalado a estilos directos del componente admin
    const scaledTextStyle = scaleStyleObject(component.style, scaleFactor);
    const scaledContainerStyle = scaleStyleObject(component.containerStyle || {}, scaleFactor);
    
    appliedStyles = {
      textStyle: scaledTextStyle,
      containerStyle: scaledContainerStyle,
      positioning: {
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
      }
    };
    
    console.log(`[fixing_style] ESTILOS ESCALADOS para ${component.id}:`, {
      originalTextStyle: component.style,
      scaledTextStyle,
      originalContainerStyle: component.containerStyle,
      scaledContainerStyle,
      scaleFactor: scaleFactor.toFixed(3)
    });
  } else {
    // Fallback: usar sistema de conversión unificado para componentes legacy
    const baseAppliedStyles = applyUnifiedStyles(
      { 
        coverConfig: { title: component.style },
        pageConfig: { text: component.style }
      } as any,
      component.pageType,
      renderConfig
    );
    
    // Aplicar escalado también al sistema legacy
    appliedStyles = {
      textStyle: scaleStyleObject(baseAppliedStyles.textStyle, scaleFactor),
      containerStyle: scaleStyleObject(baseAppliedStyles.containerStyle, scaleFactor),
      positioning: baseAppliedStyles.positioning
    };
  }
  
  console.log(`[fixing_style] ESCALADO para ${component.id}:`, {
    original: { x: component.x, y: component.y, width: component.width, height: component.height },
    scale: { scaleX: scaleX.toFixed(3), scaleY: scaleY.toFixed(3), scaleFactor: scaleFactor.toFixed(3) },
    scaled: { x: scaledX, y: scaledY, width: scaledWidth, height: scaledHeight },
    targetDimensions,
    originalDimensions
  });
  
  // Estilos del contenedor con coordenadas escaladas
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: scaledY,
    left: scaledX,
    width: scaledWidth,
    height: scaledHeight,
    zIndex: component.zIndex,
    display: 'flex',
    alignItems: appliedStyles.positioning.alignItems,
    justifyContent: appliedStyles.positioning.justifyContent,
    ...appliedStyles.containerStyle
  };
  
  console.log(`[fixing_style] Renderizando componente: ${component.id} (${component.type})`, {
    name: component.name,
    content: dynamicContent,
    originalPosition: { x: component.x, y: component.y },
    scaledPosition: { x: scaledX, y: scaledY },
    originalDimensions: { width: component.width, height: component.height },
    scaledDimensions: { width: scaledWidth, height: scaledHeight },
    zIndex: component.zIndex,
    useDirectStyles,
    textStyle: appliedStyles.textStyle,
    containerStyle: containerStyle,
    hasUrl: !!component.url,
    // DEBUG ESPECÍFICO PARA IMÁGENES
    isImage: component.type === 'image',
    imageScaling: component.type === 'image' ? {
      originalImageStyle: component.style,
      scaledImageStyle: scaleStyleObject(component.style || {}, scaleFactor),
      scaleFactor: scaleFactor.toFixed(3)
    } : undefined,
    // DEBUG: Verificar valores críticos para renderizado
    finalContainerStyle: {
      position: containerStyle.position,
      top: containerStyle.top,
      left: containerStyle.left,
      width: containerStyle.width,
      height: containerStyle.height,
      zIndex: containerStyle.zIndex,
      display: containerStyle.display
    }
  });
  
  const renderedElement = (
    <div
      key={component.id}
      data-component-id={component.id}
      style={containerStyle}
      aria-label={component.accessibility.ariaLabel}
      role={component.accessibility.role}
      ref={(ref) => {
        // LOG POST-RENDERIZADO: Comparar posición de BBDD vs aplicada
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(ref);
          
          console.log(`[fixing_style] POST-RENDER ${component.id}:`, {
            componentName: component.name,
            // Posición original de la BBDD
            originalPosition: {
              x: component.x,
              y: component.y,
              width: component.width,
              height: component.height,
              zIndex: component.zIndex
            },
            // Estilos aplicados al elemento
            appliedStyles: {
              position: containerStyle.position,
              top: containerStyle.top,
              left: containerStyle.left,
              width: containerStyle.width,
              height: containerStyle.height,
              zIndex: containerStyle.zIndex
            },
            // Valores computados por el browser
            computedCSS: {
              position: computedStyle.position,
              top: computedStyle.top,
              left: computedStyle.left,
              width: computedStyle.width,
              height: computedStyle.height,
              zIndex: computedStyle.zIndex,
              display: computedStyle.display,
              visibility: computedStyle.visibility,
              opacity: computedStyle.opacity
            },
            // Dimensiones reales del elemento en el DOM
            domRect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left
            },
            // Verificaciones de visibilidad
            visibility: {
              hasContent: !!dynamicContent || !!component.url,
              isPositioned: rect.width > 0 && rect.height > 0,
              isInViewport: rect.top >= 0 && rect.left >= 0,
              hasValidZIndex: !isNaN(Number(computedStyle.zIndex))
            }
          });
        }
      }}
    >
      {component.type === 'text' ? (
        <span style={appliedStyles.textStyle}>
          {dynamicContent}
        </span>
      ) : component.type === 'image' ? (
        (() => {
          const scaledImageStyle = scaleStyleObject(component.style || {}, scaleFactor);
          console.log(`[fixing_style] IMAGEN ${component.id} estilos:`, {
            originalStyle: component.style,
            scaledStyle: scaledImageStyle,
            containerDimensions: { width: scaledWidth, height: scaledHeight },
            scaleFactor: scaleFactor.toFixed(3)
          });
          
          return (
            <img
              src={component.url || ''}
              alt={component.accessibility.altText || component.name || ''}
              style={{
                width: '100%',
                height: '100%',
                objectFit: component.objectFit || 'cover',
                ...scaledImageStyle // Aplicar estilos escalados de imagen
              }}
            />
          );
        })()
      ) : null}
    </div>
  );
  
  return renderedElement;
}

function getDynamicContent(
  component: ComponentTemplate, 
  content: Record<string, string>
): string {
  // Mapear contenido dinámico basado en el nombre/tipo del componente
  const componentName = component.name?.toLowerCase() || '';
  const componentId = component.id?.toLowerCase() || '';
  
  // Mapeo para títulos de portada
  if (componentName.includes('título') || componentName.includes('title') || 
      componentId.includes('title') || componentId.includes('cover-title')) {
    return content.title || component.content || 'El Mágico Viaje de Luna';
  }
  
  // Mapeo para autor
  if (componentName.includes('autor') || componentName.includes('author') ||
      componentId.includes('autor') || component.content?.includes('{autor}')) {
    const authorText = content.authorName || 'Autor Demo';
    // Si el contenido ya incluye "Por", usarlo tal como está
    if (component.content?.includes('Por ')) {
      return component.content.replace('{autor}', authorText);
    }
    return `Por ${authorText}`;
  }
  
  // Mapeo para dedicatoria
  if (componentName.includes('dedicatoria') || componentId.includes('dedicatoria')) {
    return content.dedicatoryText || component.content || 'Para mi querida hija Luna, que siempre sueña con aventuras mágicas y llena nuestros días de alegría.';
  }
  
  // Mapeo para texto de páginas interiores
  if (componentName.includes('texto') && (componentName.includes('cuento') || componentName.includes('página'))) {
    return content.text || component.content || 'Luna caminaba por el sendero del bosque encantado, donde las luciérnagas bailaban entre los árboles iluminando su camino.';
  }
  
  // Contenido personalizado directo por ID
  if (content[component.id]) {
    return content[component.id];
  }
  
  // Contenido por defecto del componente
  return component.content || component.name || '';
}

function getBackgroundStyle(background?: any): string {
  if (!background) return '#ffffff';
  
  switch (background.type) {
    case 'image':
      if (background.value) {
        return `url(${background.value}) center / cover no-repeat`;
      }
      return '#ffffff';
    case 'gradient':
      return background.value;
    case 'color':
    default:
      return background.value || '#ffffff';
  }
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const GoogleFontsLoader: React.FC<{ fonts: string[] }> = ({ fonts }) => {
  useEffect(() => {
    if (fonts.length === 0) return;
    
    const fontUrl = `https://fonts.googleapis.com/css2?${fonts.map(font => 
      `family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700`
    ).join('&')}&display=swap`;
    
    // Verificar si ya está cargada
    const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
    if (existingLink) return;
    
    // Crear y agregar el link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);
    
    return () => {
      // Cleanup al desmontar (opcional)
      const linkToRemove = document.querySelector(`link[href="${fontUrl}"]`);
      if (linkToRemove) {
        document.head.removeChild(linkToRemove);
      }
    };
  }, [fonts]);
  
  return null;
};

const DebugOverlay: React.FC<{ renderResult: UnifiedRenderResult }> = ({ renderResult }) => {
  if (!renderResult.debug) return null;
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div>⏱️ Render: {renderResult.debug.renderTime.toFixed(2)}ms</div>
      <div>📦 Components: {renderResult.debug.componentCount}</div>
      <div>📊 Scale: {renderResult.debug.scaleFactor?.toFixed(2)}x</div>
      <div>🔤 Fonts: {renderResult.debug.fontesUsed.join(', ')}</div>
    </div>
  );
};

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default TemplateRenderer;

export type { 
  TemplateRendererProps,
  UnifiedRenderResult 
};

// Exportar funciones de escalado para uso en otros módulos
export {
  scaleStyleValue,
  scaleStyleObject
};