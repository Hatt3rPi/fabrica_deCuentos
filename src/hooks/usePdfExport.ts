import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from './useNotifications';
import { NotificationType, NotificationPriority } from '../types/notification';

interface Story {
  id: string;
  export_url?: string;
}

export const usePdfExport = () => {
  const { supabase } = useAuth();
  const { createNotification } = useNotifications();
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const generatePdf = useCallback(async (story: Story, forceRegenerate: boolean = false) => {
    try {
      const isRegenerating = forceRegenerate && story.export_url;
      if (isRegenerating) {
        setRegenerating(true);
      } else {
        setDownloading(true);
      }

      // Robust session handling
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuario no autenticado');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/story-export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story_id: story.id,
          save_to_library: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Detectar rate limiting específicamente
        if (response.status === 429) {
          throw new Error('El servicio está muy ocupado. Por favor intenta de nuevo en unos minutos.');
        }
        
        throw new Error(`Error generando PDF: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Éxito',
          isRegenerating ? 'PDF regenerado y descargado exitosamente' : 'PDF descargado exitosamente',
          NotificationPriority.MEDIUM
        );
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error',
        'Error generando PDF',
        NotificationPriority.HIGH
      );
    } finally {
      setDownloading(false);
      setRegenerating(false);
    }
  }, [supabase, createNotification]);

  const downloadPdf = useCallback(async (story: Story) => {
    if (!story.export_url) {
      // If no export URL, generate PDF
      await generatePdf(story, false);
    } else {
      // Use existing export URL
      window.open(story.export_url, '_blank');
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Éxito',
        'PDF descargado exitosamente',
        NotificationPriority.MEDIUM
      );
    }
  }, [generatePdf, createNotification]);

  const regeneratePdf = useCallback(async (story: Story) => {
    await generatePdf(story, true);
  }, [generatePdf]);

  return {
    downloadPdf,
    regeneratePdf,
    downloading,
    regenerating
  };
};