import { supabase } from '../supabase';

export function subscribeToInflight(callback: () => void) {
  const channel = supabase
    .channel('inflight')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inflight_calls' },
      () => callback()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
