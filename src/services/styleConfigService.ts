import { createClient } from '@supabase/supabase-js';
import { StoryStyleConfig, StyleTemplate } from '../types/styleConfig';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

class StyleConfigService {
  /**
   * Obtener el template activo actual
   */
  async getActiveTemplate(): Promise<StyleTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('story_style_templates')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (data) {
        return {
          id: data.id,
          name: data.name,
          category: data.category,
          thumbnailUrl: data.thumbnail_url,
          configData: data.config_data,
          customImages: data.custom_images,
          customTexts: data.custom_texts,
          isPremium: data.is_premium,
          isActive: data.is_active,
          createdAt: data.created_at
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching active template:', error);
      return null;
    }
  }

  /**
   * Obtener el estilo activo actual (adaptado para templates)
   */
  async getActiveStyle(): Promise<StoryStyleConfig | null> {
    try {
      const template = await this.getActiveTemplate();
      
      if (template) {
        return {
          id: template.id,
          name: template.name,
          coverConfig: template.configData.cover_config,
          pageConfig: template.configData.page_config,
          // Las imágenes custom son solo para admin/styles, no para templates
          coverBackgroundUrl: undefined,
          pageBackgroundUrl: undefined,
          coverSampleText: undefined,
          pageSampleText: undefined
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching active style:', error);
      return null;
    }
  }

  /**
   * Obtener todos los estilos (solo para admins)
   */
  async getAllStyles(): Promise<StoryStyleConfig[]> {
    try {
      const { data, error } = await supabase
        .from('story_style_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(style => ({
        id: style.id,
        name: style.name,
        description: style.description,
        isActive: style.is_active,
        isDefault: style.is_default,
        coverConfig: style.cover_config,
        pageConfig: style.page_config,
        coverBackgroundUrl: style.cover_background_url,
        pageBackgroundUrl: style.page_background_url,
        coverSampleText: style.cover_sample_text,
        pageSampleText: style.page_sample_text,
        createdAt: style.created_at,
        updatedAt: style.updated_at,
        createdBy: style.created_by,
        version: style.version
      }));
    } catch (error) {
      console.error('Error fetching styles:', error);
      return [];
    }
  }

  /**
   * Crear un nuevo estilo
   */
  async createStyle(style: Omit<StoryStyleConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoryStyleConfig | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('story_style_configs')
        .insert({
          name: style.name,
          description: style.description,
          is_active: style.isActive || false,
          is_default: style.isDefault || false,
          cover_config: style.coverConfig,
          page_config: style.pageConfig,
          cover_background_url: style.coverBackgroundUrl,
          page_background_url: style.pageBackgroundUrl,
          cover_sample_text: style.coverSampleText,
          page_sample_text: style.pageSampleText,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        isActive: data.is_active,
        isDefault: data.is_default,
        coverConfig: data.cover_config,
        pageConfig: data.page_config,
        coverBackgroundUrl: data.cover_background_url,
        pageBackgroundUrl: data.page_background_url,
        coverSampleText: data.cover_sample_text,
        pageSampleText: data.page_sample_text,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        version: data.version
      };
    } catch (error) {
      console.error('Error creating style:', error);
      return null;
    }
  }

  /**
   * Actualizar un estilo existente
   */
  async updateStyle(id: string, updates: Partial<StoryStyleConfig>): Promise<StoryStyleConfig | null> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
      if (updates.coverConfig !== undefined) updateData.cover_config = updates.coverConfig;
      if (updates.pageConfig !== undefined) updateData.page_config = updates.pageConfig;
      if (updates.coverBackgroundUrl !== undefined) updateData.cover_background_url = updates.coverBackgroundUrl;
      if (updates.pageBackgroundUrl !== undefined) updateData.page_background_url = updates.pageBackgroundUrl;
      if (updates.coverSampleText !== undefined) updateData.cover_sample_text = updates.coverSampleText;
      if (updates.pageSampleText !== undefined) updateData.page_sample_text = updates.pageSampleText;

      console.log('updateStyle called with:', {
        id,
        updates,
        updateData,
        backgroundUrls: {
          cover: updates.coverBackgroundUrl,
          page: updates.pageBackgroundUrl
        }
      });

      const { data, error } = await supabase
        .from('story_style_configs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        isActive: data.is_active,
        isDefault: data.is_default,
        coverConfig: data.cover_config,
        pageConfig: data.page_config,
        coverBackgroundUrl: data.cover_background_url,
        pageBackgroundUrl: data.page_background_url,
        coverSampleText: data.cover_sample_text,
        pageSampleText: data.page_sample_text,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        version: data.version
      };
    } catch (error) {
      console.error('Error updating style:', error);
      return null;
    }
  }

  /**
   * Actualizar el template activo
   */
  async updateActiveTemplate(updates: Partial<StyleTemplate>): Promise<StyleTemplate | null> {
    try {
      const activeTemplate = await this.getActiveTemplate();
      
      if (!activeTemplate) {
        console.error('No active template found');
        return null;
      }

      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.configData !== undefined) updateData.config_data = updates.configData;
      if (updates.customImages !== undefined) updateData.custom_images = updates.customImages;
      if (updates.customTexts !== undefined) updateData.custom_texts = updates.customTexts;
      
      console.log('Updating active template with:', updateData);

      const { data, error } = await supabase
        .from('story_style_templates')
        .update(updateData)
        .eq('id', activeTemplate.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        category: data.category,
        thumbnailUrl: data.thumbnail_url,
        configData: data.config_data,
        customImages: data.custom_images,
        customTexts: data.custom_texts,
        isPremium: data.is_premium,
        isActive: data.is_active,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error updating active template:', error);
      return null;
    }
  }

  /**
   * Activar un template específico (desactiva todos los demás)
   */
  async activateTemplate(id: string): Promise<boolean> {
    try {
      console.log('Activating template with ID:', id);
      
      const { error } = await supabase.rpc('activate_template', {
        template_id: id
      });

      if (error) {
        console.error('Error activating template:', error);
        throw error;
      }

      console.log('Template activated successfully');
      return true;
    } catch (error) {
      console.error('Error in activateTemplate:', error);
      return false;
    }
  }

  /**
   * Activar un estilo específico (DEPRECATED - usar activateTemplate)
   */
  async activateStyle(id: string): Promise<boolean> {
    console.warn('activateStyle is deprecated, use activateTemplate instead');
    return this.activateTemplate(id);
  }

  /**
   * Crear un nuevo template
   */
  async createTemplate(templateData: {
    name: string;
    category: 'classic' | 'modern' | 'playful' | 'elegant';
    description?: string;
    configData: any;
  }): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error('Usuario no autenticado');
      }
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      // Los permisos se validan en RLS policies por email, no necesitamos validar aquí
      console.log('User authenticated:', user.email);
      
      const { data, error } = await supabase
        .from('story_style_templates')
        .insert({
          name: templateData.name,
          category: templateData.category,
          config_data: {
            cover_config: templateData.configData.coverConfig,
            page_config: templateData.configData.pageConfig
          },
          is_premium: false
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('Template created successfully:', data);
      return true;
    } catch (error) {
      console.error('Error creating template:', error);
      return false;
    }
  }

  /**
   * Obtener todos los templates
   */
  async getTemplates(): Promise<StyleTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('story_style_templates')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      return data.map(template => ({
        id: template.id,
        name: template.name,
        category: template.category,
        thumbnailUrl: template.thumbnail_url,
        configData: template.config_data,
        isPremium: template.is_premium,
        isActive: template.is_active,
        createdAt: template.created_at
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  /**
   * Crear estilo desde template
   */
  async createFromTemplate(templateId: string, name: string): Promise<StoryStyleConfig | null> {
    try {
      const { data: template, error: templateError } = await supabase
        .from('story_style_templates')
        .select('config_data')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      return this.createStyle({
        name,
        description: `Creado desde template`,
        coverConfig: template.config_data.cover_config,
        pageConfig: template.config_data.page_config,
        isActive: false,
        isDefault: false
      });
    } catch (error) {
      console.error('Error creating from template:', error);
      return null;
    }
  }

  /**
   * Eliminar un estilo (solo si no es default o active)
   */
  async deleteStyle(id: string): Promise<boolean> {
    try {
      // Verificar que no sea default o active
      const { data: style, error: checkError } = await supabase
        .from('story_style_configs')
        .select('is_active, is_default')
        .eq('id', id)
        .single();

      if (checkError) throw checkError;
      
      if (style.is_active || style.is_default) {
        console.error('Cannot delete active or default style');
        return false;
      }

      const { error } = await supabase
        .from('story_style_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting style:', error);
      return false;
    }
  }

  /**
   * Obtener una imagen de muestra aleatoria de los cuentos existentes (páginas interiores)
   */
  async getRandomSampleImage(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('story_pages')
        .select('image_url')
        .not('image_url', 'is', null)
        .neq('page_number', 0) // Excluir portadas
        .limit(20);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex].image_url;
      }

      // Imagen de fallback si no hay imágenes
      return 'http://127.0.0.1:54321/storage/v1/object/public/storage/style_design/pagina_interior.png';
    } catch (error) {
      console.error('Error fetching sample image:', error);
      return 'http://127.0.0.1:54321/storage/v1/object/public/storage/style_design/pagina_interior.png';
    }
  }

  /**
   * Obtener imagen específica para portada
   */
  async getCoverSampleImage(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('story_pages')
        .select('image_url')
        .not('image_url', 'is', null)
        .eq('page_number', 0) // Solo portadas
        .limit(10);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex].image_url;
      }

      // Imagen de fallback específica para portadas
      return 'http://127.0.0.1:54321/storage/v1/object/public/storage/style_design/portada.png';
    } catch (error) {
      console.error('Error fetching cover sample image:', error);
      return 'http://127.0.0.1:54321/storage/v1/object/public/storage/style_design/portada.png';
    }
  }

  /**
   * Obtener imagen específica para páginas interiores
   */
  async getPageSampleImage(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('story_pages')
        .select('image_url')
        .not('image_url', 'is', null)
        .gt('page_number', 0) // Solo páginas interiores
        .limit(20);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex].image_url;
      }

      // Imagen de fallback específica para páginas interiores
      return 'http://127.0.0.1:54321/storage/v1/object/public/storage/style_design/pagina_interior.png';
    } catch (error) {
      console.error('Error fetching page sample image:', error);
      return 'http://127.0.0.1:54321/storage/v1/object/public/storage/style_design/pagina_interior.png';
    }
  }

  /**
   * Obtener imagen específica para dedicatoria
   */
  async getDedicatoriaSampleImage(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('story_pages')
        .select('image_url')
        .not('image_url', 'is', null)
        .gt('page_number', 0) // Usar las mismas páginas interiores para dedicatorias
        .limit(10);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex].image_url;
      }

      // Imagen de fallback específica para dedicatoria
      return 'http://127.0.0.1:54321/storage/v1/object/public/storage/style_design/dedicatoria.png';
    } catch (error) {
      console.error('Error fetching dedicatoria sample image:', error);
      return 'http://127.0.0.1:54321/storage/v1/object/public/storage/style_design/dedicatoria.png';
    }
  }

  /**
   * Obtener todas las imágenes de muestra de una vez
   */
  async getAllSampleImages(): Promise<{
    cover: string;
    page: string;
    dedicatoria: string;
  }> {
    const [cover, page, dedicatoria] = await Promise.all([
      this.getCoverSampleImage(),
      this.getPageSampleImage(),
      this.getDedicatoriaSampleImage()
    ]);

    return { cover, page, dedicatoria };
  }
}

export const styleConfigService = new StyleConfigService();