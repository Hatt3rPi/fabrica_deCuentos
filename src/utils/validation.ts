// Utilidades de validación y sanitización para el sistema de estilos
// Prevención de inyección CSS, XSS y validación de estructuras de datos

import { StoryStyleConfig, ComponentConfig, StyleTemplate } from '../types/styleConfig';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: unknown;
}

export interface SanitizationOptions {
  allowedCSSProperties?: string[];
  allowedHTMLTags?: string[];
  maxStringLength?: number;
}

// ============================================================================
// PATRONES DE VALIDACIÓN
// ============================================================================

const CSS_INJECTION_PATTERNS = [
  /javascript\s*:/i,
  /expression\s*\(/i,
  /url\s*\(\s*["']?\s*javascript:/i,
  /url\s*\(\s*["']?\s*data\s*:/i,
  /@import/i,
  /binding\s*:/i,
  /behavior\s*:/i,
  /-moz-binding/i,
];

const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript\s*:/i,
  /on\w+\s*=/i,
  /<iframe[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<object[^>]*>/gi,
];

const ALLOWED_CSS_PROPERTIES = [
  'color', 'background', 'backgroundColor', 'font-family', 'fontFamily',
  'font-size', 'fontSize', 'font-weight', 'fontWeight', 'text-align', 'textAlign',
  'text-shadow', 'textShadow', 'letter-spacing', 'letterSpacing', 'line-height', 'lineHeight',
  'padding', 'margin', 'border', 'border-radius', 'borderRadius', 'box-shadow', 'boxShadow',
  'backdrop-filter', 'backdropFilter', 'opacity', 'max-width', 'maxWidth', 'min-height', 'minHeight',
  'width', 'height', 'position', 'top', 'left', 'right', 'bottom', 'z-index', 'zIndex',
  'object-fit', 'objectFit', 'text-transform', 'textTransform'
];

// ============================================================================
// FUNCIONES DE SANITIZACIÓN
// ============================================================================

/**
 * Sanitiza cadenas de texto para prevenir XSS
 */
export function sanitizeString(
  input: string, 
  maxLength: number = 1000,
  allowHTML: boolean = false
): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.slice(0, maxLength);

  if (!allowHTML) {
    // Escapar caracteres HTML peligrosos
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  } else {
    // Remover patrones XSS pero mantener HTML básico
    XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
  }

  return sanitized.trim();
}

/**
 * Sanitiza valores CSS para prevenir inyección
 */
export function sanitizeCSSValue(property: string, value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // Verificar propiedad permitida
  if (!ALLOWED_CSS_PROPERTIES.includes(property)) {
    console.warn(`CSS property not allowed: ${property}`);
    return null;
  }

  if (typeof value === 'string') {
    // Buscar patrones de inyección CSS
    for (const pattern of CSS_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        console.warn(`Potential CSS injection detected in ${property}: ${value}`);
        return null;
      }
    }

    // Sanitizar valor
    return sanitizeString(value, 200);
  }

  if (typeof value === 'number') {
    // Validar rangos numéricos razonables
    if (property.includes('opacity')) {
      return Math.max(0, Math.min(1, value));
    }
    if (property.includes('z-index') || property.includes('zIndex')) {
      return Math.max(-100, Math.min(1000, value));
    }
    return value;
  }

  return value;
}

/**
 * Sanitiza objeto de estilos CSS completo
 */
export function sanitizeCSSObject(styles: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [property, value] of Object.entries(styles)) {
    const sanitizedValue = sanitizeCSSValue(property, value);
    if (sanitizedValue !== null) {
      sanitized[property] = sanitizedValue;
    }
  }

  return sanitized;
}

/**
 * Sanitización profunda de objetos anidados
 */
export function sanitizeDeep(obj: unknown, depth: number = 0): unknown {
  if (depth > 10) {
    console.warn('Maximum sanitization depth reached');
    return null;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeDeep(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key, 100);
      
      // Sanitización específica para estilos CSS
      if (sanitizedKey === 'style' && typeof value === 'object') {
        sanitized[sanitizedKey] = sanitizeCSSObject(value);
      } else {
        sanitized[sanitizedKey] = sanitizeDeep(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

// ============================================================================
// FUNCIONES DE VALIDACIÓN ESPECÍFICAS
// ============================================================================

/**
 * Valida configuración de componente
 */
export function validateComponentConfig(component: unknown): ValidationResult {
  const comp = component as ComponentConfig;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validaciones obligatorias
  if (!comp.id || typeof comp.id !== 'string') {
    errors.push('Component ID is required and must be a string');
  }

  if (!comp.name || typeof comp.name !== 'string') {
    errors.push('Component name is required and must be a string');
  }

  if (!['text', 'image'].includes(comp.type)) {
    errors.push('Component type must be "text" or "image"');
  }

  if (!['cover', 'page', 'dedicatoria'].includes(comp.pageType)) {
    errors.push('Component pageType must be "cover", "page", or "dedicatoria"');
  }

  // Validaciones específicas por tipo
  if (comp.type === 'text') {
    const textComp = comp as { content?: unknown };
    if (textComp.content && typeof textComp.content !== 'string') {
      errors.push('Text component content must be a string');
    }
  }

  if (comp.type === 'image') {
    const imageComp = comp as { url?: unknown };
    if (imageComp.url && typeof imageComp.url !== 'string') {
      errors.push('Image component URL must be a string');
    }
    
    // Validar URL de imagen
    if (imageComp.url && typeof imageComp.url === 'string') {
      try {
        new URL(imageComp.url);
      } catch {
        // Permitir URLs relativas
        if (!imageComp.url.startsWith('/') && !imageComp.url.startsWith('./')) {
          warnings.push('Image URL should be a valid URL or relative path');
        }
      }
    }
  }

  // Validar coordenadas
  if (typeof comp.x === 'number') {
    if (comp.x < 0 || comp.x > 2000) {
      warnings.push('X coordinate should be between 0 and 2000');
    }
  }

  if (typeof comp.y === 'number') {
    if (comp.y < 0 || comp.y > 2000) {
      warnings.push('Y coordinate should be between 0 and 2000');
    }
  }

  // Sanitizar datos
  const sanitizedComponent = sanitizeDeep(comp);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: sanitizedComponent
  };
}

/**
 * Valida template de estilo completo
 */
export function validateStyleTemplate(template: unknown): ValidationResult {
  const tmpl = template as StyleTemplate;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validaciones básicas
  if (!tmpl.name || typeof tmpl.name !== 'string') {
    errors.push('Template name is required');
  }

  if (!tmpl.configData || typeof tmpl.configData !== 'object') {
    errors.push('Template configData is required');
  }

  // Validar estructura configData
  if (tmpl.configData) {
    if (!tmpl.configData.cover_config) {
      errors.push('Template must have cover_config');
    }

    if (!tmpl.configData.page_config) {
      errors.push('Template must have page_config');
    }

    // Validar componentes si existen
    if (tmpl.configData.components) {
      if (!Array.isArray(tmpl.configData.components)) {
        errors.push('Template components must be an array');
      } else {
        tmpl.configData.components.forEach((component, index) => {
          const validation = validateComponentConfig(component);
          if (!validation.isValid) {
            errors.push(`Component ${index}: ${validation.errors.join(', ')}`);
          }
          warnings.push(...validation.warnings);
        });
      }
    }
  }

  // Sanitizar template completo
  const sanitizedTemplate = sanitizeDeep(tmpl);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: sanitizedTemplate
  };
}

/**
 * Valida configuración de estilo completa
 */
export function validateStoryStyleConfig(config: unknown): ValidationResult {
  const cfg = config as StoryStyleConfig;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validaciones básicas de estructura
  if (!cfg.coverConfig) {
    errors.push('Cover configuration is required');
  }

  if (!cfg.pageConfig) {
    errors.push('Page configuration is required');
  }

  // Validar que las configuraciones tengan la estructura correcta
  if (cfg.coverConfig && !cfg.coverConfig.title) {
    errors.push('Cover configuration must have title settings');
  }

  if (cfg.pageConfig && !cfg.pageConfig.text) {
    errors.push('Page configuration must have text settings');
  }

  // Sanitizar configuración completa
  const sanitizedConfig = sanitizeDeep(cfg);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: sanitizedConfig
  };
}

// ============================================================================
// UTILIDADES DE COMPARACIÓN
// ============================================================================

/**
 * Comparación profunda de objetos optimizada para detectar cambios
 * Alternativa ligera a lodash.isEqual
 */
export function isEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  
  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!isEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!isEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

// ============================================================================
// FUNCIÓN DE VALIDACIÓN UNIFICADA
// ============================================================================

/**
 * Función principal de validación que determina el tipo y aplica validación apropiada
 */
export function validateAndSanitize(data: unknown, type: 'component' | 'template' | 'config'): ValidationResult {
  try {
    switch (type) {
      case 'component':
        return validateComponentConfig(data);
      case 'template':
        return validateStyleTemplate(data);
      case 'config':
        return validateStoryStyleConfig(data);
      default:
        return {
          isValid: false,
          errors: ['Unknown validation type'],
          warnings: [],
          sanitizedData: sanitizeDeep(data)
        };
    }
  } catch (error) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      sanitizedData: null
    };
  }
}