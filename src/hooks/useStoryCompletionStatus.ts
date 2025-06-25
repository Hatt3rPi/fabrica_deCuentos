import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';

export const useStoryCompletionStatus = () => {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { supabase } = useAuth();
  const { storyId } = useParams();

  useEffect(() => {
    if (!storyId) {
      setIsLoading(false);
      return;
    }

    const fetchStoryStatus = async () => {
      try {
        setIsLoading(true);
        
        const { data: story, error } = await supabase
          .from('stories')
          .select('status')
          .eq('id', storyId)
          .single();

        if (error) {
          console.error('[useStoryCompletionStatus] Error fetching story status:', error);
          setIsCompleted(false);
        } else {
          setIsCompleted(story?.status === 'completed');
        }
      } catch (error) {
        console.error('[useStoryCompletionStatus] Error:', error);
        setIsCompleted(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoryStatus();

    // Escuchar cambios en tiempo real
    const subscription = supabase
      .channel(`story-status-${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${storyId}`,
        },
        (payload) => {
          if (payload.new && 'status' in payload.new) {
            setIsCompleted(payload.new.status === 'completed');
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [storyId, supabase]);

  return {
    isCompleted,
    isLoading
  };
};