// ============================================================================
// SERVICIO UNIFICADO DE TEMPLATES
// ============================================================================

/**
 * Servicio centralizado para gestión de templates unificados
 * Proporciona interfaz consistente para Admin, Wizard, PDF y Visualizador
 */

import { supabase } from '../lib/supabase';
import { 
  UnifiedTemplateConfig, 
  UnifiedRenderOptions,
  UnifiedRenderResult,
  TemplateValidationResult,
  MigrationResult
} from '../types/unifiedTemplate';
import { StoryStyleConfig } from '../types/styleConfig';
import { migrateToUnified, validateUnifiedTemplate } from '../utils/templateMigration';

// ============================================================================
// INTERFACES DEL SERVICIO
// ============================================================================

export interface TemplateStorageFormat {
  id: string;
  name: string;
  category: string;
  is_premium: boolean;
  config_data: UnifiedTemplateConfig | StoryStyleConfig;
  custom_images?: {
    cover_url?: string;
    page_url?: string;
    dedicatoria_url?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  category: string;
  isPremium: boolean;
  previewUrl?: string;
  description?: string;
  isActive?: boolean;
}

export interface TemplateServiceOptions {
  enableCache?: boolean;
  autoMigrate?: boolean;
  validateOnLoad?: boolean;
  strictValidation?: boolean;
}

// ============================================================================
// CLASE PRINCIPAL DEL SERVICIO
// ============================================================================

class UnifiedTemplateService {
  private cache = new Map<string, UnifiedTemplateConfig>();
  private options: Required<TemplateServiceOptions>;
  
  constructor(options: TemplateServiceOptions = {}) {
    this.options = {
      enableCache: true,
      autoMigrate: true,
      validateOnLoad: true,
      strictValidation: false,
      ...options
    };
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - OBTENER TEMPLATES
  // ========================================================================
  
  /**
   * Obtiene un template por ID con migración automática si es necesario
   */
  async getTemplate(templateId: string): Promise<UnifiedTemplateConfig> {
    // Verificar cache primero
    if (this.options.enableCache && this.cache.has(templateId)) {
      return this.cache.get(templateId)!;
    }
    
    try {
      // Obtener de base de datos
      const { data, error } = await supabase
        .from('story_style_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error) throw error;
      
      const template = await this.processRawTemplate(data);
      
      // Guardar en cache
      if (this.options.enableCache) {
        this.cache.set(templateId, template);
      }
      
      return template;
      
    } catch (error) {
      throw new Error(`Error obteniendo template ${templateId}: ${error}`);
    }
  }
  
  /**
   * Obtiene el template activo del sistema
   */
  async getActiveTemplate(): Promise<UnifiedTemplateConfig> {
    try {
      const { data, error } = await supabase
        .from('story_style_templates')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        // Fallback al template por defecto si no hay activo
        return this.getDefaultTemplate();
      }
      
      return this.processRawTemplate(data);
      
    } catch (error) {
      throw new Error(`Error obteniendo template activo: ${error}`);
    }
  }
  
  /**
   * Lista todos los templates disponibles
   */
  async listTemplates(filters?: {
    category?: string;
    isPremium?: boolean;
    limit?: number;
  }): Promise<TemplateListItem[]> {
    try {
      let query = supabase.from('story_style_templates').select(`
        id, name, category, is_premium, created_at, updated_at,
        config_data
      `);
      
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.isPremium !== undefined) {
        query = query.eq('is_premium', filters.isPremium);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(template => ({
        id: template.id,
        name: template.name,
        category: template.category,
        isPremium: template.is_premium,
        description: template.config_data?.description,
        previewUrl: this.generatePreviewUrl(template.id)
      }));
      
    } catch (error) {
      throw new Error(`Error listando templates: ${error}`);
    }
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - GESTIÓN DE TEMPLATES
  // ========================================================================
  
  /**
   * Guarda o actualiza un template
   */
  async saveTemplate(
    template: UnifiedTemplateConfig,
    metadata?: {
      category?: string;
      isPremium?: boolean;
      customImages?: any;
    }
  ): Promise<string> {
    try {
      // Validar template antes de guardar
      if (this.options.validateOnLoad) {
        const validation = validateUnifiedTemplate(template);
        if (!validation.isValid && this.options.strictValidation) {
          throw new Error(`Template inválido: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }
      
      const templateData: Partial<TemplateStorageFormat> = {
        id: template.id,
        name: template.name,
        category: metadata?.category || 'custom',
        is_premium: metadata?.isPremium || false,
        config_data: template,
        custom_images: metadata?.customImages,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('story_style_templates')
        .upsert(templateData)
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Actualizar cache
      if (this.options.enableCache) {
        this.cache.set(template.id, template);
      }
      
      return data.id;
      
    } catch (error) {
      throw new Error(`Error guardando template: ${error}`);
    }
  }
  
  /**
   * Elimina un template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('story_style_templates')
        .delete()
        .eq('id', templateId);
      
      if (error) throw error;
      
      // Limpiar cache
      this.cache.delete(templateId);
      
    } catch (error) {
      throw new Error(`Error eliminando template: ${error}`);
    }
  }
  
  /**
   * Establece un template como activo
   */
  async setActiveTemplate(templateId: string): Promise<void> {
    try {
      // Desactivar template actual
      await supabase
        .from('story_style_templates')
        .update({ is_active: false })
        .neq('id', templateId);
      
      // Activar nuevo template
      const { error } = await supabase
        .from('story_style_templates')
        .update({ is_active: true })
        .eq('id', templateId);
      
      if (error) throw error;
      
    } catch (error) {
      throw new Error(`Error estableciendo template activo: ${error}`);
    }
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - MIGRACIÓN Y VALIDACIÓN
  // ========================================================================
  
  /**
   * Migra un template legacy a formato unificado
   */
  async migrateTemplate(
    legacyConfig: StoryStyleConfig,
    saveAfterMigration: boolean = false
  ): Promise<MigrationResult> {
    try {
      const migrationResult = migrateToUnified(legacyConfig, {
        validateResult: this.options.validateOnLoad,
        strictMode: this.options.strictValidation
      });
      
      if (migrationResult.success && saveAfterMigration && migrationResult.migratedConfig) {
        await this.saveTemplate(migrationResult.migratedConfig, {
          category: 'migrated',
          isPremium: false
        });
      }
      
      return migrationResult;
      
    } catch (error) {
      return {
        success: false,
        info: {
          fromVersion: '1.0',
          toVersion: '2.0',
          changes: [],
          warnings: [`Error en migración: ${error}`],
          dataLoss: true
        }
      };
    }
  }
  
  /**
   * Valida un template unificado
   */
  validateTemplate(template: UnifiedTemplateConfig): TemplateValidationResult {
    return validateUnifiedTemplate(template, {
      strictMode: this.options.strictValidation,
      enablePerformanceChecks: true,
      enableAccessibilityChecks: true,
      enableDesignChecks: true,
      limits: {
        maxComponents: 20,
        maxImageSize: 5000,
        maxFontSize: 120,
        minFontSize: 8
      }
    });
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - UTILIDADES
  // ========================================================================
  
  /**
   * Limpia la cache de templates
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Obtiene estadísticas de la cache
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
  
  /**
   * Genera una URL de preview para un template
   */
  generatePreviewUrl(templateId: string): string {
    return `/api/template-preview/${templateId}`;
  }
  
  // ========================================================================
  // MÉTODOS PRIVADOS
  // ========================================================================
  
  /**
   * Procesa un template raw de la base de datos
   */
  private async processRawTemplate(rawTemplate: TemplateStorageFormat): Promise<UnifiedTemplateConfig> {
    let template: UnifiedTemplateConfig;
    
    // Verificar si necesita migración
    if (this.isLegacyTemplate(rawTemplate.config_data)) {
      if (!this.options.autoMigrate) {
        throw new Error(`Template ${rawTemplate.id} requiere migración pero autoMigrate está deshabilitado`);
      }
      
      const migrationResult = migrateToUnified(rawTemplate.config_data as StoryStyleConfig);
      if (!migrationResult.success || !migrationResult.migratedConfig) {
        throw new Error(`Error migrando template ${rawTemplate.id}: ${migrationResult.info.warnings.join(', ')}`);
      }
      
      template = migrationResult.migratedConfig;
      
      // Guardar template migrado
      await this.saveTemplate(template, {
        category: rawTemplate.category,
        isPremium: rawTemplate.is_premium,
        customImages: rawTemplate.custom_images
      });
      
    } else {
      template = rawTemplate.config_data as UnifiedTemplateConfig;
    }
    
    // Validar si está habilitado
    if (this.options.validateOnLoad) {
      const validation = this.validateTemplate(template);
      if (!validation.isValid && this.options.strictValidation) {
        throw new Error(`Template ${template.id} falló validación: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }
    
    return template;
  }
  
  /**
   * Verifica si un template es legacy
   */
  private isLegacyTemplate(config: any): boolean {
    return !('pages' in config && 'dimensions' in config && 'globalStyles' in config);
  }
  
  /**
   * Obtiene el template por defecto del sistema
   */
  private async getDefaultTemplate(): Promise<UnifiedTemplateConfig> {
    // Template por defecto hardcodeado para casos de emergencia
    const defaultTemplate: UnifiedTemplateConfig = {
      id: 'default-template',
      name: 'Template Por Defecto',
      description: 'Template por defecto del sistema',
      version: '2.0.0',
      
      dimensions: {
        width: 1536,
        height: 1024,
        aspectRatio: 3/2
      },
      
      globalStyles: {
        fontLoading: {
          googleFonts: ['Indie Flower'],
          fallbackFonts: ['Arial', 'sans-serif']
        },
        colorScheme: {
          primary: '#ffffff',
          secondary: '#333333',
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
        cover: {
          id: 'cover-page',
          name: 'Portada',
          type: 'cover',
          background: { type: 'color', value: '#87CEEB' },
          components: []
        },
        content: {
          id: 'content-page',
          name: 'Contenido',
          type: 'content',
          background: { type: 'color', value: '#F5F5DC' },
          components: []
        }
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
    
    return defaultTemplate;
  }
}

// ============================================================================
// INSTANCIA SINGLETON DEL SERVICIO
// ============================================================================

export const unifiedTemplateService = new UnifiedTemplateService({
  enableCache: true,
  autoMigrate: true,
  validateOnLoad: true,
  strictValidation: false
});

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default UnifiedTemplateService;

export type {
  TemplateStorageFormat,
  TemplateListItem,
  TemplateServiceOptions
};