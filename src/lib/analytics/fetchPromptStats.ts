import { supabase } from '../supabase';

export async function fetchPromptStats(promptType: string) {
  const { data: prompt } = await supabase
    .from('prompts')
    .select('id')
    .eq('type', promptType)
    .single();
  if (!prompt) return { total: 0, success: 0, error: 0 };
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('prompt_metrics')
    .select('estado')
    .eq('prompt_id', prompt.id)
    .gte('timestamp', since);
  const total = data ? data.length : 0;
  const success = data?.filter((d) => d.estado === 'success').length || 0;
  const error = data?.filter((d) => d.estado === 'error').length || 0;
  return { total, success, error };
}
