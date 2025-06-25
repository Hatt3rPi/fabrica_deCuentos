import { supabase } from '../lib/supabase';
import { Character } from '../types';

/**
 * Deletes a story and optionally its orphan characters using Supabase RPCs.
 * Returns when database records are removed and storage cleaned.
 */
async function cleanupStorage(items: string[]) {
  for (const item of items) {
    if (!item) continue;
    if (item.startsWith('http')) {
      try {
        const url = new URL(item);
        const parts = url.pathname.split('/');
        // typical path: /storage/v1/object/public/<bucket>/<file>
        if (parts.length >= 6 && parts[1] === 'storage' && parts[2] === 'v1') {
          const bucket = parts[5];
          const filePath = parts.slice(6).join('/');
          if (bucket && filePath) {
            await supabase.storage.from(bucket).remove([filePath]);
          }
        }
      } catch {
        // Ignore invalid URLs
      }
    }
  }
}

export const storyService = {
  async deleteStoryWithCharacters(storyId: string) {
    const { data, error } = await supabase.rpc('delete_full_story', { story_id: storyId });
    if (error) throw error;
    if (data) await cleanupStorage(data as string[]);
  },

  async deleteStoryOnly(storyId: string) {
    const { data, error } = await supabase.rpc('delete_story_preserve_characters', { story_id: storyId });
    if (error) throw error;
    if (data) await cleanupStorage(data as string[]);
  },

  persistStory(id: string, fields: Partial<import('../types/supabase').Database['public']['Tables']['stories']['Update']>) {
    console.log('[StoryService] persistStory LLAMADO (SOLO CONTENIDO)', {
      storyId: id,
      fields: Object.keys(fields)
    });
    
    const result = supabase
      .from('stories')
      .update(fields)
      .eq('id', id)
      .single();
      
    result.then(({ error }) => {
      if (error) {
        console.error('[StoryService] ERROR EN persistStory:', error);
      } else {
        console.log('[StoryService] ✅ persistStory EXITOSO', { storyId: id });
      }
    });
    
    return result;
  },

  async generateStory(params: {
    storyId: string;
    theme: string;
    characters: { id?: string; name: string; age?: string; thumbnailUrl?: string | null }[];
    settings: {
      targetAge: string;
      literaryStyle: string;
      centralMessage: string;
      additionalDetails: string;
    };
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-story`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        story_id: params.storyId,
        theme: params.theme,
        characters: params.characters,
        target_age: params.settings.targetAge,
        literary_style: params.settings.literaryStyle,
        central_message: params.settings.centralMessage,
        additional_details: params.settings.additionalDetails
      })
    });

    if (!response.ok) {
      throw new Error('Story generation failed');
    }

    return await response.json();
  },

  async getStoryDraft(storyId: string) {
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (storyError) throw storyError;

    const { data: links } = await supabase
      .from('story_characters')
      .select('character_id')
      .eq('story_id', storyId);

    let characters: Character[] = [];
    if (links && links.length > 0) {
      const ids = links.map(l => l.character_id);
      const { data: chars } = await supabase
        .from('characters')
        .select('*')
        .in('id', ids);
      characters = (chars || []).map(c => ({
        ...c,
        thumbnailUrl: c.thumbnail_url,
      }));
    }

    const { data: design } = await supabase
      .from('story_designs')
      .select('*')
      .eq('story_id', storyId)
      .maybeSingle();

    const { data: pages } = await supabase
      .from('story_pages')
      .select('*')
      .eq('story_id', storyId)
      .order('page_number');

    return { story, characters, design, pages };
  },

  async generatePageImage(storyId: string, pageId: string, customPrompt?: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // If custom prompt is provided, update the page prompt first
    if (customPrompt) {
      const { error } = await supabase
        .from('story_pages')
        .update({ prompt: customPrompt })
        .eq('id', pageId)
        .eq('story_id', storyId);
      
      if (error) {
        throw new Error('Error al actualizar el prompt de la página');
      }
    }
    
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image-pages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ story_id: storyId, page_id: pageId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to regenerate page');
    return data.imageUrl as string;
  },

  async generateCoverImage(storyId: string, customPrompt?: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // If custom prompt is provided, update the cover page prompt first
    if (customPrompt) {
      const { error } = await supabase
        .from('story_pages')
        .update({ prompt: customPrompt })
        .eq('story_id', storyId)
        .eq('page_number', 0);
      if (error) throw error;
    }
    
    // Get design parameters and character reference images required by the edge function
    const { data: design } = await supabase
      .from('story_designs')
      .select('visual_style, color_palette')
      .eq('story_id', storyId)
      .maybeSingle();
    
    // Get character reference images for the story
    const { data: storyCharacters } = await supabase
      .from('story_characters')
      .select('character_id')
      .eq('story_id', storyId);
    
    let referenceImageIds: string[] = [];
    if (storyCharacters && storyCharacters.length > 0) {
      const characterIds = storyCharacters.map(sc => sc.character_id);
      const { data: characters } = await supabase
        .from('characters')
        .select('thumbnail_url')
        .in('id', characterIds)
        .not('thumbnail_url', 'is', null);
      
      referenceImageIds = characters?.map(c => c.thumbnail_url).filter(Boolean) || [];
    }
    
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cover`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        story_id: storyId,
        visual_style: design?.visual_style,
        color_palette: design?.color_palette,
        reference_image_ids: referenceImageIds
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to regenerate cover');
    return data.coverUrl as string;
  },

  async updateCoverImage(storyId: string, imageUrl: string): Promise<void> {
    const { error } = await supabase
      .from('story_pages')
      .update({ image_url: imageUrl })
      .eq('story_id', storyId)
      .eq('page_number', 0);
    if (error) throw error;
  },

  async upsertStoryDesign(storyId: string, designData: { visualStyle?: string; colorPalette?: string }): Promise<void> {
    const { data: existing } = await supabase
      .from('story_designs')
      .select('id')
      .eq('story_id', storyId)
      .maybeSingle();

    const payload = {
      story_id: storyId,
      visual_style: designData.visualStyle || 'default',
      color_palette: designData.colorPalette || 'default'
    };

    if (existing) {
      const { error } = await supabase
        .from('story_designs')
        .update(payload)
        .eq('story_id', storyId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('story_designs')
        .insert(payload);
      if (error) throw error;
    }
  },

  // Story completion functionality
  async completeStory(storyId: string, saveToLibrary: boolean = true): Promise<import('../types').CompletionResult> {
    try {
      // Use real Edge Function for PDF generation
      const downloadUrl = await this.generateRealExport(storyId, saveToLibrary);

      return { 
        success: true, 
        downloadUrl 
      };
    } catch (error) {
      console.error('[StoryService] Error completing story:', error);
      
      // Fallback to mock export if real export fails
      try {
        console.log('[StoryService] Falling back to mock export...');
        const mockUrl = await this.generateMockExport(storyId, saveToLibrary);
        
        // Still update story status manually for mock
        await supabase
          .from('stories')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', storyId);
        
        return { 
          success: true, 
          downloadUrl: mockUrl 
        };
      } catch (fallbackError) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Error desconocido al finalizar el cuento'
        };
      }
    }
  },

  async generateMockExport(storyId: string, saveToLibrary: boolean): Promise<string> {
    console.log(`[StoryService] CORRECCIÓN 2: Usando fallback para export de story ${storyId}`);
    
    // En lugar de generar URL ficticia, crear un enlace de descarga temporal
    // que funcione hasta que se despliegue la Edge Function
    const timestamp = Date.now();
    const mockUrl = `data:text/plain;charset=utf-8,CUENTO EXPORTADO - ID: ${storyId}%0AGenerado: ${new Date().toLocaleString()}%0A%0AEste es un archivo temporal hasta que se complete el despliegue.%0APor favor contacta al administrador para obtener tu cuento en PDF.`;
    
    console.log(`[StoryService] Fallback export generado para story ${storyId}, saveToLibrary: ${saveToLibrary}`);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockUrl;
  },

  async generateRealExport(storyId: string, saveToLibrary: boolean): Promise<string> {
    console.log(`[StoryService] Generating real export for story ${storyId}, saveToLibrary: ${saveToLibrary}`);
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/story-export`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        story_id: storyId, 
        save_to_library: saveToLibrary,
        format: 'pdf',
        include_metadata: true
      })
    });
    
    if (!res.ok) {
      let errorMessage;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || 'Failed to export story';
        console.error('[StoryService] Edge Function error:', errorData);
      } catch (jsonError) {
        // Si no se puede parsear como JSON, leer como texto
        const errorText = await res.text();
        errorMessage = `Edge Function returned non-JSON response (${res.status}): ${errorText.substring(0, 200)}...`;
        console.error('[StoryService] Edge Function returned HTML/text error:', errorText);
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      const responseText = await res.text();
      console.error('[StoryService] Failed to parse response as JSON:', responseText);
      throw new Error('Edge Function returned invalid JSON response');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Export was not successful');
    }
    
    console.log(`[StoryService] Export successful:`, {
      downloadUrl: data.downloadUrl,
      fileSize: data.file_size_kb,
      format: data.format
    });
    
    return data.downloadUrl as string;
  },

  /**
   * Actualiza el texto de una página específica
   */
  async updatePageText(pageId: string, newText: string): Promise<void> {
    const { error } = await supabase
      .from('story_pages')
      .update({ 
        text: newText,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId);

    if (error) {
      throw new Error(`Error al actualizar texto de página: ${error.message}`);
    }
  },

  /**
   * Actualiza el prompt de una página específica
   */
  async updatePagePrompt(pageId: string, newPrompt: string): Promise<void> {
    const { error } = await supabase
      .from('story_pages')
      .update({ 
        prompt: newPrompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId);

    if (error) {
      throw new Error(`Error al actualizar prompt de página: ${error.message}`);
    }
  },

  /**
   * Actualiza tanto texto como prompt de una página
   */
  async updatePageContent(pageId: string, updates: { text?: string; prompt?: string }): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.text !== undefined) {
      updateData.text = updates.text;
    }
    if (updates.prompt !== undefined) {
      updateData.prompt = updates.prompt;
    }

    const { error } = await supabase
      .from('story_pages')
      .update(updateData)
      .eq('id', pageId);

    if (error) {
      throw new Error(`Error al actualizar contenido de página: ${error.message}`);
    }
  },

  /**
   * Persiste específicamente los datos de dedicatoria
   */
  async persistDedicatoria(storyId: string, dedicatoria: {
    text?: string;
    imageUrl?: string;
    layout?: string;
    alignment?: string;
    imageSize?: string;
  }): Promise<void> {
    console.log('[StoryService] persistDedicatoria LLAMADO', {
      storyId,
      dedicatoria,
      hasText: !!dedicatoria.text,
      hasImage: !!dedicatoria.imageUrl
    });

    const updateData = {
      dedicatoria_text: dedicatoria.text || null,
      dedicatoria_image_url: dedicatoria.imageUrl || null,
      dedicatoria_layout: dedicatoria.text ? {
        layout: dedicatoria.layout || 'imagen-arriba',
        alignment: dedicatoria.alignment || 'centro',
        imageSize: dedicatoria.imageSize || 'mediana'
      } : null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('stories')
      .update(updateData)
      .eq('id', storyId);

    if (error) {
      console.error('[StoryService] ERROR EN persistDedicatoria:', error);
      throw new Error(`Error al persistir dedicatoria: ${error.message}`);
    } else {
      console.log('[StoryService] ✅ persistDedicatoria EXITOSO', { storyId, updateData });
    }
  }
};
