import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { promptService } from '../services/promptService';

interface CoverInfo {
  status: 'idle' | 'generating' | 'ready' | 'error';
  url?: string;
  variants?: Record<string, string>;
  error?: string;
}

interface StoryContextType {
  covers: Record<string, CoverInfo>;
  generateCover: (storyId: string, title: string, opts?: { style?: string; palette?: string; refIds?: string[] }) => Promise<string | undefined>;
  generateCoverVariants: (storyId: string, imageUrl: string) => Promise<void>;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const useStory = () => {
  const ctx = useContext(StoryContext);
  if (!ctx) throw new Error('useStory must be used within StoryProvider');
  return ctx;
};

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase } = useAuth();
  const [covers, setCovers] = useState<Record<string, CoverInfo>>({});

  const STYLE_MAP: Array<{ key: string; type: string }> = [
    { key: 'kawaii', type: 'PROMPT_ESTILO_KAWAII' },
    { key: 'acuarela', type: 'PROMPT_ESTILO_ACUARELADIGITAL' },
    { key: 'bordado', type: 'PROMPT_ESTILO_BORDADO' },
    { key: 'dibujado', type: 'PROMPT_ESTILO_MANO' },
    { key: 'recortes', type: 'PROMPT_ESTILO_RECORTES' },
  ];

  const generateCover = async (
    storyId: string,
    title: string,
    opts?: { style?: string; palette?: string; refIds?: string[] }
  ): Promise<string | undefined> => {
    setCovers(prev => ({ ...prev, [storyId]: { status: 'generating' } }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cover`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          story_id: storyId,
          title,
          visual_style: opts?.style,
          color_palette: opts?.palette,
          reference_image_ids: opts?.refIds || []
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cover generation failed');

      setCovers(prev => ({ ...prev, [storyId]: { status: 'ready', url: data.coverUrl, variants: {} } }));
      return data.coverUrl as string;
    } catch (err) {
      console.error('Error generating cover:', err);
      setCovers(prev => ({ ...prev, [storyId]: { status: 'error', error: (err as Error).message } }));
      return undefined;
    }
  };

  const generateCoverVariants = async (storyId: string, imageUrl: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      const types = STYLE_MAP.map(s => s.type);
      const prompts = await promptService.getPromptsByTypes(types);

      const variants: Record<string, string> = {};

      for (const style of STYLE_MAP) {
        const prompt = prompts[style.type];
        if (!prompt) continue;
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cover-variant`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageUrl, promptType: style.type })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'failed');
          const url = data.coverUrl || data.url;
          if (!url) continue;
          const imgRes = await fetch(url);
          const blob = await imgRes.blob();
          const path = `covers/${storyId}_${style.key}.png`;
          await supabase.storage.from('storage').upload(path, blob, { contentType: 'image/png', upsert: true });
          const { data: { publicUrl } } = supabase.storage.from('storage').getPublicUrl(path);
          variants[style.key] = publicUrl;
        } catch (err) {
          console.error('Error generating cover variant', err);
        }
      }

      setCovers(prev => ({
        ...prev,
        [storyId]: { ...(prev[storyId] || { status: 'ready', url: imageUrl }), variants }
      }));
    } catch (err) {
      console.error('Error generating cover variants', err);
    }
  };

  return (
    <StoryContext.Provider value={{ covers, generateCover, generateCoverVariants }}>
      {children}
    </StoryContext.Provider>
  );
};
