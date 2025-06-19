import { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useNotifications } from './useNotifications';
import { NotificationType, NotificationPriority } from '../types/notification';

interface UsePdfExportReturn {
  downloadingPdf: boolean;
  handleDownloadPdf: (exportUrl?: string) => Promise<void>;
}

export const usePdfExport = (
  storyId: string | undefined,
  supabase: SupabaseClient
): UsePdfExportReturn => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const { createNotification } = useNotifications();

  const handleDownloadPdf = useCallback(async (exportUrl?: string) => {
    if (exportUrl) {
      // Use existing export URL
      window.open(exportUrl, '_blank');
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Éxito',
        'PDF descargado exitosamente',
        NotificationPriority.MEDIUM
      );
      return;
    }

    // If no export URL, generate PDF
    if (!storyId) {
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error',
        'ID de historia no válido',
        NotificationPriority.HIGH
      );
      return;
    }

    try {
      setDownloadingPdf(true);
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        throw new Error('No se encontró sesión activa');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/story-export`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            story_id: storyId,
            save_to_library: true
          })
        }
      );

      if (!response.ok) {
        throw new Error('Error generando PDF');
      }

      const data = await response.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Éxito',
          'PDF descargado exitosamente',
          NotificationPriority.MEDIUM
        );
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error',
        'Error descargando PDF',
        NotificationPriority.HIGH
      );
    } finally {
      setDownloadingPdf(false);
    }
  }, [storyId, supabase, createNotification]);

  return { downloadingPdf, handleDownloadPdf };
};