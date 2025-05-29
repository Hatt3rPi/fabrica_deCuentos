import { supabase } from '../lib/supabase';
import { CharacterThumbnail } from '../types/character';

export const characterService = {
  async upsertThumbnail(thumbnail: CharacterThumbnail): Promise<void> {
    const { error } = await supabase
      .from('character_thumbnails')
      .upsert(thumbnail, { onConflict: 'character_id,style_type' });
    if (error) throw error;
  },
};
