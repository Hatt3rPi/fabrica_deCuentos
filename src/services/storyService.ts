import { supabase } from '../lib/supabase';

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
  }
};
