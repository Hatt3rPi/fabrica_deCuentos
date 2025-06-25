import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';

interface StoryCompletionStatus {
  isCompleted: boolean;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export const useStoryCompletionStatus = (): StoryCompletionStatus => {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useAuth();
  const { storyId } = useParams();
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const fetchStoryStatus = useCallback(async () => {
    if (!storyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const { data: story, error: fetchError } = await supabase
        .from('stories')
        .select('status')
        .eq('id', storyId)
        .single();

      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }

      setIsCompleted(story?.status === 'completed');
      retryCountRef.current = 0; // Reset retry count on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useStoryCompletionStatus] Error fetching story status:', err);
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.warn(`[useStoryCompletionStatus] Retrying... (${retryCountRef.current}/${maxRetries})`);
        // Exponential backoff: 1s, 2s, 4s
        setTimeout(() => fetchStoryStatus(), Math.pow(2, retryCountRef.current - 1) * 1000);
        return;
      }
      
      setError(errorMessage);
      setIsCompleted(false);
    } finally {
      setIsLoading(false);
    }
  }, [storyId, supabase]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    fetchStoryStatus();
  }, [fetchStoryStatus]);

  useEffect(() => {
    if (!storyId) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    
    const initializeStatus = async () => {
      if (!mounted) return;
      await fetchStoryStatus();
    };

    initializeStatus();

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
          if (!mounted) return;
          if (payload.new && 'status' in payload.new) {
            setIsCompleted(payload.new.status === 'completed');
            setError(null); // Clear any previous errors on successful update
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [storyId, fetchStoryStatus]); // Remove supabase from deps as it's stable

  return {
    isCompleted,
    isLoading,
    error,
    retry
  };
};