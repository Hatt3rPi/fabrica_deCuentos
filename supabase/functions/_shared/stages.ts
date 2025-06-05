import { supabaseAdmin } from './metrics.ts';

export async function isActivityEnabled(stage: string, activity: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .select('value')
    .eq('key', 'stages_enabled')
    .single();
  if (error) {
    console.error('[stages] failed to load settings:', error.message);
    return true;
  }
  const val = (data?.value as any) ?? {};
  if (val[stage] && val[stage][activity] === false) {
    return false;
  }
  return true;
}
