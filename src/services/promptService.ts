import { supabase } from '../lib/supabase';

export interface Prompt {
  id: string;
  type: string;
  content: string;
  endpoint?: string | null;
  model?: string | null;
  version: number;
  updated_at: string;
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
    if (types.length === 0) return {};
    const { data, error } = await supabase
      .from('prompts')
      .select('type, content')
      .in('type', types);
    if (error) throw error;
    const map: Record<string, string> = {};
    for (const row of data as { type: string; content: string }[]) {
      map[row.type] = row.content;
    }
    return map;
  },

  async upsertPrompt(
    type: string,
    content: string,
    endpoint: string,
    model: string
  ): Promise<Prompt> {
    const { data, error } = await supabase
      .from('prompts')
      .upsert({ type, content, endpoint, model }, { onConflict: 'type' })
      .select('*')
      .single();
    if (error) throw error;
    return data as Prompt;
  },

  async revertPrompt(id: string, version: number): Promise<void> {
    await supabase.rpc('revert_prompt_version', { p_id: id, p_version: version });
  }
};
