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

  const downloadPdf = useCallback(async (story: Story) => {
    if (!story.export_url) {
      // If no export URL, generate PDF
      try {
        setDownloading(true);
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/story-export`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            story_id: story.id,
            save_to_library: true
          })
        });

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
        setDownloading(false);
      }
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
  }, [supabase, createNotification]);

  return {
    downloadPdf,
    downloading
  };
};