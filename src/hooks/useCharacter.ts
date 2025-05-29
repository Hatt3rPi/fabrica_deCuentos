import { useAuth } from '../context/AuthContext';
import { Character, ThumbnailStyle } from '../types/character';
import { promptService } from '../services/promptService';
import { characterService } from '../services/characterService';

const STYLE_MAP: Array<{ key: ThumbnailStyle; type: string; side?: string }> = [
  { key: 'kawaii', type: 'PROMPT_ESTILO_KAWAII' },
  { key: 'acuarela', type: 'PROMPT_ESTILO_ACUARELADIGITAL' },
  { key: 'bordado', type: 'PROMPT_ESTILO_BORDADO' },
  { key: 'mano', type: 'PROMPT_ESTILO_MANO' },
  { key: 'recortes', type: 'PROMPT_ESTILO_RECORTES' },
  { key: 'trasera', type: 'PROMPT_VARIANTE_TRASERA', side: 'back' },
  { key: 'lateral', type: 'PROMPT_VARIANTE_LATERAL', side: 'left' },
];

export const useCharacter = () => {
  const { supabase, user } = useAuth();

  const generateAdditionalThumbnails = async (character: Character) => {
    if (!user || !character.thumbnailUrl) return;
    try {
      const types = STYLE_MAP.map((s) => s.type);
      const prompts = await promptService.getPromptsByTypes(types);

      const tasks = STYLE_MAP.map(async (style) => {
        const prompt = prompts[style.type];
        if (!prompt) return;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-illustration`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              identity: {
                name: character.name,
                age: character.age,
                description: typeof character.description === 'object' ? character.description.es : character.description
              },
              scene: {
                background: '',
                pose: '',
                style: prompt,
                palette: ''
              },
              side: style.side || 'central',
              size: '1024x1024',
              quality: 'low',
              output: 'png',
              referencedImageIds: [character.thumbnailUrl]
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
