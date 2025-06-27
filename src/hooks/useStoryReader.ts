import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from './useNotifications';
import { NotificationType, NotificationPriority } from '../types/notification';

interface StoryData {
  id: string;
  title: string;
  status: 'draft' | 'completed';
  export_url?: string;
  dedicatoria_text?: string;
  dedicatoria_image_url?: string;
  dedicatoria_background_url?: string;
  dedicatoria_layout?: {
    layout: 'imagen-arriba' | 'imagen-abajo' | 'imagen-izquierda' | 'imagen-derecha';
    alignment: 'centro' | 'izquierda' | 'derecha';
    imageSize: 'pequena' | 'mediana' | 'grande';
  };
  dedicatoria_chosen?: boolean;
}

interface StoryPage {
  id: string;
  page_number: number;
  text: string;
  image_url: string;
  page_type?: 'story' | 'cover' | 'dedicatoria';
  background_url?: string;
}

export const useStoryReader = (storyId: string | undefined) => {
  const { supabase, user } = useAuth();
  const { createNotification } = useNotifications();
  const [story, setStory] = useState<StoryData | null>(null);
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storyId || !user) {
      setLoading(false);
      return;
    }

    fetchStoryData();
  }, [storyId, user]);

  const fetchStoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch story - validate user ownership
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('id, title, status, export_url, dedicatoria_text, dedicatoria_image_url, dedicatoria_background_url, dedicatoria_layout, dedicatoria_chosen')
        .eq('id', storyId)
        .eq('user_id', user?.id)
        .single();

      if (storyError || !storyData) {
        const errorMsg = 'Cuento no encontrado o sin permisos de acceso';
        setError(errorMsg);
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error',
          errorMsg,
          NotificationPriority.HIGH
        );
        return;
      }

      // Only allow reading completed stories
      if (storyData.status !== 'completed') {
        const errorMsg = 'Solo se pueden leer cuentos completados';
        setError(errorMsg);
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error',
          errorMsg,
          NotificationPriority.HIGH
        );
        return;
      }

      setStory(storyData);

      // Fetch pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('story_pages')
        .select('id, page_number, text, image_url')
        .eq('story_id', storyId)
        .order('page_number');

      if (pagesError) {
        const errorMsg = 'Error cargando páginas del cuento';
        setError(errorMsg);
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error',
          errorMsg,
          NotificationPriority.HIGH
        );
        return;
      }

      // Agregar página de dedicatoria al inicio si existe
      let allPages = pagesData || [];
      
      if (storyData.dedicatoria_chosen && (storyData.dedicatoria_text || storyData.dedicatoria_image_url)) {
        const dedicatoriaPage: StoryPage = {
          id: 'dedicatoria-page',
          page_number: -1, // Número especial para dedicatoria
          text: storyData.dedicatoria_text || '',
          image_url: storyData.dedicatoria_image_url || '',
          page_type: 'dedicatoria',
          background_url: storyData.dedicatoria_background_url
        };
        
        // Insertar dedicatoria después de la portada (índice 1)
        allPages = [
          allPages[0], // Portada
          dedicatoriaPage,
          ...allPages.slice(1) // Resto de páginas
        ];
      }
      
      setPages(allPages);
    } catch (err) {
      console.error('Error fetching story:', err);
      const errorMsg = 'Error cargando el cuento';
      setError(errorMsg);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error',
        errorMsg,
        NotificationPriority.HIGH
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    story,
    pages,
    loading,
    error
  };
};