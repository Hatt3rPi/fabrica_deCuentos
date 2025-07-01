import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { priceService } from '../services/priceService';

interface OrderItem {
  story_id: string;
  story_title?: string;
}

interface OrderWithItems {
  id: string;
  status: string;
  user_id: string;
  items: OrderItem[];
}

export const useOrderFulfillment = (orderId: string | null) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Función para generar PDF de una historia
  const generateStoryPdf = async (storyId: string) => {
    try {
      console.log(`Generando PDF para historia ${storyId}...`);
      
      const { data, error } = await supabase.functions.invoke('story-export', {
        body: { 
          story_id: storyId,
          format: 'pdf',
          quality: 'high'
        }
      });

      if (error) throw error;
      
      if (data?.pdf_url) {
        console.log(`PDF generado exitosamente: ${data.pdf_url}`);
        return data.pdf_url;
      }
      
      throw new Error('No se recibió URL del PDF');
    } catch (err) {
      console.error(`Error generando PDF para historia ${storyId}:`, err);
      throw err;
    }
  };

  // Función para procesar fulfillment de una orden
  const processFulfillment = async (order: OrderWithItems) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const generatedPdfs: Record<string, string> = {};
      
      // Generar PDFs para cada historia en la orden
      for (const item of order.items) {
        try {
          const pdfUrl = await generateStoryPdf(item.story_id);
          generatedPdfs[item.story_id] = pdfUrl;
          
          // Actualizar la historia con la URL del PDF
          const { error: updateError } = await supabase
            .from('stories')
            .update({ 
              pdf_url: pdfUrl,
              pdf_generated_at: new Date().toISOString()
            })
            .eq('id', item.story_id)
            .eq('user_id', order.user_id); // Seguridad: solo actualizar historias del usuario
            
          if (updateError) {
            console.error(`Error actualizando historia ${item.story_id}:`, updateError);
          }
        } catch (err) {
          console.error(`Error procesando historia ${item.story_id}:`, err);
          // Continuar con las demás historias aunque una falle
        }
      }
      
      setPdfUrls(generatedPdfs);
      
      // Marcar la orden como fulfilled si se generaron todos los PDFs
      if (Object.keys(generatedPdfs).length === order.items.length) {
        const { error: fulfillError } = await supabase
          .from('orders')
          .update({ 
            fulfillment_status: 'completed',
            fulfilled_at: new Date().toISOString()
          })
          .eq('id', order.id);
          
        if (fulfillError) {
          console.error('Error actualizando estado de fulfillment:', fulfillError);
        }
      }
      
      return generatedPdfs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Escuchar cambios en la orden
  useEffect(() => {
    if (!orderId) return;

    // Verificar el estado inicial de la orden
    const checkOrderStatus = async () => {
      try {
        const order = await priceService.getOrder(orderId);
        if (!order) return;

        // Si la orden está pagada pero no fulfilled, procesar
        if (order.status === 'paid' && (!order.fulfillment_status || order.fulfillment_status === 'pending')) {
          // Obtener items de la orden
          const items = await priceService.getOrderItems(orderId);
          
          await processFulfillment({
            id: order.id,
            status: order.status,
            user_id: order.user_id,
            items: items.map(item => ({
              story_id: item.story_id,
              story_title: item.story_title
            }))
          });
        }
      } catch (err) {
        console.error('Error verificando estado de orden:', err);
      }
    };

    checkOrderStatus();

    // Suscribirse a cambios en la orden
    const subscription = supabase
      .channel(`order_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          if (payload.new.status === 'paid') {
            checkOrderStatus();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);

  return {
    isProcessing,
    pdfUrls,
    error,
    processFulfillment
  };
};