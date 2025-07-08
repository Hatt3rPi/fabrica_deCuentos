// Utilidades unificadas para el sistema de estilos de cuentos
// Este archivo centraliza toda la lógica de aplicación de estilos
// para garantizar consistencia entre Admin, PDF y Wizard

import { 
  StoryStyleConfig, 
  TitleConfig, 
  PageTextConfig, 
  ContainerStyle,
  DEFAULT_COVER_CONFIG,
  DEFAULT_PAGE_CONFIG,
  DEFAULT_DEDICATORIA_CONFIG
} from '../types/styleConfig';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export type PageType = 'cover' | 'page' | 'dedicatoria';
export type RenderContext = 'admin' | 'pdf' | 'wizard';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface StyleApplication {
  textStyle: React.CSSProperties;
  containerStyle: React.CSSProperties;
  positioning: {
    alignItems: string;
    justifyContent: string;
  };
}

export interface UnifiedStyleConfig {
  config: TitleConfig | PageTextConfig;
  pageType: PageType;
  context: RenderContext;
}

// ============================================================================
// FUNCIONES DE CONVERSIÓN ESTÁNDAR (migradas desde styleConfig.ts)
// ============================================================================

/**
 * Convierte configuración de texto a estilos CSS de React
 * ESTÁNDAR: Usado por Admin, debe ser usado por PDF y Wizard
 */
export function convertToReactStyle(config: TitleConfig | PageTextConfig): React.CSSProperties {
  return {
    fontSize: config.fontSize,
    fontFamily: config.fontFamily,
    fontWeight: config.fontWeight,
    color: config.color,
    textAlign: config.textAlign,
    textShadow: config.textShadow,
    letterSpacing: config.letterSpacing,
    lineHeight: 'lineHeight' in config ? config.lineHeight : undefined,
    textTransform: 'textTransform' in config ? config.textTransform as React.CSSProperties['textTransform'] : undefined,
  };
}

/**
 * Convierte configuración de contenedor a estilos CSS de React
 * ESTÁNDAR: Usado por Admin, debe ser usado por PDF y Wizard
 */
export function convertContainerToReactStyle(containerStyle: ContainerStyle): React.CSSProperties {
  return {
    background: containerStyle.background,
    padding: containerStyle.padding,
    margin: containerStyle.margin,
    borderRadius: containerStyle.borderRadius,
    maxWidth: containerStyle.maxWidth,
    minHeight: containerStyle.minHeight,
    border: containerStyle.border,
    boxShadow: containerStyle.boxShadow,
    backdropFilter: containerStyle.backdropFilter,
  };
}

// ============================================================================
// FUNCIONES DE SELECCIÓN DE CONFIGURACIÓN
// ============================================================================

/**
 * Obtiene la configuración correcta según el tipo de página
 * ESTÁNDAR: Lógica consistente para todos los contextos
 */
export function getCurrentConfig(
  config: StoryStyleConfig, 
  pageType: PageType
): TitleConfig | PageTextConfig {
  switch (pageType) {
    case 'cover':
      return config.coverConfig.title;
    case 'dedicatoria':
      return config.dedicatoriaConfig?.text || config.pageConfig.text;
    case 'page':
    default:
      return config.pageConfig.text;
  }
}

/**
 * Obtiene configuración con fallback a valores por defecto
 * ESTÁNDAR: Garantiza que siempre hay configuración válida
 */
export function getCurrentConfigWithDefaults(
  config: StoryStyleConfig | null | undefined,
  pageType: PageType
): TitleConfig | PageTextConfig {
  if (!config) {
    return getDefaultConfigForPageType(pageType);
  }

  try {
    return getCurrentConfig(config, pageType);
  } catch (error) {
    console.warn(`Error obteniendo configuración para ${pageType}, usando defaults:`, error);
    return getDefaultConfigForPageType(pageType);
  }
}

/**
 * Obtiene configuración por defecto según tipo de página
 */
function getDefaultConfigForPageType(pageType: PageType): TitleConfig | PageTextConfig {
  switch (pageType) {
    case 'cover':
      return DEFAULT_COVER_CONFIG.title;
    case 'dedicatoria':
      return DEFAULT_DEDICATORIA_CONFIG.text;
    case 'page':
    default:
      return DEFAULT_PAGE_CONFIG.text;
  }
}

// ============================================================================
// POSICIONAMIENTO ESTÁNDAR
// ============================================================================

/**
 * Calcula posicionamiento Flexbox según configuración
 * ESTÁNDAR: Lógica de StylePreview.tsx, debe usarse en todos los contextos
 */
export function getContainerPosition(config: TitleConfig | PageTextConfig) {
  const position = config.position || 'center';
  const horizontalPosition = config.horizontalPosition || 'center';
  
  let alignItems = 'center';
  let justifyContent = 'center';

  // Posición vertical
  switch (position) {
    case 'top':
      alignItems = 'flex-start';
      break;
    case 'center':
      alignItems = 'center';
      break;
    case 'bottom':
      alignItems = 'flex-end';
      break;
  }

  // Posición horizontal del contenedor
  switch (horizontalPosition) {
    case 'left':
      justifyContent = 'flex-start';
      break;
    case 'center':
      justifyContent = 'center';
      break;
    case 'right':
      justifyContent = 'flex-end';
      break;
  }

  return { alignItems, justifyContent };
}

// ============================================================================
// ESCALADO PROPORCIONAL
// ============================================================================

/**
 * Escala tamaños de fuente proporcionalmente basado en dimensiones de contenedor
 * ESTÁNDAR: Lógica migrada desde ComponentRenderer para consistencia
 */
export function getScaledFontSize(
  originalSize: string, 
  containerDimensions?: { width: number; height: number }
): string {
  if (!containerDimensions) return originalSize;
  
  // Dimensiones base para el diseño (tamaño "normal")
  const BASE_WIDTH = 1536;
  const BASE_HEIGHT = 1024;
  
  // Calcular factor de escala basado en ambas dimensiones
  const scaleFactorWidth = containerDimensions.width / BASE_WIDTH;
  const scaleFactorHeight = containerDimensions.height / BASE_HEIGHT;
  
  // Usar el menor factor para mantener proporciones
  const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
  
  // Extraer valor numérico y unidad
  const sizeMatch = originalSize.match(/^([\d.]+)(.+)$/);
  if (!sizeMatch) return originalSize;
  
  const [, value, unit] = sizeMatch;
  const numericValue = parseFloat(value);
  const scaledValue = numericValue * scaleFactor;
  
  return `${scaledValue.toFixed(2)}${unit}`;
}

// ============================================================================
// APLICACIÓN UNIFICADA DE ESTILOS
// ============================================================================

/**
 * Aplica todo el sistema de estilos de manera unificada
 * FUNCIÓN PRINCIPAL: Debe usarse en Admin, PDF y Wizard
 */
export function applyStandardStyles(
  config: StoryStyleConfig | null | undefined,
  pageType: PageType,
  context: RenderContext = 'admin',
  containerDimensions?: { width: number; height: number },
  enableScaling: boolean = false
): StyleApplication {
  const currentConfig = getCurrentConfigWithDefaults(config, pageType);
  
  // Aplicar escalado proporcional solo si está habilitado y se proporcionan dimensiones
  const baseTextStyle = convertToReactStyle(currentConfig);
  const textStyle = enableScaling && containerDimensions && baseTextStyle.fontSize
    ? {
        ...baseTextStyle,
        fontSize: getScaledFontSize(baseTextStyle.fontSize as string, containerDimensions)
      }
    : baseTextStyle;
  
  // El contexto se usa para optimizaciones futuras específicas
  // Por ahora, mantenemos la lógica unificada
  void context; // Evita el warning de variable no usada
  
  return {
    textStyle,
    containerStyle: convertContainerToReactStyle(currentConfig.containerStyle),
    positioning: getContainerPosition(currentConfig)
  };
}

// ============================================================================
// VALIDACIÓN DE CONFIGURACIONES
// ============================================================================

/**
 * Valida que una configuración de estilo sea válida
 * ESTÁNDAR: Validación antes de aplicar estilos
 */
export function validateStyleConfig(config: StoryStyleConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar cover config
  if (!validateTitleConfig(config.coverConfig?.title)) {
    errors.push('Configuración de portada inválida');
  }

  // Validar page config
  if (!validatePageTextConfig(config.pageConfig?.text)) {
    errors.push('Configuración de página inválida');
  }

  // Validar dedicatoria config (opcional)
  if (config.dedicatoriaConfig && !validatePageTextConfig(config.dedicatoriaConfig.text)) {
    warnings.push('Configuración de dedicatoria inválida, se usará configuración de página');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

function validateTitleConfig(config: TitleConfig | undefined): boolean {
  if (!config) return false;
  
  return !!(
    config.fontSize && 
    config.fontFamily && 
    config.color &&
    config.textAlign &&
    config.position
  );
}

function validatePageTextConfig(config: PageTextConfig | undefined): boolean {
  if (!config) return false;
  
  return !!(
    config.fontSize && 
    config.fontFamily && 
    config.color &&
    config.textAlign &&
    config.position &&
    config.lineHeight
  );
}

// ============================================================================
// CONVERSIÓN PARA PDF (HTML STRING)
// ============================================================================

/**
 * Convierte estilos React.CSSProperties a string CSS para HTML
 * NUEVO: Para uso en PDF Edge Function
 */
export function convertToHTMLStyle(reactStyle: React.CSSProperties): string {
  return Object.entries(reactStyle)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      // Convertir camelCase a kebab-case
      const cssKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      return `${cssKey}: ${value}`;
    })
    .join('; ');
}

/**
 * Genera estilos CSS completos para PDF
 * NUEVO: Reemplaza lógica manual en Edge Function
 */
export function generatePDFStyles(
  config: StoryStyleConfig | null | undefined,
  pageType: PageType,
  containerDimensions?: { width: number; height: number },
  enableScaling: boolean = false
): {
  textCSS: string;
  containerCSS: string;
  positionCSS: string;
} {
  const { textStyle, containerStyle, positioning } = applyStandardStyles(config, pageType, 'pdf', containerDimensions, enableScaling);
  
  return {
    textCSS: convertToHTMLStyle(textStyle),
    containerCSS: convertToHTMLStyle(containerStyle),
    positionCSS: `
      display: flex;
      align-items: ${positioning.alignItems};
      justify-content: ${positioning.justifyContent};
    `.trim()
  };
}

// ============================================================================
// UTILIDADES DE DEBUGGING
// ============================================================================

/**
 * Genera reporte de configuración para debugging
 */
export function debugStyleConfig(
  config: StoryStyleConfig | null | undefined,
  pageType: PageType
): object {
  if (!config) {
    return { error: 'No config provided', pageType, defaults: getDefaultConfigForPageType(pageType) };
  }

  const currentConfig = getCurrentConfig(config, pageType);
  const applied = applyStandardStyles(config, pageType);
  const validation = validateStyleConfig(config);

  return {
    pageType,
    originalConfig: currentConfig,
    appliedStyles: applied,
    validation,
    configSource: config.id || 'unknown'
  };
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default {
  // Funciones principales
  applyStandardStyles,
  getCurrentConfig,
  getCurrentConfigWithDefaults,
  
  // Conversiones
  convertToReactStyle,
  convertContainerToReactStyle,
  convertToHTMLStyle,
  
  // Escalado proporcional
  getScaledFontSize,
  
  // Posicionamiento
  getContainerPosition,
  
  // PDF específico
  generatePDFStyles,
  
  // Validación
  validateStyleConfig,
  
  // Debugging
  debugStyleConfig
};