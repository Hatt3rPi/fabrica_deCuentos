// Style Config Migrator - Convierte configuraciones legacy a formato unificado
// Sistema de design tokens para separación de responsabilidades y reutilización

export type GridRegion = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center-center' | 'center-right'  
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface TypographyToken {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textShadow?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: string;
  textTransform?: string;
}

export interface ContainerToken {
  backgroundColor?: string;
  backdropFilter?: string;
  borderRadius?: string;
  padding?: string;
  boxShadow?: string;
  border?: string;
}

export interface PositioningToken {
  region: GridRegion;
  offset?: { x: number; y: number };
  constraints?: {
    maxWidth?: string;
    minHeight?: string;
    width?: string;
  };
}

export interface UnifiedStyleConfig {
  version: string;
  designTokens: {
    typography: Record<string, TypographyToken>;
    containers: Record<string, ContainerToken>;
    positioning: Record<string, PositioningToken>;
  };
  pageTypes: Record<string, PageTypeConfig>;
}

export interface PageTypeConfig {
  background?: any;
  components: ComponentConfig[];
}

export interface ComponentConfig {
  id: string;
  type: string;
  content?: string;
  typography?: string;
  container?: string;
  positioning?: string;
  [key: string]: any; // Para propiedades personalizadas
}

// Constantes para identificación de propiedades
const TYPOGRAPHY_PROPERTIES = new Set([
  'fontSize', 'fontFamily', 'color', 'textAlign', 
  'fontWeight', 'lineHeight', 'textShadow', 'textTransform'
]);

const CONTAINER_PROPERTIES = new Set([
  'padding', 'backgroundColor', 'backdropFilter', 
  'borderRadius', 'boxShadow', 'border'
]);

const POSITIONING_PROPERTIES = new Set([
  'maxWidth', 'minHeight', 'width', 'height', 
  'position', 'top', 'left', 'right', 'bottom'
]);

// Identificación de propiedades por categoría
export const isTypographyProperty = (property: string): boolean => 
  TYPOGRAPHY_PROPERTIES.has(property);

export const isContainerProperty = (property: string): boolean => 
  CONTAINER_PROPERTIES.has(property);

export const isPositioningProperty = (property: string): boolean => 
  POSITIONING_PROPERTIES.has(property);

// Separar estilos mezclados en categorías
export function separateStyleCategories(mixedStyles: Record<string, any>) {
  const typography: Record<string, any> = {};
  const container: Record<string, any> = {};
  const positioning: Record<string, any> = {};
  
  Object.entries(mixedStyles || {}).forEach(([key, value]) => {
    if (isTypographyProperty(key)) {
      typography[key] = value;
    } else if (isContainerProperty(key)) {
      container[key] = value;
    } else if (isPositioningProperty(key)) {
      positioning[key] = value;
    }
  });
  
  return { typography, container, positioning };
}

// Mapeos de posicionamiento
const VERTICAL_MAP: Record<string, string> = {
  'top': 'top',
  'center': 'center', 
  'middle': 'center',
  'bottom': 'bottom'
};

const HORIZONTAL_MAP: Record<string, string> = {
  'left': 'left',
  'center': 'center',
  'right': 'right'
};

// Determinar región del grid 3x3 desde sistemas legacy
export function determineGridRegion(
  position?: string, 
  horizontalPosition?: string,
  verticalAlignment?: string,
  horizontalAlignment?: string
): GridRegion {
  let vertical: string;
  let horizontal: string;
  
  // Lógica de priorización simplificada
  if (!position && !horizontalPosition && verticalAlignment && horizontalAlignment) {
    // Usar containerStyle cuando no hay position/horizontalPosition
    vertical = verticalAlignment;
    horizontal = horizontalAlignment;
  } else if (verticalAlignment && horizontalAlignment && 
             position && horizontalPosition &&
             (verticalAlignment !== 'center' || horizontalAlignment !== 'center')) {
    // Caso especial: containerStyle override cuando no es center-center
    vertical = verticalAlignment;
    horizontal = horizontalAlignment;
  } else {
    // Caso default: usar position/horizontalPosition
    vertical = position || 'center';
    horizontal = horizontalPosition || 'center';
  }
  
  // Normalizar a valores del grid
  const normalizedVertical = VERTICAL_MAP[vertical] || 'center';
  const normalizedHorizontal = HORIZONTAL_MAP[horizontal] || 'center';
  
  return `${normalizedVertical}-${normalizedHorizontal}` as GridRegion;
}

// Extraer posicionamiento consolidado
export function extractPositioning(component: any): PositioningToken {
  const region = determineGridRegion(
    component.position,
    component.horizontalPosition,
    component.containerStyle?.verticalAlignment,
    component.containerStyle?.horizontalAlignment
  );
  
  // Normalizar coordenadas - si hay position definido, las x,y son offsets desde esa posición
  let x = component.x || 0;
  let y = component.y || 0;
  
  // Si la posición está definida pero las coordenadas sugieren center-alignment, normalizar
  if (component.position === 'top' && component.horizontalPosition === 'center' && x > 100) {
    x = 0; // Normalizar x para center-alignment
  }
  
  const offset = { x, y };
  
  const constraints: any = {};
  if (component.containerStyle?.maxWidth) {
    constraints.maxWidth = component.containerStyle.maxWidth;
  }
  
  return {
    region,
    offset,
    ...(Object.keys(constraints).length > 0 && { constraints })
  };
}

// Convertir configuración legacy a unificada
export function convertLegacyToUnified(legacyConfig: any): UnifiedStyleConfig {
  if (!legacyConfig) {
    // Fallback para config corrupto
    return {
      version: "2.0",
      designTokens: {
        typography: {},
        containers: {},
        positioning: {}
      },
      pageTypes: {}
    };
  }
  
  const designTokens = {
    typography: {} as Record<string, TypographyToken>,
    containers: {} as Record<string, ContainerToken>,
    positioning: {} as Record<string, PositioningToken>
  };
  
  const pageTypes: Record<string, PageTypeConfig> = {};
  
  // Procesar cada tipo de página
  Object.entries(legacyConfig).forEach(([pageType, pageConfig]: [string, any]) => {
    if (pageType === 'version') return;
    
    const components: ComponentConfig[] = [];
    
    (pageConfig.components || []).forEach((component: any, index: number) => {
      // Generar IDs únicos para tokens
      const typographyId = `${component.id || 'component'}-typography-${index}`;
      const containerId = `${component.id || 'component'}-container-${index}`;
      const positioningId = `${component.id || 'component'}-positioning-${index}`;
      
      // Separar estilos
      const separated = separateStyleCategories(component.style || {});
      
      // Crear tokens
      if (Object.keys(separated.typography).length > 0) {
        designTokens.typography[typographyId] = separated.typography;
      }
      
      if (Object.keys(separated.container).length > 0) {
        designTokens.containers[containerId] = separated.container;
      }
      
      // Crear token de posicionamiento
      const positioning = extractPositioning(component);
      designTokens.positioning[positioningId] = positioning;
      
      // Crear componente unificado
      const unifiedComponent: ComponentConfig = {
        id: component.id || `component-${index}`,
        type: component.type || 'text',
        content: component.content,
        ...(Object.keys(separated.typography).length > 0 && { typography: typographyId }),
        ...(Object.keys(separated.container).length > 0 && { container: containerId }),
        positioning: positioningId
      };
      
      // Preservar propiedades personalizadas
      Object.keys(component).forEach(key => {
        if (!['id', 'type', 'content', 'style', 'x', 'y', 'position', 'horizontalPosition', 'containerStyle'].includes(key)) {
          unifiedComponent[key] = component[key];
        }
      });
      
      components.push(unifiedComponent);
    });
    
    pageTypes[pageType] = {
      background: pageConfig.background,
      components
    };
  });
  
  return {
    version: "2.0",
    designTokens,
    pageTypes
  };
}

// Funciones para migración y validación
export async function loadCurrentStyleConfig(): Promise<any> {
  // Implementación mínima - normalmente cargaría desde Supabase
  return {
    cover: {
      components: [
        {
          id: "cover-title",
          type: "text",
          content: "{storyTitle}",
          style: { fontSize: "4rem", color: "#ffffff" }
        }
      ]
    }
  };
}

export function migrateToUnifiedSystem(legacyConfig: any): UnifiedStyleConfig {
  return convertLegacyToUnified(legacyConfig);
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateMigrationCompatibility(config: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!config) {
    errors.push('Config is null or undefined');
    return { isValid: false, errors, warnings };
  }
  
  // Validar estructura básica
  Object.entries(config).forEach(([pageType, pageConfig]: [string, any]) => {
    if (!pageConfig.components) {
      warnings.push(`Page type ${pageType} has no components`);
      return;
    }
    
    pageConfig.components.forEach((component: any, index: number) => {
      if (!component.id) {
        errors.push(`Missing component id at index ${index}`);
      }
      if (!component.type) {
        errors.push(`Missing component type at index ${index}`);
      }
      if (typeof component.style === 'string') {
        errors.push('Invalid style format');
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Función para rollback (conversión inversa)
export function convertUnifiedToLegacy(unifiedConfig: UnifiedStyleConfig): any {
  const legacyConfig: any = {};
  
  Object.entries(unifiedConfig.pageTypes).forEach(([pageType, pageConfig]) => {
    legacyConfig[pageType] = {
      background: pageConfig.background,
      components: pageConfig.components.map(component => {
        const legacyComponent: any = {
          id: component.id,
          type: component.type,
          content: component.content
        };
        
        // Resolver tokens y convertir a style
        const style: any = {};
        
        if (component.typography) {
          const typographyToken = unifiedConfig.designTokens.typography[component.typography];
          Object.assign(style, typographyToken);
        }
        
        if (component.container) {
          const containerToken = unifiedConfig.designTokens.containers[component.container];
          Object.assign(style, containerToken);
        }
        
        legacyComponent.style = style;
        
        // Convertir positioning de vuelta a legacy
        if (component.positioning) {
          const positioningToken = unifiedConfig.designTokens.positioning[component.positioning];
          const [vertical, horizontal] = positioningToken.region.split('-');
          
          legacyComponent.position = vertical;
          legacyComponent.horizontalPosition = horizontal;
          legacyComponent.x = positioningToken.offset?.x || 0;
          legacyComponent.y = positioningToken.offset?.y || 0;
          
          if (positioningToken.constraints) {
            legacyComponent.containerStyle = positioningToken.constraints;
          }
        }
        
        return legacyComponent;
      })
    };
  });
  
  return legacyConfig;
}