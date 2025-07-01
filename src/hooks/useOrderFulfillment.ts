import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { priceService } from '../services/priceService';
import { OrderForFulfillment, FulfillmentResult } from '../types';

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
  const processFulfillment = async (order: OrderForFulfillment) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const generatedPdfs: Record<string, string> = {};
      
      // Rate limiting: Procesar en lotes de máximo 3 PDFs simultáneamente
      const BATCH_SIZE = 3;
      const DELAY_BETWEEN_BATCHES = 2000; // 2 segundos entre lotes
      
      const batches = [];
      for (let i = 0; i < order.items.length; i += BATCH_SIZE) {
        batches.push(order.items.slice(i, i + BATCH_SIZE));
      }
      
      for (const [batchIndex, batch] of batches.entries()) {
        console.log(`Procesando lote ${batchIndex + 1}/${batches.length} con ${batch.length} historias...`);
        
        // Procesar lote en paralelo con Promise.allSettled para robustez
        const batchPromises = batch.map(async (item) => {
          try {
            const pdfUrl = await Promise.race([
              generateStoryPdf(item.story_id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout después de 30 segundos')), 30000)
              )
            ]) as string;
            
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
              throw updateError;
            }
            
            return { storyId: item.story_id, pdfUrl, success: true };
          } catch (err) {
            console.error(`Error procesando historia ${item.story_id}:`, err);
            return { storyId: item.story_id, error: err, success: false };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Procesar resultados del lote
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.success) {
            generatedPdfs[result.value.storyId] = result.value.pdfUrl;
          }
        });
        
        // Esperar entre lotes (excepto el último)
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
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