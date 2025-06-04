import { useAuth } from '../context/AuthContext';
import { Character, ThumbnailStyle } from '../types/character';
import { promptService } from '../services/promptService';
import { characterService } from '../services/characterService';


const STYLE_MAP: Array<{ key: ThumbnailStyle; type: string }> = [

  { key: 'kawaii', type: 'PROMPT_ESTILO_KAWAII' },
  { key: 'acuarela', type: 'PROMPT_ESTILO_ACUARELADIGITAL' },
  { key: 'bordado', type: 'PROMPT_ESTILO_BORDADO' },
  { key: 'mano', type: 'PROMPT_ESTILO_MANO' },
  { key: 'recortes', type: 'PROMPT_ESTILO_RECORTES' },

  { key: 'trasera', type: 'PROMPT_VARIANTE_TRASERA' },
  { key: 'lateral', type: 'PROMPT_VARIANTE_LATERAL' },

];

export const useCharacter = () => {
  const { supabase, user } = useAuth();

  const generateAdditionalThumbnails = async (character: Character) => {
    if (!user || !character.thumbnailUrl) return;
    // Skip thumbnail variants for the Cypress test user to save tokens
    if (user.email === 'tester@lacuenteria.cl') return;
    try {
      const types = STYLE_MAP.map((s) => s.type);
      const prompts = await promptService.getPromptsByTypes(types);

      const tasks = STYLE_MAP.map(async (style) => {

        const promptType = style.type;
        const prompt = prompts[promptType];

        if (!prompt) return;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;


          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-thumbnail-variant`, {

            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({

              imageUrl: character.thumbnailUrl,
              promptType

            })
          });

          if (!response.ok) throw new Error('Failed to generate');
          const data = await response.json();
          const url = data.url || data.thumbnailUrl;
          if (!url) throw new Error('No URL returned');

          const res = await fetch(url);
          const blob = await res.blob();
          const path = `thumbnails/${user.id}/${character.id}_${style.key}.png`;
          const { error: uploadError } = await supabase.storage
            .from('storage')
            .upload(path, blob, { contentType: 'image/png', upsert: true });
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage
            .from('storage')
            .getPublicUrl(path);
          await characterService.upsertThumbnail({
            character_id: character.id,
            style_type: style.key,
            url: publicUrl,
          });
        } catch (err) {
          console.error(`Error generating ${style.key} thumbnail`, err);
        }
      });

      await Promise.allSettled(tasks);
    } catch (err) {
      console.error('Error generating additional thumbnails', err);
    }
  };

  return { generateAdditionalThumbnails };
};
