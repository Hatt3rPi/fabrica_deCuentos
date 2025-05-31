import { supabase } from '../lib/supabase';
import { CharacterThumbnail } from '../types/character';

export const characterService = {
  async upsertThumbnail(thumbnail: CharacterThumbnail): Promise<void> {
    try {
      // Primero verificamos si ya existe una miniatura para este personaje y estilo
      const { data: existing } = await supabase
        .from('character_thumbnails')
        .select('id')
        .eq('character_id', thumbnail.character_id)
        .eq('style_type', thumbnail.style_type)
        .single();

      if (existing) {
        // Actualizar miniatura existente
        const { error } = await supabase
          .from('character_thumbnails')
          .update(thumbnail)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insertar nueva miniatura
        const { error } = await supabase
          .from('character_thumbnails')
          .insert(thumbnail);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error en upsertThumbnail:', error);
      throw error;
    }
  },

  async getThumbnailsByCharacter(characterId: string): Promise<CharacterThumbnail[]> {
    const { data, error } = await supabase
      .from('character_thumbnails')
      .select('*')
      .eq('character_id', characterId);
    if (error) throw error;
    return (data as CharacterThumbnail[]) || [];
  },
};
