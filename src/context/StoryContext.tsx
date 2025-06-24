import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { promptService } from '../services/promptService';

interface CoverInfo {
  status: 'idle' | 'generating' | 'ready' | 'error';
  url?: string;
  variants?: Record<string, string>;
  variantStatus?: Record<string, 'idle' | 'generating' | 'ready' | 'error'>;
  error?: string;
}

interface StoryContextType {
  covers: Record<string, CoverInfo>;
  isLoadingExistingCovers: boolean;
  generateCover: (storyId: string, title: string, opts?: { style?: string; palette?: string; refIds?: string[] }) => Promise<string | undefined>;
  generateCoverVariants: (storyId: string, imageUrl: string) => Promise<void>;
  loadExistingCovers: (storyId: string) => Promise<void>;
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
  const [isLoadingExistingCovers, setIsLoadingExistingCovers] = useState<boolean>(false);

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

      // Add cache busting to cover URL
      const coverUrlWithTimestamp = data.coverUrl ? `${data.coverUrl}?t=${Date.now()}` : data.coverUrl;
      setCovers(prev => ({ ...prev, [storyId]: { status: 'ready', url: coverUrlWithTimestamp, variants: {} } }));
      return coverUrlWithTimestamp as string;
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

      // Initialize all variant statuses as generating
      const initialVariantStatus: Record<string, 'generating'> = {};
      STYLE_MAP.forEach(style => {
        if (prompts[style.type]) {
          initialVariantStatus[style.key] = 'generating';
        }
      });

      setCovers(prev => ({
        ...prev,
        [storyId]: { 
          ...(prev[storyId] || { status: 'ready', url: imageUrl }), 
          variantStatus: { ...(prev[storyId]?.variantStatus || {}), ...initialVariantStatus }
        }
      }));

      const variants: Record<string, string> = {};

      await Promise.all(
        STYLE_MAP.map(async (style) => {
          const prompt = prompts[style.type];
          if (!prompt) return;
          
          try {
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cover-variant`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ imageUrl, promptType: style.type, storyId, styleKey: style.key })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'failed');
            const url = data.coverUrl || data.url;
            
            if (url) {
              // Add cache busting to variant URL
              const urlWithTimestamp = `${url}?t=${Date.now()}`;
              variants[style.key] = urlWithTimestamp;
              // Update individual variant status to ready AND url immediately for progressive preview
              setCovers(prev => ({
                ...prev,
                [storyId]: {
                  ...prev[storyId],
                  variants: { ...prev[storyId]?.variants, [style.key]: urlWithTimestamp },
                  variantStatus: {
                    ...prev[storyId]?.variantStatus,
                    [style.key]: 'ready'
                  }
                }
              }));
            }
          } catch (err) {
            console.error('Error generating cover variant', err);
            // Update individual variant status to error
            setCovers(prev => ({
              ...prev,
              [storyId]: {
                ...prev[storyId],
                variantStatus: {
                  ...prev[storyId]?.variantStatus,
                  [style.key]: 'error'
                }
              }
            }));
          }
        })
      );

      // Update variants after all are processed
      setCovers(prev => ({
        ...prev,
        [storyId]: { 
          ...(prev[storyId] || { status: 'ready', url: imageUrl }), 
          variants: { ...(prev[storyId]?.variants || {}), ...variants }
        }
      }));
    } catch (err) {
      console.error('Error generating cover variants', err);
    }
  };

  const loadExistingCovers = async (storyId: string) => {
    // Prevent race conditions - only allow one load at a time
    if (isLoadingExistingCovers) {
      console.log('[StoryContext] Already loading covers, skipping duplicate request');
      return;
    }

    setIsLoadingExistingCovers(true);
    
    try {
      console.log('[StoryContext] Loading existing covers for story:', storyId);
      
      // Load base cover from story_pages where page_number = 0
      const { data: coverPage, error: coverError } = await supabase
        .from('story_pages')
        .select('image_url')
        .eq('story_id', storyId)
        .eq('page_number', 0)
        .maybeSingle();

      // Improved error handling - only propagate critical errors
      if (coverError && coverError.code !== 'PGRST116') { // PGRST116 = No rows found (OK)
        throw new Error(`Error loading covers: ${coverError.message}`);
      }

      const baseUrl = coverPage?.image_url;
      if (!baseUrl) {
        console.log('[StoryContext] No base cover found for story:', storyId);
        return;
      }

      // Optimized storage query - single request for all cover files
      const { data: allCoverFiles, error: storageError } = await supabase.storage
        .from('storage')
        .list('covers', { 
          search: `${storyId}_` // Lista todos los archivos del story
        });

      if (storageError) {
        console.error('[StoryContext] Error listing cover variants:', storageError);
        // Continue with base cover only if storage fails
      }

      // Process variants from single storage query
      const variants: Record<string, string> = {};
      const variantStatus: Record<string, 'ready' | 'idle'> = {};
      const timestamp = Date.now(); // Cache busting timestamp

      STYLE_MAP.forEach((style) => {
        // Check if file exists in the retrieved list
        const fileName = `${storyId}_${style.key}.png`;
        const fileExists = allCoverFiles?.some(file => file.name === fileName);
        
        if (fileExists) {
          const variantPath = `covers/${fileName}`;
          const { data: { publicUrl } } = supabase.storage
            .from('storage')
            .getPublicUrl(variantPath);
          
          // Cache busting for storage URLs
          variants[style.key] = `${publicUrl}?t=${timestamp}`;
          variantStatus[style.key] = 'ready';
          console.log('[StoryContext] Found variant:', style.key, variants[style.key]);
        } else {
          variantStatus[style.key] = 'idle';
        }
      });

      // Update covers state with loaded data
      setCovers(prev => ({
        ...prev,
        [storyId]: {
          status: 'ready',
          url: baseUrl,
          variants,
          variantStatus
        }
      }));

      console.log('[StoryContext] Loaded existing covers:', {
        storyId,
        baseUrl,
        variants: Object.keys(variants),
        variantStatus
      });

    } catch (err) {
      console.error('[StoryContext] Error loading existing covers:', err);
      // Set error state for the story
      setCovers(prev => ({
        ...prev,
        [storyId]: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error loading covers'
        }
      }));
    } finally {
      setIsLoadingExistingCovers(false);
    }
  };

  return (
    <StoryContext.Provider value={{ covers, isLoadingExistingCovers, generateCover, generateCoverVariants, loadExistingCovers }}>
      {children}
    </StoryContext.Provider>
  );
};
