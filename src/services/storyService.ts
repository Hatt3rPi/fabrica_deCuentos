import { supabase } from '../lib/supabase';
import { Character } from '../types';
import { useWizardFlowStore } from '../stores/wizardFlowStore';

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
    const { estado } = useWizardFlowStore.getState();
    return supabase
      .from('stories')
      .update({ ...fields, wizard_state: estado })
      .eq('id', id)
      .single();
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

  async generatePageImage(storyId: string, pageId: string, prompt: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image-pages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ story_id: storyId, page_id: pageId, prompt })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to regenerate page');
    return data.imageUrl as string;
  },

  async updateCoverImage(storyId: string, imageUrl: string): Promise<void> {
    const { error } = await supabase
      .from('story_pages')
      .update({ image_url: imageUrl })
      .eq('story_id', storyId)
      .eq('page_number', 0);
    if (error) throw error;
  }
};
