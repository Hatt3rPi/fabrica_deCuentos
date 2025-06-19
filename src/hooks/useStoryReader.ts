import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from './useNotifications';
import { NotificationType, NotificationPriority } from '../types/notification';

interface StoryData {
  id: string;
  title: string;
  status: 'draft' | 'completed';
  export_url?: string;
}

interface StoryPage {
  id: string;
  page_number: number;
  text: string;
  image_url: string;
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
        .select('id, title, status, export_url')
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

      setPages(pagesData || []);
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