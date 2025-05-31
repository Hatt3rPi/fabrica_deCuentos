import { supabase } from '../lib/supabase';
import { CharacterThumbnail } from '../types/character';

export const characterService = {
  async upsertThumbnail(thumbnail: CharacterThumbnail): Promise<void> {
    try {
      // Verificar que los campos requeridos estén presentes
      if (!thumbnail.character_id || !thumbnail.style_type) {
        throw new Error('Missing required fields: character_id and style_type are required');
      }

      // Verificar si ya existe una miniatura para este personaje y estilo
      const { data: existing, error: fetchError } = await supabase
        .from('character_thumbnails')
        .select('id')
        .eq('character_id', thumbnail.character_id)
        .eq('style_type', thumbnail.style_type)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking for existing thumbnail:', fetchError);
        throw new Error('Failed to check for existing thumbnail');
      }

      if (existing) {
        // Actualizar miniatura existente
        const { error: updateError } = await supabase
          .from('character_thumbnails')
          .update(thumbnail)
          .eq('id', existing.id);
        
        if (updateError) {
          console.error('Error updating thumbnail:', updateError);
          throw new Error('Failed to update thumbnail');
        }
      } else {
        // Insertar nueva miniatura
        const { error: insertError } = await supabase
          .from('character_thumbnails')
          .insert(thumbnail);
        
        if (insertError) {
          console.error('Error inserting thumbnail:', insertError);
          throw new Error('Failed to insert thumbnail');
        }
      }
    } catch (error) {
      console.error('Error in upsertThumbnail:', error);
      throw error; // Relanzar el error para que el llamador pueda manejarlo
    }
  },

  async getThumbnailsByCharacter(characterId: string): Promise<CharacterThumbnail[]> {
    try {
      const { data, error } = await supabase
        .from('character_thumbnails')
        .select('*')
        .eq('character_id', characterId);
      
      if (error) {
        console.error('Error fetching thumbnails:', error);
        return [];
      }
      
      return (data as CharacterThumbnail[]) || [];
    } catch (error) {
      console.error('Unexpected error in getThumbnailsByCharacter:', error);
      return [];
    }
  },
};
