import { useEffect } from 'react';
import { useCharacterStore, visualStyles, defaultPalette } from '../stores/characterStore';
import { Character } from '../types/character';
import { useAuth } from '../context/AuthContext';

export const useCharacterGeneration = (character: Character) => {
  const { supabase } = useAuth();
  const { setStylePreview, setCoverUrl } = useCharacterStore();

  const generateStylePreviews = async () => {
    if (!character.thumbnailUrl || !character.reference_urls?.length) return;

    const frontalViewUrl = character.reference_urls.find(url => url.includes('frontal'));
    if (!frontalViewUrl) return;

    for (const style of visualStyles) {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-illustration`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            identity: {
              name: character.name,
              age: character.age,
              description: typeof character.description === 'object' ? character.description.es : character.description
            },
            scene: {
              background: "fondo neutro para tarjeta",
              pose: "pose neutra (de cuerpo entero)",
              style,
              palette: defaultPalette
            },
            side: "central",
            size: "1024x1024",
            quality: "low",
            output: "webp",
            referencedImageIds: [character.thumbnailUrl, frontalViewUrl]
          })
        });

        if (!response.ok) throw new Error('Failed to generate style preview');
        
        const data = await response.json();
        setStylePreview(style, data.url);
      } catch (error) {
        console.error(`Error generating preview for style ${style}:`, error);
      }
    }
  };

  const generateCoverPreview = async (coverScene?: { background: string; pose: string }) => {
    if (!character.thumbnailUrl || !character.reference_urls?.length || !coverScene) return;

    const [frontalViewUrl, traseraViewUrl] = character.reference_urls;
    if (!frontalViewUrl || !traseraViewUrl) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-illustration`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identity: {
            name: character.name,
            age: character.age,
            description: typeof character.description === 'object' ? character.description.es : character.description
          },
          scene: {
            background: coverScene.background,
            pose: coverScene.pose,
            style: "Acuarela digital",
            palette: defaultPalette
          },
          side: "central",
          size: "auto",
          quality: "low",
          output: "webp",
          referencedImageIds: [character.thumbnailUrl, frontalViewUrl, traseraViewUrl]
        })
      });

      if (!response.ok) throw new Error('Failed to generate cover preview');
      
      const data = await response.json();
      setCoverUrl(data.url);
    } catch (error) {
      console.error('Error generating cover preview:', error);
    }
  };

  return {
    generateStylePreviews,
    generateCoverPreview
  };
};