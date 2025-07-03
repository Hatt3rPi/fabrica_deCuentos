// Utilidades unificadas para el sistema de estilos de cuentos
// Este archivo centraliza toda la lógica de aplicación de estilos
// para garantizar consistencia entre Admin, PDF y Wizard

import { 
  StoryStyleConfig, 
  TitleConfig, 
  PageTextConfig, 
  ContainerStyle,
  ComponentConfig,
  TextComponentConfig,
  ImageComponentConfig,
  PageType,
  DEFAULT_COVER_CONFIG,
  DEFAULT_PAGE_CONFIG,
  DEFAULT_DEDICATORIA_CONFIG,
  DEFAULT_CONTRAPORTADA_CONFIG,
  DEFAULT_AUTHOR_COMPONENT,
  DEFAULT_LOGO_COMPONENT,
  DEFAULT_SIGNATURE_COMPONENT
} from '../types/styleConfig';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

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
  components?: ComponentStyleApplication[];
}

export interface ComponentStyleApplication {
  component: ComponentConfig;
  styles: React.CSSProperties;
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

// Cache para memoización de estilos convertidos
const styleCache = new WeakMap<TitleConfig | PageTextConfig, React.CSSProperties>();

/**
 * Convierte configuración de texto a estilos CSS de React
 * OPTIMIZADO: Con memoización via WeakMap para mejorar performance
 * ESTÁNDAR: Usado por Admin, debe ser usado por PDF y Wizard
 */
export function convertToReactStyle(config: TitleConfig | PageTextConfig): React.CSSProperties {
  // Verificar cache primero
  if (styleCache.has(config)) {
    return styleCache.get(config)!;
  }
  
  // Calcular estilos si no están en cache
  const style: React.CSSProperties = {
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
  
  // Guardar en cache y devolver
  styleCache.set(config, style);
  return style;
}

// Cache para memoización de estilos de contenedor
const containerStyleCache = new WeakMap<ContainerStyle, React.CSSProperties>();

/**
 * Convierte configuración de contenedor a estilos CSS de React
 * OPTIMIZADO: Con memoización via WeakMap para mejorar performance
 * ESTÁNDAR: Usado por Admin, debe ser usado por PDF y Wizard
 */
export function convertContainerToReactStyle(containerStyle: ContainerStyle): React.CSSProperties {
  // Verificar cache primero
  if (containerStyleCache.has(containerStyle)) {
    return containerStyleCache.get(containerStyle)!;
  }
  
  // Calcular estilos si no están en cache
  const style: React.CSSProperties = {
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
  
  // Guardar en cache y devolver
  containerStyleCache.set(containerStyle, style);
  return style;
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
    case 'contraportada':
      return config.contraportadaConfig?.text || DEFAULT_CONTRAPORTADA_CONFIG.text;
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
    case 'contraportada':
      return DEFAULT_CONTRAPORTADA_CONFIG.text;
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
export function getContainerPosition(config: TitleConfig | PageTextConfig | ComponentConfig) {
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
// FUNCIONES PARA COMPONENTES DINÁMICOS
// ============================================================================

/**
 * Obtiene los componentes configurados para un tipo de página
 */
export function getPageComponents(
  config: StoryStyleConfig | null | undefined,
  pageType: PageType
): ComponentConfig[] {
  if (!config?.components?.[pageType]) {
    return getDefaultComponentsForPageType(pageType);
  }
  return config.components[pageType];
}

/**
 * Obtiene componentes por defecto según tipo de página
 */
function getDefaultComponentsForPageType(pageType: PageType): ComponentConfig[] {
  switch (pageType) {
    case 'cover':
      return [
        { ...DEFAULT_AUTHOR_COMPONENT, enabled: false }, // Deshabilitado por defecto
        { ...DEFAULT_LOGO_COMPONENT }
      ];
    case 'contraportada':
      return [
        { ...DEFAULT_SIGNATURE_COMPONENT },
        { ...DEFAULT_LOGO_COMPONENT }
      ];
    case 'dedicatoria':
    case 'page':
    default:
      return [];
  }
}

/**
 * Convierte componente de texto a estilos CSS
 */
export function convertTextComponentToReactStyle(component: TextComponentConfig): React.CSSProperties {
  return {
    fontSize: component.style.fontSize,
    fontFamily: component.style.fontFamily,
    fontWeight: component.style.fontWeight,
    color: component.style.color,
    textAlign: component.style.textAlign,
    textShadow: component.style.textShadow,
    letterSpacing: component.style.letterSpacing,
    lineHeight: component.style.lineHeight,
    textTransform: component.style.textTransform
  };
}

/**
 * Convierte componente de imagen a estilos CSS
 */
export function convertImageComponentToReactStyle(component: ImageComponentConfig): React.CSSProperties {
  const styles: React.CSSProperties = {
    opacity: component.opacity || 1,
    objectFit: component.fit || 'contain'
  };

  // Tamaño según configuración
  switch (component.size) {
    case 'small':
      styles.width = '60px';
      styles.height = '60px';
      break;
    case 'medium':
      styles.width = '120px';
      styles.height = '120px';
      break;
    case 'large':
      styles.width = '200px';
      styles.height = '200px';
      break;
    case 'custom':
      if (component.customSize) {
        styles.width = component.customSize.width;
        styles.height = component.customSize.height;
      }
      break;
  }

  return styles;
}

/**
 * Aplica estilos a un componente dinámico
 */
export function applyComponentStyles(component: ComponentConfig): ComponentStyleApplication {
  let componentStyles: React.CSSProperties = {};
  
  if (component.type === 'text') {
    componentStyles = convertTextComponentToReactStyle(component as TextComponentConfig);
  } else if (component.type === 'image') {
    componentStyles = convertImageComponentToReactStyle(component as ImageComponentConfig);
  }

  // Estilos del contenedor
  const containerStyles = component.type === 'text' 
    ? convertContainerToReactStyle((component as TextComponentConfig).containerStyle)
    : (component as ImageComponentConfig).containerStyle 
      ? { ...(component as ImageComponentConfig).containerStyle }
      : {};

  // Combinar estilos
  const finalStyles = {
    ...componentStyles,
    ...containerStyles,
    position: 'absolute' as const,
    zIndex: component.zIndex || 10
  };

  return {
    component,
    styles: finalStyles,
    positioning: getContainerPosition(component)
  };
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
  context: RenderContext = 'admin'
): StyleApplication {
  const currentConfig = getCurrentConfigWithDefaults(config, pageType);
  
  // Obtener y aplicar componentes dinámicos
  const pageComponents = getPageComponents(config, pageType);
  const enabledComponents = pageComponents.filter(comp => comp.enabled);
  const componentStyles = enabledComponents.map(comp => applyComponentStyles(comp));
  
  // El contexto se usa para optimizaciones futuras específicas
  // Por ahora, mantenemos la lógica unificada
  void context; // Evita el warning de variable no usada
  
  return {
    textStyle: convertToReactStyle(currentConfig),
    containerStyle: convertContainerToReactStyle(currentConfig.containerStyle),
    positioning: getContainerPosition(currentConfig),
    components: componentStyles
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
  pageType: PageType
): {
  textCSS: string;
  containerCSS: string;
  positionCSS: string;
} {
  const { textStyle, containerStyle, positioning } = applyStandardStyles(config, pageType, 'pdf');
  
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
  
  // Posicionamiento
  getContainerPosition,
  
  // PDF específico
  generatePDFStyles,
  
  // Validación
  validateStyleConfig,
  
  // Debugging
  debugStyleConfig
};