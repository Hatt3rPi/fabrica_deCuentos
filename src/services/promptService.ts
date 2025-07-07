import { supabase } from '../lib/supabase';

export interface Prompt {
  id: string;
  type: string;
  content: string;
  endpoint?: string | null;
  model?: string | null;
  version: number;
  updated_at: string;
  updated_by?: string | null;
  // Image generation preferences
  size?: string | null;
  quality?: string | null;
  width?: number | null;
  height?: number | null;
}

export const promptService = {
  async fetchPrompts(): Promise<Prompt[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('type');
    if (error) throw error;
    return data as Prompt[];
  },

  async getPrompt(type: string): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('type', type)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Prompt | null;
  },

  async getPromptsByTypes(types: string[]): Promise<Record<string, string>> {
    console.log('[DEBUG promptService] getPromptsByTypes called with:', types);
    if (types.length === 0) return {};
    const { data, error } = await supabase
      .from('prompts')
      .select('type, content')
      .in('type', types);
    console.log('[DEBUG promptService] Supabase query result:', { data, error });
    if (error) throw error;
    const map: Record<string, string> = {};
    for (const row of data as { type: string; content: string }[]) {
      console.log('[DEBUG promptService] Processing row:', row);
      map[row.type] = row.content;
    }
    console.log('[DEBUG promptService] Final map:', map);
    return map;
  },

  async upsertPrompt(
    type: string,
    content: string,
    endpoint: string,
    model: string,
    size?: string | null,
    quality?: string | null,
    width?: number | null,
    height?: number | null
  ): Promise<Prompt> {
    const promptData: Record<string, any> = { type, content, endpoint, model };
    
    // Only include image preferences if they are provided
    if (size !== undefined) promptData.size = size;
    if (quality !== undefined) promptData.quality = quality;
    if (width !== undefined) promptData.width = width;
    if (height !== undefined) promptData.height = height;
    
    const { data, error } = await supabase
      .from('prompts')
      .upsert(promptData, { onConflict: 'type' })
      .select('*')
      .single();
    if (error) throw error;
    return data as Prompt;
  },

  async revertPrompt(id: string, version: number): Promise<void> {
    await supabase.rpc('revert_prompt_version', { p_id: id, p_version: version });
  }
};
