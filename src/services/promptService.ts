import { supabase } from '../lib/supabase';

export interface Prompt {
  id: string;
  type: string;
  content: string;
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

  async upsertPrompt(type: string, content: string): Promise<Prompt> {
    const { data, error } = await supabase
      .from('prompts')
      .upsert({ type, content }, { onConflict: 'type' })
      .select('*')
      .single();
    if (error) throw error;
    return data as Prompt;
  },

  async revertPrompt(id: string, version: number): Promise<void> {
    await supabase.rpc('revert_prompt_version', { p_id: id, p_version: version });
  }
};
