import { UnifiedRenderOptions } from '../types/unifiedTemplate';
import { StoryStyleConfig } from '../types/styleConfig';

/**
 * Interfaz para el resultado de la validación
 */
export interface TemplateRendererValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  sanitizedProps?: any;
}

/**
 * Interfaz para las props del TemplateRenderer
 */
export interface TemplateRendererPropsToValidate {
  config: any;
  pageType: string;
  content?: any;
  renderOptions: UnifiedRenderOptions;
  onComponentSelect?: (componentId: string | null) => void;
  onComponentUpdate?: (componentId: string, updates: any) => void;
  selectedComponentId?: string;
  debug?: boolean;
}

/**
 * Valida las props del TemplateRenderer para identificar problemas potenciales
 */
export function validateTemplateRendererProps(
  props: TemplateRendererPropsToValidate,
  context: string = 'unknown'
): TemplateRendererValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  console.group(`🔍 TemplateRenderer Props Validation (${context})`);
  
  try {
    // === VALIDACIÓN DE CONFIG ===
    if (!props.config) {
      errors.push('Config is null or undefined');
    } else {
      if (!props.config.id && !props.config.name) {
        warnings.push('Config has no id or name identifier');
      }
      
      if (props.config.components && !Array.isArray(props.config.components)) {
        errors.push('Config.components is not an array');
      }
      
      console.log('✅ Config validation:', {
        hasConfig: !!props.config,
        configId: props.config?.id,
        configName: props.config?.name,
        hasComponents: !!props.config?.components,
        componentsCount: props.config?.components?.length || 0
      });
    }

    // === VALIDACIÓN DE PAGE TYPE ===
    const validPageTypes = ['cover', 'content', 'dedicatoria', 'page'];
    if (!validPageTypes.includes(props.pageType)) {
      errors.push(`Invalid pageType: ${props.pageType}. Must be one of: ${validPageTypes.join(', ')}`);
    }
    
    console.log('✅ PageType validation:', {
      pageType: props.pageType,
      isValid: validPageTypes.includes(props.pageType)
    });

    // === VALIDACIÓN DE CONTENT ===
    if (props.content) {
      const contentKeys = Object.keys(props.content);
      if (contentKeys.length === 0) {
        warnings.push('Content object is empty');
      }
      
      // Verificar content apropiado para pageType
      if (props.pageType === 'cover' && !props.content.title) {
        warnings.push('Cover page without title content');
      }
      
      if (props.pageType === 'content' && !props.content.text) {
        warnings.push('Content page without text content');
      }
      
      console.log('✅ Content validation:', {
        hasContent: !!props.content,
        contentKeys,
        pageTypeMatch: checkContentPageTypeMatch(props.content, props.pageType)
      });
    }

    // === VALIDACIÓN DE RENDER OPTIONS ===
    if (!props.renderOptions) {
      errors.push('RenderOptions is required');
    } else {
      // Validar context
      if (!props.renderOptions.context) {
        warnings.push('RenderOptions.context not specified');
      }
      
      // Validar targetDimensions con enableScaling
      if (props.renderOptions.enableScaling && !props.renderOptions.targetDimensions) {
        errors.push('enableScaling requires targetDimensions to be specified');
      }
      
      // Validar targetDimensions válidas
      if (props.renderOptions.targetDimensions) {
        const { width, height } = props.renderOptions.targetDimensions;
        if (!width || !height || width <= 0 || height <= 0) {
          errors.push('targetDimensions must have valid positive width and height');
        }
        
        // Advertir sobre dimensiones extremas
        if (width > 5000 || height > 5000) {
          warnings.push('targetDimensions are unusually large, may cause performance issues');
        }
      }
      
      console.log('✅ RenderOptions validation:', {
        hasRenderOptions: !!props.renderOptions,
        context: props.renderOptions?.context,
        enableScaling: props.renderOptions?.enableScaling,
        preserveAspectRatio: props.renderOptions?.preserveAspectRatio,
        targetDimensions: props.renderOptions?.targetDimensions,
        hasFeatures: !!props.renderOptions?.features,
        hasPerformance: !!props.renderOptions?.performance
      });
    }

    // === VALIDACIÓN DE CALLBACKS ===
    if (props.onComponentSelect && typeof props.onComponentSelect !== 'function') {
      errors.push('onComponentSelect must be a function');
    }
    
    if (props.onComponentUpdate && typeof props.onComponentUpdate !== 'function') {
      errors.push('onComponentUpdate must be a function');
    }
    
    console.log('✅ Callbacks validation:', {
      hasOnComponentSelect: !!props.onComponentSelect,
      hasOnComponentUpdate: !!props.onComponentUpdate,
      selectedComponentId: props.selectedComponentId
    });

    // === ANÁLISIS DE CONFLICTOS POTENCIALES ===
    const potentialConflicts = analyzePotentialConflicts(props);
    warnings.push(...potentialConflicts);

  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
    console.error('❌ Validation exception:', error);
  }

  console.log('📊 Validation Summary:', {
    isValid: errors.length === 0,
    errorsCount: errors.length,
    warningsCount: warnings.length,
    errors,
    warnings
  });
  
  console.groupEnd();

  const result: TemplateRendererValidationResult = {
    isValid: errors.length === 0,
    warnings,
    errors,
    sanitizedProps: errors.length === 0 ? sanitizeProps(props) : undefined
  };

  return result;
}

/**
 * Verifica si el content coincide con el pageType
 */
function checkContentPageTypeMatch(content: any, pageType: string): boolean {
  switch (pageType) {
    case 'cover':
      return !!(content.title || content.authorName);
    case 'content':
    case 'page':
      return !!content.text;
    case 'dedicatoria':
      return !!(content.dedicatoryText || content.text);
    default:
      return true;
  }
}

/**
 * Analiza conflictos potenciales en las props
 */
function analyzePotentialConflicts(props: TemplateRendererPropsToValidate): string[] {
  const conflicts: string[] = [];

  // Conflicto: enableScaling con dimensiones dinámicas
  if (props.renderOptions?.enableScaling && props.renderOptions?.targetDimensions) {
    const { width, height } = props.renderOptions.targetDimensions;
    const aspectRatio = width / height;
    
    // Verificar aspect ratios comunes problemáticos
    if (aspectRatio !== 3/2 && aspectRatio !== 16/9 && aspectRatio !== 4/3) {
      conflicts.push(`Unusual aspect ratio (${aspectRatio.toFixed(2)}) with enableScaling may cause conflicts`);
    }
  }

  // Conflicto: preserveAspectRatio con targetDimensions específicas
  if (props.renderOptions?.preserveAspectRatio && props.renderOptions?.targetDimensions) {
    conflicts.push('preserveAspectRatio + specific targetDimensions may cause layout conflicts');
  }

  // Conflicto: context admin-edit con performance optimization
  if (props.renderOptions?.context === 'admin-edit' && 
      props.renderOptions?.performance?.optimizeFor === 'speed') {
    conflicts.push('admin-edit context usually requires quality optimization, not speed');
  }

  // Conflicto: debug mode en production-like context
  if (props.debug && props.renderOptions?.context !== 'admin-edit') {
    conflicts.push('debug mode enabled in non-admin context');
  }

  return conflicts;
}

/**
 * Sanitiza las props para evitar problemas conocidos
 */
function sanitizeProps(props: TemplateRendererPropsToValidate): TemplateRendererPropsToValidate {
  const sanitized = { ...props };

  // Sanitizar renderOptions
  if (sanitized.renderOptions) {
    sanitized.renderOptions = { ...sanitized.renderOptions };

    // CONFLICTO 1: enableScaling + preserveAspectRatio + targetDimensions específicas
    // SOLUCIÓN: Deshabilitar enableScaling para evitar doble scaling con StylePreview
    if (sanitized.renderOptions.enableScaling && sanitized.renderOptions.preserveAspectRatio) {
      console.warn('🔧 Sanitizing: Disabling enableScaling due to conflict with preserveAspectRatio in StylePreview context');
      sanitized.renderOptions.enableScaling = false;
    }

    // CONFLICTO 2: preserveAspectRatio + targetDimensions específicas
    // SOLUCIÓN: Deshabilitar preserveAspectRatio cuando targetDimensions están especificadas
    if (sanitized.renderOptions.preserveAspectRatio && sanitized.renderOptions.targetDimensions) {
      console.warn('🔧 Sanitizing: Disabling preserveAspectRatio due to specific targetDimensions');
      sanitized.renderOptions.preserveAspectRatio = false;
    }

    // Si enableScaling está activo pero no hay targetDimensions, deshabilitarlo
    if (sanitized.renderOptions.enableScaling && !sanitized.renderOptions.targetDimensions) {
      console.warn('🔧 Sanitizing: Disabling enableScaling due to missing targetDimensions');
      sanitized.renderOptions.enableScaling = false;
    }

    // Asegurar dimensiones válidas y con aspect ratio estándar
    if (sanitized.renderOptions.targetDimensions) {
      const dims = sanitized.renderOptions.targetDimensions;
      if (dims.width <= 0 || dims.height <= 0) {
        console.warn('🔧 Sanitizing: Setting default targetDimensions due to invalid values');
        sanitized.renderOptions.targetDimensions = { width: 1536, height: 1024 };
      } else {
        // Verificar aspect ratio problemático (1.50)
        const aspectRatio = dims.width / dims.height;
        if (Math.abs(aspectRatio - 1.5) < 0.01) {
          console.warn('🔧 Sanitizing: Adjusting targetDimensions to avoid problematic aspect ratio 1.50');
          // Cambiar a aspect ratio 3:2 estándar (1536:1024)
          sanitized.renderOptions.targetDimensions = { width: 1536, height: 1024 };
        }
      }
    }

    // CONFLICTO ADICIONAL: StylePreview context requiere configuración específica
    if (sanitized.renderOptions.context === 'admin-edit') {
      console.warn('🔧 Sanitizing: Applying StylePreview-safe configuration for admin-edit context');
      
      // CAMBIO: Mantener scaling habilitado para StylePreview para que las imágenes escalen correctamente
      // sanitized.renderOptions.enableScaling = false; // COMENTADO - permitir scaling
      // sanitized.renderOptions.preserveAspectRatio = false; // COMENTADO - permitir aspect ratio
      
      // Mantener dimensiones dinámicas si fueron proporcionadas
      if (!sanitized.renderOptions.targetDimensions || 
          (sanitized.renderOptions.targetDimensions.width === 1536 && 
           sanitized.renderOptions.targetDimensions.height === 1024)) {
        // Solo usar fijas como fallback
        sanitized.renderOptions.targetDimensions = { width: 1536, height: 1024 };
      }
      
      // Optimizar para preview interactivo
      if (sanitized.renderOptions.performance) {
        sanitized.renderOptions.performance.optimizeFor = 'quality';
        sanitized.renderOptions.performance.lazyLoadImages = false;
      }
    }

    // Asegurar features válidas
    if (!sanitized.renderOptions.features) {
      sanitized.renderOptions.features = {
        enableAnimations: false,
        enableInteractions: true,
        enableDebugInfo: false,
        enableValidation: true
      };
    }

    // Asegurar performance config válida
    if (!sanitized.renderOptions.performance) {
      sanitized.renderOptions.performance = {
        lazyLoadImages: false,
        optimizeFor: 'quality'
      };
    }
  }

  // Sanitizar content vacío
  if (sanitized.content && Object.keys(sanitized.content).length === 0) {
    console.warn('🔧 Sanitizing: Adding default content for empty content object');
    switch (sanitized.pageType) {
      case 'cover':
        sanitized.content = { title: 'Título de Ejemplo', authorName: 'Autor Demo' };
        break;
      case 'content':
      case 'page':
        sanitized.content = { text: 'Contenido de ejemplo para preview.' };
        break;
      case 'dedicatoria':
        sanitized.content = { dedicatoryText: 'Dedicatoria de ejemplo.' };
        break;
    }
  }

  return sanitized;
}

/**
 * Utility para log de props en contexto específico
 */
export function logTemplateRendererProps(props: any, context: string): void {
  console.group(`📋 TemplateRenderer Props Log (${context})`);
  console.log('Props Overview:', {
    hasConfig: !!props.config,
    configName: props.config?.name,
    pageType: props.pageType,
    hasContent: !!props.content,
    hasRenderOptions: !!props.renderOptions,
    debug: props.debug,
    context: props.renderOptions?.context
  });
  console.log('Full Props:', props);
  console.groupEnd();
}