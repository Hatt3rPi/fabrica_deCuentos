// ============================================================================
// TIPOS PARA SISTEMA DE TEMPLATES UNIFICADO
// ============================================================================

/**
 * Sistema de templates unificado que garantiza renderizado idéntico
 * en Admin/Style, Wizard, PDF y Visualizador
 */

import { ComponentConfig } from './styleConfig';

// ============================================================================
// INTERFACES BASE
// ============================================================================

/**
 * Dimensiones fijas para todas las páginas
 * Garantiza consistencia visual entre todos los contextos
 */
export interface FixedDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Configuración de fondo para una página
 */
export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image';
  value: string; // Color hex, gradient CSS, o URL de imagen
  opacity?: number;
  position?: 'center' | 'cover' | 'contain' | 'stretch';
  repeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
}

/**
 * Configuración global que aplica a todas las páginas
 */
export interface GlobalStyleConfig {
  fontLoading: {
    googleFonts: string[]; // Lista de fuentes de Google Fonts a cargar
    fallbackFonts: string[]; // Fuentes de fallback del sistema
  };
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  animations: {
    enabled: boolean;
    duration: number; // en ms
    easing: string; // CSS easing function
  };
}

/**
 * Template de una página individual
 */
export interface PageTemplate {
  id: string;
  name: string;
  type: 'cover' | 'content' | 'dedicatoria';
  background: BackgroundConfig;
  components: ComponentTemplate[];
  metadata?: {
    description?: string;
    tags?: string[];
    category?: string;
  };
}

/**
 * Template de un componente individual
 * Extiende ComponentConfig con información adicional para renderizado unificado
 */
export interface ComponentTemplate extends ComponentConfig {
  // Información adicional para renderizado unificado
  renderPriority: number; // Orden de renderizado (0 = primero)
  responsive: {
    enabled: boolean;
    breakpoints?: {
      mobile?: Partial<ComponentConfig>;
      tablet?: Partial<ComponentConfig>;
      desktop?: Partial<ComponentConfig>;
    };
  };
  accessibility: {
    altText?: string; // Para imágenes
    ariaLabel?: string; // Para componentes interactivos
    role?: string; // ARIA role
  };
  validation: {
    required: boolean; // Si el componente es obligatorio
    minLength?: number; // Para textos
    maxLength?: number; // Para textos
    allowedFormats?: string[]; // Para imágenes
  };
}

// ============================================================================
// CONFIGURACIÓN PRINCIPAL DEL TEMPLATE UNIFICADO
// ============================================================================

/**
 * Configuración completa de un template unificado
 * Esta estructura garantiza renderizado idéntico en todos los contextos
 */
export interface UnifiedTemplateConfig {
  // Identificación y metadata
  id: string;
  name: string;
  description?: string;
  version: string; // Versionado para compatibilidad
  
  // Autor y licencia
  author?: {
    name: string;
    email?: string;
    website?: string;
  };
  license?: 'free' | 'premium' | 'custom';
  
  // Dimensiones fijas para todas las páginas
  dimensions: FixedDimensions;
  
  // Configuración global
  globalStyles: GlobalStyleConfig;
  
  // Templates de páginas
  pages: {
    cover: PageTemplate;
    content: PageTemplate;
    dedicatoria?: PageTemplate; // Opcional
  };
  
  // Configuración de exportación
  export: {
    pdf: {
      format: 'A4' | 'Letter' | 'A3' | 'Custom';
      orientation: 'portrait' | 'landscape';
      margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
      quality: 'draft' | 'standard' | 'high' | 'print';
    };
    preview: {
      enableGrid: boolean;
      enableRulers: boolean;
      defaultZoom: number; // Porcentaje
    };
  };
  
  // Compatibilidad y migración
  compatibility: {
    minVersion: string; // Versión mínima de la app
    maxVersion?: string; // Versión máxima compatible
    legacySupport: boolean; // Si soporta migración desde formato legacy
  };
  
  // Timestamps
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// ============================================================================
// TIPOS PARA RENDERIZADO
// ============================================================================

/**
 * Contexto de renderizado para optimizaciones específicas
 */
export type UnifiedRenderContext = 
  | 'admin-edit'     // Admin con capacidades de edición
  | 'admin-preview'  // Admin solo vista previa
  | 'wizard'         // Wizard paso de preview
  | 'pdf'            // Generación de PDF
  | 'viewer'         // Visualizador de cuentos
  | 'thumbnail';     // Generación de thumbnails

/**
 * Configuración para el renderizado
 */
export interface UnifiedRenderOptions {
  context: UnifiedRenderContext;
  
  // Escalado y dimensiones
  targetDimensions?: {
    width: number;
    height: number;
  };
  enableScaling: boolean;
  preserveAspectRatio: boolean;
  
  // Características específicas por contexto
  features: {
    enableAnimations: boolean;
    enableInteractions: boolean; // Drag & drop, click handlers
    enableDebugInfo: boolean;
    enableValidation: boolean;
  };
  
  // Optimizaciones de rendimiento
  performance: {
    lazyLoadImages: boolean;
    optimizeFor: 'speed' | 'quality' | 'balance';
    maxImageSize?: number; // en KB
  };
}

/**
 * Resultado del renderizado unificado
 */
export interface UnifiedRenderResult {
  success: boolean;
  renderedHTML?: string; // Para PDF
  renderedComponent?: React.ReactElement; // Para React contexts
  
  // Información de debugging
  debug?: {
    renderTime: number; // en ms
    componentCount: number;
    fontesUsed: string[];
    scaleFactor?: number;
    warnings: string[];
    errors: string[];
  };
  
  // Metadata del resultado
  metadata: {
    dimensions: FixedDimensions;
    context: UnifiedRenderContext;
    templateId: string;
    version: string;
  };
}

// ============================================================================
// TIPOS DE VALIDACIÓN
// ============================================================================

/**
 * Resultado de validación de template
 */
export interface TemplateValidationResult {
  isValid: boolean;
  score: number; // 0-100, calidad del template
  
  errors: Array<{
    type: 'critical' | 'error' | 'warning' | 'info';
    message: string;
    location?: string; // path del problema (ej: "pages.cover.components[0]")
    fix?: string; // sugerencia de solución
  }>;
  
  recommendations?: Array<{
    type: 'performance' | 'accessibility' | 'design' | 'compatibility';
    message: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Configuración de validación
 */
export interface ValidationConfig {
  strictMode: boolean; // Validación estricta vs permisiva
  enablePerformanceChecks: boolean;
  enableAccessibilityChecks: boolean;
  enableDesignChecks: boolean;
  
  limits: {
    maxComponents: number;
    maxImageSize: number; // en KB
    maxFontSize: number; // en px
    minFontSize: number; // en px
  };
}

// ============================================================================
// TIPOS DE MIGRACIÓN
// ============================================================================

/**
 * Información de migración desde formato legacy
 */
export interface MigrationInfo {
  fromVersion: string;
  toVersion: string;
  
  changes: Array<{
    type: 'added' | 'removed' | 'modified' | 'deprecated';
    property: string;
    description: string;
    autoMigrate: boolean;
  }>;
  
  warnings: string[];
  dataLoss: boolean; // Si la migración implica pérdida de datos
}

/**
 * Resultado de migración
 */
export interface MigrationResult {
  success: boolean;
  migratedConfig?: UnifiedTemplateConfig;
  info: MigrationInfo;
  
  errors?: Array<{
    property: string;
    error: string;
    suggestion?: string;
  }>;
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default UnifiedTemplateConfig;

export type {
  FixedDimensions,
  BackgroundConfig,
  GlobalStyleConfig,
  PageTemplate,
  ComponentTemplate,
  UnifiedTemplateConfig,
  UnifiedRenderContext,
  UnifiedRenderOptions,
  UnifiedRenderResult,
  TemplateValidationResult,
  ValidationConfig,
  MigrationInfo,
  MigrationResult
};