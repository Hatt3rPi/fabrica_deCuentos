import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
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

interface UseStoryDataReturn {
  story: StoryData | null;
  pages: StoryPage[];
  loading: boolean;
  error: string | null;
}

export const useStoryData = (
  storyId: string | undefined,
  user: User | null,
  supabase: SupabaseClient
): UseStoryDataReturn => {
  const [story, setStory] = useState<StoryData | null>(null);
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { createNotification } = useNotifications();

  useEffect(() => {
    if (!storyId || !user) {
      navigate('/home');
      return;
    }

    const fetchStoryData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch story - validate user ownership
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('id, title, status, export_url')
          .eq('id', storyId)
          .eq('user_id', user.id)
          .single();

        if (storyError || !storyData) {
          const errorMessage = 'Cuento no encontrado o sin permisos de acceso';
          setError(errorMessage);
          createNotification(
            NotificationType.SYSTEM_UPDATE,
            'Error',
            errorMessage,
            NotificationPriority.HIGH
          );
          navigate('/home');
          return;
        }

        // Only allow reading completed stories
        if (storyData.status !== 'completed') {
          const errorMessage = 'Solo se pueden leer cuentos completados';
          setError(errorMessage);
          createNotification(
            NotificationType.SYSTEM_UPDATE,
            'Error',
            errorMessage,
            NotificationPriority.HIGH
          );
          navigate('/home');
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
          const errorMessage = 'Error cargando páginas del cuento';
          setError(errorMessage);
          createNotification(
            NotificationType.SYSTEM_UPDATE,
            'Error',
            errorMessage,
            NotificationPriority.HIGH
          );
          return;
        }

        setPages(pagesData || []);
      } catch (err) {
        console.error('Error fetching story:', err);
        const errorMessage = 'Error cargando el cuento';
        setError(errorMessage);
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error',
          errorMessage,
          NotificationPriority.HIGH
        );
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };

    fetchStoryData();
  }, [storyId, user, supabase, navigate, createNotification]);

  return { story, pages, loading, error };
};