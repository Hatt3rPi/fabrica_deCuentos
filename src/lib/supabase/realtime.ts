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

export function subscribeToOrders(callback: (payload: any) => void) {
  const channel = supabase
    .channel('orders')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'stories',
        filter: 'status=eq.completed'
      },
      (payload) => callback(payload)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToFulfillmentChanges(callback: (payload: any) => void) {
  const channel = supabase
    .channel('fulfillment')
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'fulfillment_history'
      },
      (payload) => callback(payload)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToShippingUpdates(callback: (payload: any) => void) {
  const channel = supabase
    .channel('shipping')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'shipping_info'
      },
      (payload) => callback(payload)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
