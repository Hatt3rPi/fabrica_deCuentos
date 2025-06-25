import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { useWizard } from '../context/WizardContext';

type WizardStep = 'characters' | 'story' | 'design' | 'preview' | 'dedicatoria-choice' | 'dedicatoria' | 'export';

interface WizardLockStatus {
  isStepLocked: (step: WizardStep) => boolean;
  getLockReason: (step: WizardStep) => string;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  // Estado específico para dedicatoria
  dedicatoriaChoice: boolean | null;
  isPreviewGenerated: boolean;
  isPdfCompleted: boolean;
}

interface StoryData {
  status: string;
  dedicatoria_chosen?: boolean;
}

export const useWizardLockStatus = (): WizardLockStatus => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useAuth();
  const { storyId } = useParams();
  const { generatedPages } = useWizard();
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Detectar si la vista previa fue generada (páginas con imágenes existen)
  const isPreviewGenerated = useMemo(() => {
    return generatedPages.some(page => page.pageNumber > 0 && page.imageUrl);
  }, [generatedPages]);

  // Detectar si el PDF fue completado
  const isPdfCompleted = useMemo(() => {
    return storyData?.status === 'completed';
  }, [storyData]);

  // Use ref to track if component is mounted and for timeout management
  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStoryData = useCallback(async () => {
    if (!storyId || !mountedRef.current) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const { data: story, error: fetchError } = await supabase
        .from('stories')
        .select('status, dedicatoria_chosen')
        .eq('id', storyId)
        .single();

      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }

      if (mountedRef.current) {
        setStoryData(story);
        retryCountRef.current = 0; // Reset retry count on success
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useWizardLockStatus] Error fetching story data:', err);
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.warn(`[useWizardLockStatus] Retrying... (${retryCountRef.current}/${maxRetries})`);
        // Exponential backoff: 1s, 2s, 4s
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            fetchStoryData();
          }
        }, Math.pow(2, retryCountRef.current - 1) * 1000);
        return;
      }
      
      setError(errorMessage);
      setStoryData(null);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [storyId, supabase]); // Keep both deps as they're needed

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    fetchStoryData();
  }, [fetchStoryData]);

  // Lógica centralizada de bloqueos
  const isStepLocked = useCallback((step: WizardStep): boolean => {
    // DEBUG: Log para diagnosticar problema
    console.log('[useWizardLockStatus] DEBUG:', {
      step,
      storyData,
      isPdfCompleted,
      isPreviewGenerated,
      generatedPagesCount: generatedPages.length
    });
    
    // Nivel 2: PDF completado - bloquea todas las etapas excepto export
    if (isPdfCompleted) {
      return step !== 'export';
    }
    
    // Nivel 1: Vista previa generada - bloquea etapas iniciales
    if (isPreviewGenerated) {
      return ['characters', 'story', 'design'].includes(step);
    }
    
    return false;
  }, [isPdfCompleted, isPreviewGenerated, storyData, generatedPages]);

  const getLockReason = useCallback((step: WizardStep): string => {
    if (isPdfCompleted) {
      return 'PDF generado - edición bloqueada';
    }
    
    if (isPreviewGenerated && ['characters', 'story', 'design'].includes(step)) {
      return 'Vista previa generada - edición bloqueada';
    }
    
    return '';
  }, [isPdfCompleted, isPreviewGenerated]);

  useEffect(() => {
    if (!storyId) {
      setIsLoading(false);
      return;
    }

    mountedRef.current = true;
    
    const initializeData = async () => {
      if (!mountedRef.current) return;
      await fetchStoryData();
    };

    initializeData();

    // Escuchar cambios en tiempo real
    const subscription = supabase
      .channel(`story-lock-status-${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${storyId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          if (payload.new && ('status' in payload.new || 'dedicatoria_chosen' in payload.new)) {
            setStoryData(prev => ({
              ...prev,
              status: payload.new.status || prev?.status || '',
              dedicatoria_chosen: payload.new.dedicatoria_chosen ?? prev?.dedicatoria_chosen
            }));
            setError(null); // Clear any previous errors on successful update
          }
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Unsubscribe from channel
      subscription.unsubscribe();
    };
  }, [storyId]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return {
    isStepLocked,
    getLockReason,
    isLoading,
    error,
    retry,
    dedicatoriaChoice: storyData?.dedicatoria_chosen ?? null,
    isPreviewGenerated,
    isPdfCompleted
  };
};