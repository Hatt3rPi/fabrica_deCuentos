// ============================================================================
// SISTEMA DE MIGRACIÓN DE TEMPLATES LEGACY A UNIFICADO
// ============================================================================

import { 
  UnifiedTemplateConfig, 
  MigrationResult, 
  MigrationInfo, 
  TemplateValidationResult,
  ValidationConfig,
  ComponentTemplate,
  PageTemplate
} from '../types/unifiedTemplate';
import { StoryStyleConfig, ComponentConfig } from '../types/styleConfig';
import { UNIFIED_PAGE_DIMENSIONS } from './storyStyleUtils';

// ============================================================================
// CONSTANTES DE MIGRACIÓN
// ============================================================================

const CURRENT_VERSION = '2.0.0';
const LEGACY_VERSION = '1.0.0';

const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  strictMode: false,
  enablePerformanceChecks: true,
  enableAccessibilityChecks: true,
  enableDesignChecks: true,
  limits: {
    maxComponents: 20,
    maxImageSize: 5000, // 5MB
    maxFontSize: 120,
    minFontSize: 8
  }
};

// ============================================================================
// FUNCIÓN PRINCIPAL DE MIGRACIÓN
// ============================================================================

/**
 * Migra configuración legacy a formato unificado
 */
export function migrateToUnified(
  legacyConfig: StoryStyleConfig,
  options: {
    validateResult?: boolean;
    preserveMetadata?: boolean;
    strictMode?: boolean;
  } = {}
): MigrationResult {
  const startTime = performance.now();
  const { validateResult = true, preserveMetadata = true, strictMode = false } = options;
  
  try {
    // Generar información de migración
    const migrationInfo: MigrationInfo = {
      fromVersion: legacyConfig.version?.toString() || LEGACY_VERSION,
      toVersion: CURRENT_VERSION,
      changes: generateMigrationChanges(),
      warnings: [],
      dataLoss: false
    };
    
    // Convertir configuración
    const unifiedConfig = convertLegacyToUnified(legacyConfig, preserveMetadata);
    
    // Validar resultado si se solicita
    let validationResult: TemplateValidationResult | undefined;
    if (validateResult) {
      validationResult = validateUnifiedTemplate(unifiedConfig, {
        ...DEFAULT_VALIDATION_CONFIG,
        strictMode
      });
      
      // Agregar advertencias de validación a migración
      if (validationResult.errors.length > 0) {
        migrationInfo.warnings.push(
          `Se encontraron ${validationResult.errors.length} problemas de validación`
        );
      }
    }
    
    const migrationTime = performance.now() - startTime;
    
    return {
      success: true,
      migratedConfig: unifiedConfig,
      info: {
        ...migrationInfo,
        warnings: [
          ...migrationInfo.warnings,
          `Migración completada en ${migrationTime.toFixed(2)}ms`
        ]
      }
    };
    
  } catch (error) {
    return {
      success: false,
      info: {
        fromVersion: LEGACY_VERSION,
        toVersion: CURRENT_VERSION,
        changes: [],
        warnings: [`Error durante migración: ${error}`],
        dataLoss: true
      },
      errors: [{
        property: 'root',
        error: error instanceof Error ? error.message : 'Error desconocido',
        suggestion: 'Verificar que la configuración legacy sea válida'
      }]
    };
  }
}

// ============================================================================
// CONVERSIÓN DE CONFIGURACIÓN
// ============================================================================

function convertLegacyToUnified(
  legacyConfig: StoryStyleConfig,
  preserveMetadata: boolean
): UnifiedTemplateConfig {
  const unifiedConfig: UnifiedTemplateConfig = {
    // Identificación
    id: legacyConfig.id || generateTemplateId(),
    name: legacyConfig.name || 'Template Migrado',
    description: `Template migrado desde configuración legacy v${legacyConfig.version || '1.0'}`,
    version: CURRENT_VERSION,
    
    // Metadata del autor (si se preserva)
    ...(preserveMetadata && {
      author: {
        name: 'Sistema de Migración',
        email: 'migration@lacuenteria.cl'
      }
    }),
    
    license: 'free',
    
    // Dimensiones fijas
    dimensions: UNIFIED_PAGE_DIMENSIONS,
    
    // Configuración global
    globalStyles: {
      fontLoading: {
        googleFonts: extractGoogleFontsFromLegacy(legacyConfig),
        fallbackFonts: ['Arial', 'Helvetica', 'sans-serif']
      },
      colorScheme: extractColorSchemeFromLegacy(legacyConfig),
      animations: {
        enabled: false,
        duration: 200,
        easing: 'ease-in-out'
      }
    },
    
    // Páginas
    pages: {
      cover: convertLegacyPageToUnified(legacyConfig, 'cover'),
      content: convertLegacyPageToUnified(legacyConfig, 'content'),
      ...(legacyConfig.dedicatoriaConfig && {
        dedicatoria: convertLegacyPageToUnified(legacyConfig, 'dedicatoria')
      })
    },
    
    // Configuración de exportación
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
    
    // Compatibilidad
    compatibility: {
      minVersion: '1.0.0',
      legacySupport: true
    },
    
    // Timestamps
    createdAt: preserveMetadata && legacyConfig.createdAt 
      ? legacyConfig.createdAt 
      : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return unifiedConfig;
}

// ============================================================================
// CONVERSIÓN DE PÁGINAS
// ============================================================================

function convertLegacyPageToUnified(
  legacyConfig: StoryStyleConfig,
  pageType: 'cover' | 'content' | 'dedicatoria'
): PageTemplate {
  const pageConfig = getPageConfigFromLegacy(legacyConfig, pageType);
  const backgroundUrl = getBackgroundUrlFromLegacy(legacyConfig, pageType);
  
  return {
    id: `${pageType}-page`,
    name: `Página ${capitalizeFirst(pageType)}`,
    type: pageType,
    
    background: {
      type: backgroundUrl ? 'image' : 'color',
      value: backgroundUrl || '#ffffff',
      position: 'cover',
      repeat: 'no-repeat'
    },
    
    components: pageConfig ? [convertLegacyComponentToUnified(pageConfig, pageType)] : [],
    
    metadata: {
      description: `Página ${pageType} migrada desde configuración legacy`,
      tags: ['migrated', 'legacy', pageType],
      category: 'migrated'
    }
  };
}

function convertLegacyComponentToUnified(
  config: any,
  pageType: string
): ComponentTemplate {
  return {
    // Identificación
    id: `${pageType}-text-component`,
    name: `Texto ${capitalizeFirst(pageType)}`,
    type: 'text',
    pageType: pageType as any,
    
    // Posicionamiento
    position: config.position || 'center',
    horizontalPosition: config.horizontalPosition || 'center',
    x: 0,
    y: 0,
    zIndex: config.zIndex || 10,
    
    // Visibilidad y contenido
    visible: true,
    content: '',
    isDefault: true,
    
    // Estilos
    style: migrateStyles(config),
    containerStyle: migrateContainerStyle(config.containerStyle || {}),
    
    // Configuración unificada
    renderPriority: 0,
    
    responsive: {
      enabled: false,
      breakpoints: {}
    },
    
    accessibility: {
      ariaLabel: `Texto de ${pageType}`,
      role: 'text'
    },
    
    validation: {
      required: pageType === 'cover', // El título es requerido
      minLength: pageType === 'cover' ? 1 : 0,
      maxLength: pageType === 'cover' ? 100 : 1000
    }
  };
}

// ============================================================================
// MIGRACIÓN DE ESTILOS
// ============================================================================

function migrateStyles(legacyStyle: any): any {
  return {
    fontSize: legacyStyle.fontSize || '2rem',
    fontFamily: migrateFontFamily(legacyStyle.fontFamily),
    fontWeight: legacyStyle.fontWeight || 'normal',
    color: legacyStyle.color || '#000000',
    textAlign: legacyStyle.textAlign || 'center',
    textShadow: legacyStyle.textShadow || 'none',
    letterSpacing: legacyStyle.letterSpacing || 'normal',
    lineHeight: legacyStyle.lineHeight || '1.5',
    textTransform: legacyStyle.textTransform || 'none',
    backgroundColor: legacyStyle.backgroundColor || 'transparent',
    padding: legacyStyle.padding || '0',
    borderRadius: legacyStyle.borderRadius || '0',
    border: legacyStyle.border || 'none',
    boxShadow: legacyStyle.boxShadow || 'none',
    backdropFilter: legacyStyle.backdropFilter || 'none',
    opacity: legacyStyle.opacity !== undefined ? legacyStyle.opacity : 1
  };
}

function migrateContainerStyle(legacyContainer: any): any {
  return {
    background: legacyContainer.background || 'transparent',
    padding: legacyContainer.padding || '0',
    margin: legacyContainer.margin || '0',
    borderRadius: legacyContainer.borderRadius || '0',
    maxWidth: legacyContainer.maxWidth || '85%',
    minHeight: legacyContainer.minHeight || 'auto',
    border: legacyContainer.border || 'none',
    boxShadow: legacyContainer.boxShadow || 'none',
    backdropFilter: legacyContainer.backdropFilter || 'none',
    
    // Nuevos campos para sistema unificado
    horizontalAlignment: legacyContainer.horizontalAlignment || 'center',
    verticalAlignment: legacyContainer.verticalAlignment || 'center',
    scaleWidth: legacyContainer.scaleWidth || '100',
    scaleHeight: legacyContainer.scaleHeight || '100',
    scaleWidthUnit: legacyContainer.scaleWidthUnit || '%',
    scaleHeightUnit: legacyContainer.scaleHeightUnit || '%',
    maintainAspectRatio: legacyContainer.maintainAspectRatio || false
  };
}

function migrateFontFamily(fontFamily?: string): string {
  if (!fontFamily) return '"Arial", sans-serif';
  
  // Limpiar y decodificar fontFamily
  const cleaned = fontFamily
    .replace(/&amp;quot;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;#39;/g, "'");
  
  // Asegurar formato consistente
  if (!cleaned.includes(',')) {
    // Si no tiene fallback, agregarlo
    const fontName = cleaned.replace(/['"]/g, '');
    return `"${fontName}", sans-serif`;
  }
  
  return cleaned;
}

// ============================================================================
// EXTRACCIÓN DE DATOS LEGACY
// ============================================================================

function getPageConfigFromLegacy(
  config: StoryStyleConfig,
  pageType: 'cover' | 'content' | 'dedicatoria'
): any {
  switch (pageType) {
    case 'cover':
      return config.coverConfig?.title;
    case 'dedicatoria':
      return config.dedicatoriaConfig?.text || config.pageConfig?.text;
    case 'content':
    default:
      return config.pageConfig?.text;
  }
}

function getBackgroundUrlFromLegacy(
  config: StoryStyleConfig,
  pageType: 'cover' | 'content' | 'dedicatoria'
): string | undefined {
  switch (pageType) {
    case 'cover':
      return config.coverBackgroundUrl;
    case 'dedicatoria':
      return config.dedicatoriaBackgroundUrl;
    case 'content':
    default:
      return config.pageBackgroundUrl;
  }
}

function extractGoogleFontsFromLegacy(config: StoryStyleConfig): string[] {
  const fonts = new Set<string>();
  
  // Extraer de configuraciones de páginas
  [
    config.coverConfig?.title?.fontFamily,
    config.pageConfig?.text?.fontFamily,
    config.dedicatoriaConfig?.text?.fontFamily
  ].forEach(fontFamily => {
    if (fontFamily) {
      const fontName = extractFontNameFromFamily(fontFamily);
      if (isGoogleFont(fontName)) {
        fonts.add(fontName);
      }
    }
  });
  
  return Array.from(fonts);
}

function extractColorSchemeFromLegacy(config: StoryStyleConfig): any {
  return {
    primary: config.coverConfig?.title?.color || '#000000',
    secondary: config.pageConfig?.text?.color || '#333333',
    accent: '#0066cc',
    text: config.pageConfig?.text?.color || '#000000',
    background: '#ffffff'
  };
}

// ============================================================================
// VALIDACIÓN DE TEMPLATES UNIFICADOS
// ============================================================================

export function validateUnifiedTemplate(
  config: UnifiedTemplateConfig,
  validationConfig: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): TemplateValidationResult {
  const errors: Array<any> = [];
  const recommendations: Array<any> = [];
  let score = 100;
  
  // Validar estructura básica
  if (!config.id || config.id.length < 3) {
    errors.push({
      type: 'error' as const,
      message: 'ID del template debe tener al menos 3 caracteres',
      location: 'id',
      fix: 'Generar un ID único válido'
    });
    score -= 10;
  }
  
  if (!config.name || config.name.length < 1) {
    errors.push({
      type: 'error' as const,
      message: 'El template debe tener un nombre',
      location: 'name',
      fix: 'Asignar un nombre descriptivo'
    });
    score -= 10;
  }
  
  // Validar páginas
  ['cover', 'content'].forEach(pageType => {
    const page = config.pages[pageType as keyof typeof config.pages];
    if (!page) {
      errors.push({
        type: 'critical' as const,
        message: `Página ${pageType} es requerida`,
        location: `pages.${pageType}`,
        fix: `Crear configuración para página ${pageType}`
      });
      score -= 20;
      return;
    }
    
    // Validar componentes de la página
    const componentValidation = validatePageComponents(page, validationConfig);
    errors.push(...componentValidation.errors);
    score -= componentValidation.scorePenalty;
  });
  
  // Validar fuentes
  if (validationConfig.enablePerformanceChecks) {
    const fontValidation = validateFonts(config);
    recommendations.push(...fontValidation.recommendations);
    score -= fontValidation.scorePenalty;
  }
  
  // Validar accesibilidad
  if (validationConfig.enableAccessibilityChecks) {
    const a11yValidation = validateAccessibility(config);
    recommendations.push(...a11yValidation.recommendations);
    score -= a11yValidation.scorePenalty;
  }
  
  return {
    isValid: errors.filter(e => e.type === 'critical' || e.type === 'error').length === 0,
    score: Math.max(0, score),
    errors,
    recommendations
  };
}

// ============================================================================
// VALIDACIONES ESPECÍFICAS
// ============================================================================

function validatePageComponents(
  page: PageTemplate,
  config: ValidationConfig
): { errors: any[]; scorePenalty: number } {
  const errors: any[] = [];
  let scorePenalty = 0;
  
  if (page.components.length > config.limits.maxComponents) {
    errors.push({
      type: 'warning' as const,
      message: `Demasiados componentes (${page.components.length}/${config.limits.maxComponents})`,
      location: `pages.${page.type}.components`,
      fix: 'Reducir número de componentes para mejorar rendimiento'
    });
    scorePenalty += 5;
  }
  
  page.components.forEach((component, index) => {
    // Validar tamaño de fuente
    if (component.type === 'text' && component.style?.fontSize) {
      const fontSize = parseFloat(component.style.fontSize);
      if (fontSize > config.limits.maxFontSize) {
        errors.push({
          type: 'warning' as const,
          message: `Tamaño de fuente muy grande: ${fontSize}px`,
          location: `pages.${page.type}.components[${index}].style.fontSize`,
          fix: `Reducir a máximo ${config.limits.maxFontSize}px`
        });
        scorePenalty += 2;
      }
      
      if (fontSize < config.limits.minFontSize) {
        errors.push({
          type: 'warning' as const,
          message: `Tamaño de fuente muy pequeño: ${fontSize}px`,
          location: `pages.${page.type}.components[${index}].style.fontSize`,
          fix: `Aumentar a mínimo ${config.limits.minFontSize}px`
        });
        scorePenalty += 2;
      }
    }
  });
  
  return { errors, scorePenalty };
}

function validateFonts(config: UnifiedTemplateConfig): {
  recommendations: any[];
  scorePenalty: number;
} {
  const recommendations: any[] = [];
  let scorePenalty = 0;
  
  if (config.globalStyles.fontLoading.googleFonts.length > 3) {
    recommendations.push({
      type: 'performance' as const,
      message: 'Demasiadas fuentes de Google Fonts pueden afectar el rendimiento',
      impact: 'medium' as const
    });
    scorePenalty += 5;
  }
  
  return { recommendations, scorePenalty };
}

function validateAccessibility(config: UnifiedTemplateConfig): {
  recommendations: any[];
  scorePenalty: number;
} {
  const recommendations: any[] = [];
  let scorePenalty = 0;
  
  // Verificar contraste de colores (simplificado)
  const colors = config.globalStyles.colorScheme;
  if (colors.text === colors.background) {
    recommendations.push({
      type: 'accessibility' as const,
      message: 'Contraste insuficiente entre texto y fondo',
      impact: 'high' as const
    });
    scorePenalty += 10;
  }
  
  return { recommendations, scorePenalty };
}

// ============================================================================
// UTILIDADES
// ============================================================================

function generateMigrationChanges(): MigrationInfo['changes'] {
  return [
    {
      type: 'added',
      property: 'pages',
      description: 'Nueva estructura de páginas unificada',
      autoMigrate: true
    },
    {
      type: 'added',
      property: 'globalStyles',
      description: 'Configuración global de estilos',
      autoMigrate: true
    },
    {
      type: 'added',
      property: 'export',
      description: 'Configuración de exportación avanzada',
      autoMigrate: true
    },
    {
      type: 'modified',
      property: 'components',
      description: 'Componentes con nuevas propiedades de accesibilidad',
      autoMigrate: true
    },
    {
      type: 'deprecated',
      property: 'coverConfig',
      description: 'Reemplazado por pages.cover',
      autoMigrate: true
    },
    {
      type: 'deprecated',
      property: 'pageConfig',
      description: 'Reemplazado por pages.content',
      autoMigrate: true
    }
  ];
}

function generateTemplateId(): string {
  return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function extractFontNameFromFamily(fontFamily: string): string {
  const match = fontFamily.match(/^["']?([^"',]+)["']?/);
  return match ? match[1].trim() : 'Arial';
}

function isGoogleFont(fontName: string): boolean {
  const commonSystemFonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 
    'Verdana', 'Courier', 'serif', 'sans-serif', 'monospace'
  ];
  
  return !commonSystemFonts.includes(fontName);
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default {
  migrateToUnified,
  validateUnifiedTemplate,
  DEFAULT_VALIDATION_CONFIG
};

export {
  migrateToUnified,
  validateUnifiedTemplate,
  DEFAULT_VALIDATION_CONFIG
};