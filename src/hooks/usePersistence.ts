import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { WizardState, EstadoFlujo } from '../types';
import { logger } from '../utils/logger';

const PERSISTENCE_DELAY = 1500; // 1.5 seconds delay for text changes
const METADATA_DELAY = 3000; // 3 seconds delay for metadata  
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const EXPORT_PAUSE_DURATION = 8000; // 8 seconds pause after export

const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

interface PersistenceState {
  canSave: boolean;
  isDirty: boolean;
  isBlocked: boolean;
  lastSaveTime: number;
  finalStates: string[];
  pausedUntil?: number;
}

type PersistenceMode = 'draft' | 'review' | 'final' | 'export';

export const usePersistence = (
  state: WizardState,
  flow: EstadoFlujo,
  initialStoryId: string | null,
) => {
  const { supabase, user } = useAuth();
  const timeoutRef = useRef<number>();
  const retryCountRef = useRef(0);
  const storyIdRef = useRef<string | null>(null);
  const cachedTitleRef = useRef<string | null>(null);
  const titleFetchedRef = useRef<boolean>(false);
  const lastSavedStateRef = useRef<any>(null);
  const persistenceStateRef = useRef<PersistenceState>({
    canSave: true,
    isDirty: false,
    isBlocked: false,
    lastSaveTime: 0,
    finalStates: ['completed', 'exported'],
    pausedUntil: undefined
  });

  // Keep storyId in sync when the route parameter changes
  useEffect(() => {
    if (initialStoryId && isValidUUID(initialStoryId)) {
      if (storyIdRef.current !== initialStoryId) {
        storyIdRef.current = initialStoryId;
        localStorage.setItem('current_story_draft_id', initialStoryId);
        cachedTitleRef.current = null;
        titleFetchedRef.current = false;
        lastSavedStateRef.current = null;
      }
    } else if (!storyIdRef.current) {
      const savedId = localStorage.getItem('current_story_draft_id');
      if (savedId && isValidUUID(savedId)) {
        storyIdRef.current = savedId;
        cachedTitleRef.current = null;
        titleFetchedRef.current = false;
        lastSavedStateRef.current = null;
      }
    }
  }, [initialStoryId]);

  // Listen for export events to pause persistence
  useEffect(() => {
    const handleExportStart = () => {
      logger.debug('[Persistence] Export iniciado - pausando persistencia');
      persistenceStateRef.current.pausedUntil = Date.now() + EXPORT_PAUSE_DURATION;
      persistenceStateRef.current.isBlocked = true;
    };

    const handleExportComplete = () => {
      logger.debug('[Persistence] Export completado - pausando por seguridad');
      persistenceStateRef.current.pausedUntil = Date.now() + EXPORT_PAUSE_DURATION;
      persistenceStateRef.current.isBlocked = true;
    };

    window.addEventListener('export-start', handleExportStart);
    window.addEventListener('story-status-updated', handleExportComplete);

    return () => {
      window.removeEventListener('export-start', handleExportStart);
      window.removeEventListener('story-status-updated', handleExportComplete);
    };
  }, []);

  // Determine persistence mode based on story state
  const getPersistenceMode = useCallback((): PersistenceMode => {
    // Check if we're in export process or completed
    if (flow.dedicatoria === 'completado' || flow.export === 'completado') {
      return 'final';
    }
    
    // Check if we have preview generated
    if (flow.vistaPrevia === 'completado') {
      return 'review';
    }
    
    // Check if we have story content
    if (flow.cuento === 'completado') {
      return 'review';
    }
    
    return 'draft';
  }, [flow]);

  // Intelligent diff to detect real changes
  const hasRealChanges = useCallback((currentState: any, lastState: any): boolean => {
    if (!lastState) return true;

    // Compare important content fields
    const importantFields = ['title', 'theme', 'targetAge', 'literaryStyle', 'centralMessage', 'additionalDetails'];
    const currentMeta = currentState.meta || {};
    const lastMeta = lastState.meta || {};

    for (const field of importantFields) {
      if (currentMeta[field] !== lastMeta[field]) {
        logger.debug(`[Persistence] Cambio detectado en ${field}:`, {
          old: lastMeta[field],
          new: currentMeta[field]
        });
        return true;
      }
    }

    // Compare dedicatoria
    const currentDedicatoria = currentState.dedicatoria;
    const lastDedicatoria = lastState.dedicatoria;
    
    if (JSON.stringify(currentDedicatoria) !== JSON.stringify(lastDedicatoria)) {
      logger.debug('[Persistence] Cambio detectado en dedicatoria');
      return true;
    }

    // Compare characters
    if (JSON.stringify(currentState.characters) !== JSON.stringify(lastState.characters)) {
      logger.debug('[Persistence] Cambio detectado en personajes');
      return true;
    }

    return false;
  }, []);

  // Check if persistence is currently allowed
  const canPersistNow = useCallback((): boolean => {
    const now = Date.now();
    const state = persistenceStateRef.current;

    // Check if paused
    if (state.pausedUntil && now < state.pausedUntil) {
      return false;
    }

    // Reset pause if expired
    if (state.pausedUntil && now >= state.pausedUntil) {
      state.pausedUntil = undefined;
      state.isBlocked = false;
      logger.debug('[Persistence] Pausa expirada - reanudando persistencia');
    }

    return state.canSave && !state.isBlocked;
  }, []);

  // Get appropriate delay based on persistence mode
  const getPersistenceDelay = useCallback((mode: PersistenceMode): number => {
    switch (mode) {
      case 'draft': return PERSISTENCE_DELAY;
      case 'review': return METADATA_DELAY;
      case 'final': return METADATA_DELAY * 2;
      case 'export': return 0; // No persistence in export mode
      default: return PERSISTENCE_DELAY;
    }
  }, []);

  useEffect(() => {
    if (!user || !storyIdRef.current) return;

    const currentStoryId = storyIdRef.current;
    const mode = getPersistenceMode();

    // Don't persist in export mode
    if (mode === 'export') {
      logger.debug('[Persistence] Modo export - persistencia deshabilitada');
      return;
    }

    // Check if we can persist now
    if (!canPersistNow()) {
      logger.debug('[Persistence] Persistencia pausada temporalmente');
      return;
    }

    // Check for real changes
    const currentStateSnapshot = {
      meta: state.meta,
      characters: state.characters,
      dedicatoria: state.dedicatoria
    };

    if (!hasRealChanges(currentStateSnapshot, lastSavedStateRef.current)) {
      logger.debug('[Persistence] No hay cambios reales - omitiendo persistencia');
      return;
    }

    const save = async () => {
      try {
        // Get current status to preserve final states
        const { data: currentStory } = await supabase
          .from('stories')
          .select('status')
          .eq('id', currentStoryId)
          .single();

        const preserveStatus = persistenceStateRef.current.finalStates.includes(currentStory?.status);
        
        logger.debug(`[Persistence] Modo: ${mode}, Preservar status: ${preserveStatus}`, {
          currentStatus: currentStory?.status,
          finalStates: persistenceStateRef.current.finalStates
        });

        // Prepare update data based on mode
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        // Always safe to update these in any mode
        if (state.meta.title) {
          updateData.title = state.meta.title;
        }

        // In draft and review mode, update all content
        if (mode === 'draft' || mode === 'review') {
          updateData.theme = state.meta.theme;
          updateData.target_age = state.meta.targetAge;
          updateData.literary_style = state.meta.literaryStyle;
          updateData.central_message = state.meta.centralMessage;
          updateData.additional_details = state.meta.additionalDetails;
          updateData.dedicatoria_text = state.dedicatoria?.text || null;
          updateData.dedicatoria_image_url = state.dedicatoria?.imageUrl || null;
          updateData.dedicatoria_layout = state.dedicatoria ? {
            layout: state.dedicatoria.layout,
            alignment: state.dedicatoria.alignment,
            imageSize: state.dedicatoria.imageSize
          } : null;
        }

        // Only update status if not preserving final states
        if (!preserveStatus) {
          updateData.status = 'draft';
        } else {
          logger.debug('[Persistence] Preservando status final:', currentStory?.status);
        }

        const { error: storyError } = await supabase
          .from('stories')
          .update(updateData)
          .eq('id', currentStoryId);

        if (storyError) {
          throw storyError;
        }

        // Update wizard state
        const { error: flowError } = await supabase
          .from('stories')
          .update({
            wizard_state: flow,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentStoryId);

        if (flowError) {
          throw flowError;
        }

        // Update last saved state
        lastSavedStateRef.current = { ...currentStateSnapshot };
        persistenceStateRef.current.lastSaveTime = Date.now();
        persistenceStateRef.current.isDirty = false;
        retryCountRef.current = 0;

        logger.debug(`[Persistence] ✅ Guardado exitoso en modo ${mode}`, {
          preservedStatus: preserveStatus ? currentStory?.status : 'draft',
          fieldsUpdated: Object.keys(updateData),
          storyId: currentStoryId
        });
        
        // Clear localStorage backup after successful save
        localStorage.removeItem(`story_draft_${currentStoryId}_backup`);

      } catch (error) {
        if (retryCountRef.current < MAX_RETRIES) {
          // Save to localStorage backup before retrying
          localStorage.setItem(
            `story_draft_${currentStoryId}_backup`,
            JSON.stringify({ state, flow, timestamp: Date.now() })
          );
          
          retryCountRef.current += 1;
          
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCountRef.current - 1))
          );
          
          return save();
        }
        throw error;
      }
    };

    // Debounce the save operation
    clearTimeout(timeoutRef.current);
    const delay = getPersistenceDelay(mode);
    timeoutRef.current = setTimeout(save, delay) as any;

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [state, flow, supabase, user, getPersistenceMode, canPersistNow, hasRealChanges, getPersistenceDelay]);

  // Expose recovery method
  const recoverFromBackup = async (id: string) => {
    const backup = localStorage.getItem(`story_draft_${id}_backup`);
    const emergency = localStorage.getItem(`story_draft_${id}_emergency`);
    
    if (backup) {
      const { state: backupState } = JSON.parse(backup);
      return backupState;
    }
    
    if (emergency) {
      const { state: emergencyState } = JSON.parse(emergency);
      return emergencyState;
    }
    
    return null;
  };

  // Expose manual pause/resume controls
  const pausePersistence = useCallback((duration: number = 5000) => {
    persistenceStateRef.current.pausedUntil = Date.now() + duration;
    persistenceStateRef.current.isBlocked = true;
    logger.debug(`[Persistence] Pausado manualmente por ${duration}ms`);
  }, []);

  const resumePersistence = useCallback(() => {
    persistenceStateRef.current.pausedUntil = undefined;
    persistenceStateRef.current.isBlocked = false;
    logger.debug('[Persistence] Reanudado manualmente');
  }, []);

  return { 
    recoverFromBackup,
    currentStoryId: storyIdRef.current,
    pausePersistence,
    resumePersistence,
    isPaused: () => !canPersistNow()
  };
};