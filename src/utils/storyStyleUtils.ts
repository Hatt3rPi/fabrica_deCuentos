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
import { scaleStyleObject } from '../components/unified/TemplateRenderer';

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
// FUNCIONES DE MANEJO DE FUENTES UNIFICADAS
// ============================================================================

/**
 * Decodifica HTML entities en fontFamily de manera consistente
 * UNIFICADO: Para uso en Admin, PDF y Wizard
 */
export function decodeFontFamily(fontFamily: string): string {
  if (!fontFamily) return 'Arial, sans-serif';
  
  // Decodificar HTML entities (puede haber doble encoding)
  const decoded = fontFamily
    .replace(/&amp;quot;/g, '"')  // Para &amp;quot; → "
    .replace(/&quot;/g, '"')      // Para &quot; → "
    .replace(/&#39;/g, "'")       // Para &#39; → '
    .replace(/&amp;#39;/g, "'");  // Para &amp;#39; → '
    
  return decoded;
}

/**
 * Extrae el nombre de la fuente del fontFamily string de manera consistente
 * UNIFICADO: Para uso en Admin, PDF y Wizard
 */
export function extractFontName(fontFamily: string): string {
  const decodedFontFamily = decodeFontFamily(fontFamily);
  
  // Extraer el nombre de la fuente del fontFamily string
  // Puede venir como: "Roboto", sans-serif o Roboto, sans-serif
  const fontMatch = decodedFontFamily.match(/^["']?([^"',]+)["']?/);
  const fontName = fontMatch ? fontMatch[1].trim() : 'Arial';
  
  return fontName;
}

/**
 * Valida si una fuente está disponible en el sistema
 * UNIFICADO: Para verificación consistente
 */
export function validateFontAvailability(fontFamily: string): boolean {
  const fontName = extractFontName(fontFamily);
  
  // Lista de fuentes comúnmente disponibles y fuentes del proyecto
  const availableFonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins',
    'Indie Flower', 'Fredoka One', 'Galindo', 'Quicksand'
  ];
  
  return availableFonts.some(font => 
    font.toLowerCase() === fontName.toLowerCase()
  );
}

// ============================================================================
// DIMENSIONES UNIFICADAS Y ESCALADO AVANZADO
// ============================================================================

/**
 * Dimensiones estándar para todas las páginas
 * FIJO: Garantiza consistencia entre todos los contextos
 */
export const UNIFIED_PAGE_DIMENSIONS = {
  width: 1536,
  height: 1024,
  aspectRatio: 3/2
} as const;

/**
 * Calcula escalado proporcional avanzado con múltiples factores
 * MEJORADO: Versión extendida de getScaledFontSize
 */
export function calculateScaledSize(
  originalSize: string,
  targetDimensions: { width: number; height: number },
  baseDimensions: { width: number; height: number } = UNIFIED_PAGE_DIMENSIONS,
  options: {
    preserveAspectRatio?: boolean;
    minScale?: number;
    maxScale?: number;
  } = {}
): string {
  const { preserveAspectRatio = true, minScale = 0.5, maxScale = 2.0 } = options;
  
  // Calcular factores de escala
  const scaleFactorWidth = targetDimensions.width / baseDimensions.width;
  const scaleFactorHeight = targetDimensions.height / baseDimensions.height;
  
  // Usar el menor factor para mantener proporciones o el promedio si no
  const scaleFactor = preserveAspectRatio 
    ? Math.min(scaleFactorWidth, scaleFactorHeight)
    : (scaleFactorWidth + scaleFactorHeight) / 2;
  
  // Aplicar límites de escalado
  const clampedScaleFactor = Math.max(minScale, Math.min(maxScale, scaleFactor));
  
  // Extraer valor numérico y unidad
  const sizeMatch = originalSize.match(/^([\d.]+)(.+)$/);
  if (!sizeMatch) return originalSize;
  
  const [, value, unit] = sizeMatch;
  const numericValue = parseFloat(value);
  const scaledValue = numericValue * clampedScaleFactor;
  
  return `${scaledValue.toFixed(2)}${unit}`;
}

// ============================================================================
// APLICACIÓN UNIFICADA AVANZADA DE ESTILOS
// ============================================================================

/**
 * Configuración para renderizado unificado
 */
export interface UnifiedRenderConfig {
  enableScaling?: boolean;
  targetDimensions?: { width: number; height: number };
  context: RenderContext;
  preserveAspectRatio?: boolean;
  enableFontValidation?: boolean;
}

/**
 * Aplica estilos de manera completamente unificada con validaciones
 * FUNCIÓN PRINCIPAL MEJORADA: Para uso en todos los contextos
 */
export function applyUnifiedStyles(
  config: StoryStyleConfig | null | undefined,
  pageType: PageType,
  renderConfig: UnifiedRenderConfig
): StyleApplication & {
  fontName: string;
  isValidFont: boolean;
  scaleFactor?: number;
} {
  const {
    enableScaling = false,
    targetDimensions,
    context,
    preserveAspectRatio = true,
    enableFontValidation = true
  } = renderConfig;

  const currentConfig = getCurrentConfigWithDefaults(config, pageType);
  
  // Aplicar escalado completo si está habilitado usando el nuevo sistema unificado
  const baseTextStyle = convertToReactStyle(currentConfig);
  const baseContainerStyle = convertContainerToReactStyle(currentConfig.containerStyle);
  let textStyle = baseTextStyle;
  let containerStyle = baseContainerStyle;
  let scaleFactor: number | undefined;

  if (enableScaling && targetDimensions) {
    // Calcular el factor de escala usando las dimensiones unificadas
    const scaleX = targetDimensions.width / UNIFIED_PAGE_DIMENSIONS.width;
    const scaleY = targetDimensions.height / UNIFIED_PAGE_DIMENSIONS.height;
    scaleFactor = preserveAspectRatio ? Math.min(scaleX, scaleY) : scaleX;
    
    // Aplicar escalado completo usando las nuevas funciones unificadas
    textStyle = scaleStyleObject(baseTextStyle, scaleFactor);
    containerStyle = scaleStyleObject(baseContainerStyle, scaleFactor);
    
    console.log(`[storyStyleUtils] Escalado aplicado:`, {
      pageType,
      scaleFactor: scaleFactor.toFixed(3),
      targetDimensions,
      originalDimensions: UNIFIED_PAGE_DIMENSIONS,
      originalTextStyle: baseTextStyle,
      scaledTextStyle: textStyle,
      originalContainerStyle: baseContainerStyle,
      scaledContainerStyle: containerStyle
    });
  }

  // Validar y limpiar fontFamily
  const originalFontFamily = textStyle.fontFamily as string || 'Arial, sans-serif';
  const decodedFontFamily = decodeFontFamily(originalFontFamily);
  const fontName = extractFontName(decodedFontFamily);
  const isValidFont = enableFontValidation ? validateFontAvailability(decodedFontFamily) : true;

  // Aplicar fontFamily limpia
  textStyle = {
    ...textStyle,
    fontFamily: decodedFontFamily
  };

  // Optimizaciones específicas por contexto
  if (context === 'pdf') {
    // Para PDF, asegurar que los estilos sean compatibles
    textStyle = {
      ...textStyle,
      // Asegurar que textShadow sea compatible con PDF
      textShadow: textStyle.textShadow || 'none'
    };
  }

  return {
    textStyle,
    containerStyle, // Usar el containerStyle escalado
    positioning: getContainerPosition(currentConfig),
    fontName,
    isValidFont,
    scaleFactor
  };
}

/**
 * Genera estilos CSS completos para cualquier contexto
 * UNIFICADO: Reemplaza generatePDFStyles y otros métodos específicos
 */
export function generateUnifiedCSS(
  config: StoryStyleConfig | null | undefined,
  pageType: PageType,
  renderConfig: UnifiedRenderConfig
): {
  textCSS: string;
  containerCSS: string;
  positionCSS: string;
  debugInfo?: object;
} {
  const appliedStyles = applyUnifiedStyles(config, pageType, renderConfig);
  
  const debugInfo = renderConfig.context === 'admin' ? {
    fontName: appliedStyles.fontName,
    isValidFont: appliedStyles.isValidFont,
    scaleFactor: appliedStyles.scaleFactor,
    pageType,
    context: renderConfig.context
  } : undefined;

  return {
    textCSS: convertToHTMLStyle(appliedStyles.textStyle),
    containerCSS: convertToHTMLStyle(appliedStyles.containerStyle),
    positionCSS: `
      display: flex;
      align-items: ${appliedStyles.positioning.alignItems};
      justify-content: ${appliedStyles.positioning.justifyContent};
      width: 100%;
      height: 100%;
    `.trim(),
    debugInfo
  };
}

// ============================================================================
// MIGRACIÓN Y COMPATIBILIDAD
// ============================================================================

/**
 * Migra configuración legacy a formato unificado
 * COMPATIBILIDAD: Para transición gradual
 */
export function migrateLegacyConfig(legacyConfig: any): StoryStyleConfig {
  // Implementar lógica de migración según sea necesario
  // Por ahora, asumimos que el config ya está en el formato correcto
  return legacyConfig as StoryStyleConfig;
}

/**
 * Valida compatibilidad entre diferentes versiones de configuración
 */
export function validateConfigCompatibility(config: any): {
  isCompatible: boolean;
  version: string;
  migrationRequired: boolean;
} {
  // Detectar versión de la configuración
  const version = config.version || '1.0';
  const hasNewStructure = config.coverConfig && config.pageConfig;
  
  return {
    isCompatible: hasNewStructure,
    version,
    migrationRequired: !hasNewStructure
  };
}

// ============================================================================
// EXPORTACIONES ACTUALIZADAS
// ============================================================================

export default {
  // Funciones principales
  applyStandardStyles,
  applyUnifiedStyles,
  getCurrentConfig,
  getCurrentConfigWithDefaults,
  
  // Conversiones
  convertToReactStyle,
  convertContainerToReactStyle,
  convertToHTMLStyle,
  
  // Escalado proporcional
  getScaledFontSize,
  calculateScaledSize,
  
  // Posicionamiento
  getContainerPosition,
  
  // Fuentes
  decodeFontFamily,
  extractFontName,
  validateFontAvailability,
  
  // CSS unificado
  generatePDFStyles,
  generateUnifiedCSS,
  
  // Validación
  validateStyleConfig,
  validateConfigCompatibility,
  
  // Migración
  migrateLegacyConfig,
  
  // Debugging
  debugStyleConfig,
  
  // Constantes
  UNIFIED_PAGE_DIMENSIONS
};