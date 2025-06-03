import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

interface CoverInfo {
  status: 'idle' | 'generating' | 'ready' | 'error';
  url?: string;
  error?: string;
}

interface StoryContextType {
  covers: Record<string, CoverInfo>;
  generateCover: (storyId: string, title: string, opts?: { style?: string; palette?: string; refIds?: string[] }) => Promise<void>;
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

  const generateCover = async (
    storyId: string,
    title: string,
    opts?: { style?: string; palette?: string; refIds?: string[] }
  ) => {
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

      setCovers(prev => ({ ...prev, [storyId]: { status: 'ready', url: data.coverUrl } }));
    } catch (err) {
      console.error('Error generating cover:', err);
      setCovers(prev => ({ ...prev, [storyId]: { status: 'error', error: (err as Error).message } }));
    }
  };

  return (
    <StoryContext.Provider value={{ covers, generateCover }}>
      {children}
    </StoryContext.Provider>
  );
};
