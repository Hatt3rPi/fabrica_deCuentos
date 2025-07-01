import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface PurchaseStatus {
  isPurchased: boolean;
  pdfUrl?: string;
  orderId?: string;
  purchasedAt?: string;
  isLoading: boolean;
}

export const useStoryPurchaseStatus = (storyId: string) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<PurchaseStatus>({
    isPurchased: false,
    isLoading: true
  });

  useEffect(() => {
    if (!user || !storyId) {
      setStatus({ isPurchased: false, isLoading: false });
      return;
    }

    const checkPurchaseStatus = async () => {
      try {
        // Consultar si existe una orden pagada que contenga esta historia
        const { data: orderData, error } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            orders!inner (
              id,
              status,
              paid_at,
              user_id
            )
          `)
          .eq('story_id', storyId)
          .eq('orders.user_id', user.id)
          .eq('orders.status', 'paid')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error verificando estado de compra:', error);
          setStatus({ isPurchased: false, isLoading: false });
          return;
        }

        if (orderData) {
          // Si encontramos una orden pagada, verificar si existe PDF
          const { data: storyData } = await supabase
            .from('stories')
            .select('pdf_url')
            .eq('id', storyId)
            .eq('user_id', user.id)
            .single();

          setStatus({
            isPurchased: true,
            pdfUrl: storyData?.pdf_url,
            orderId: orderData.order_id,
            purchasedAt: orderData.orders.paid_at,
            isLoading: false
          });
        } else {
          setStatus({ isPurchased: false, isLoading: false });
        }
      } catch (err) {
        console.error('Error en checkPurchaseStatus:', err);
        setStatus({ isPurchased: false, isLoading: false });
      }
    };

    checkPurchaseStatus();

    // Suscribirse a cambios en las órdenes del usuario
    const ordersSubscription = supabase
      .channel(`user_orders_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.status === 'paid') {
            checkPurchaseStatus();
          }
        }
      )
      .subscribe();

    // Suscribirse a cambios en la historia (para detectar cuando se genera el PDF)
    const storySubscription = supabase
      .channel(`story_${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${storyId}`
        },
        (payload) => {
          if (payload.new.pdf_url && status.isPurchased) {
            setStatus(prev => ({
              ...prev,
              pdfUrl: payload.new.pdf_url
            }));
          }
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      storySubscription.unsubscribe();
    };
  }, [user, storyId, status.isPurchased]);

  return status;
};