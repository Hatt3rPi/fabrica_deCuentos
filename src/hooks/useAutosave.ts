import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { WizardState, EstadoFlujo } from '../types';
import { logger, autosaveLogger } from '../utils/logger';

const AUTOSAVE_DELAY = 1000; // 1 second delay between saves
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds between retries

const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const useAutosave = (
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

  // Keep storyId in sync when the route parameter changes
  useEffect(() => {
    if (initialStoryId && isValidUUID(initialStoryId)) {
      if (storyIdRef.current !== initialStoryId) {
        storyIdRef.current = initialStoryId;
        localStorage.setItem('current_story_draft_id', initialStoryId);
        // Reset cache when story changes
        cachedTitleRef.current = null;
        titleFetchedRef.current = false;
      }
    } else if (!storyIdRef.current) {
      // Fallback to any value already stored in localStorage
      const savedId = localStorage.getItem('current_story_draft_id');
      if (savedId && isValidUUID(savedId)) {
        storyIdRef.current = savedId;
        // Reset cache for new story
        cachedTitleRef.current = null;
        titleFetchedRef.current = false;
      }
    }
  }, [initialStoryId]);

  useEffect(() => {
    if (!user || !storyIdRef.current) return;

    const save = async () => {
      const currentStoryId = storyIdRef.current;
      if (!currentStoryId || !isValidUUID(currentStoryId)) {
        logger.error('Invalid storyId format');
        return;
      }

      autosaveLogger.start(currentStoryId);

      try {
        // Save to localStorage first as backup
        localStorage.setItem(
          `story_draft_${currentStoryId}`,
          JSON.stringify({ state, flow }),
        );

        // Save characters to characters table
        if (state.characters.length > 0) {
          for (const character of state.characters) {
            const characterData = {
              id: character.id,
              user_id: user.id,
              name: character.name,
              age: character.age,
              description: character.description,
              reference_urls: character.reference_urls || [],
              thumbnail_url: character.thumbnailUrl,
              updated_at: new Date().toISOString()
            };

            const { error: characterError } = await supabase
              .from('characters')
              .upsert(characterData)
              .eq('id', character.id);

            if (characterError) throw characterError;
          }
        }

        // Optimización: Solo consultar BD cuando el título local está vacío y no tenemos cache
        let titleToSave = state.meta.title;
        let existingTitle = null;

        if (!state.meta.title) {
          // Usar cache si está disponible
          if (titleFetchedRef.current && cachedTitleRef.current !== null) {
            existingTitle = cachedTitleRef.current;
            titleToSave = existingTitle || '';
          } else {
            // Solo hacer consulta cuando realmente necesitamos el título de BD
            const { data: existingStory, error } = await supabase
              .from('stories')
              .select('title')
              .eq('id', currentStoryId)
              .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found, es OK
              logger.error('Error fetching existing title:', error);
            }

            existingTitle = existingStory?.title || null;
            titleToSave = existingTitle || '';
            
            // Cachear el resultado
            cachedTitleRef.current = existingTitle;
            titleFetchedRef.current = true;
          }
        }

        // Save story metadata (content only, NOT wizard_state)
        console.log('[AutoSave] PERSISTIENDO CONTENIDO DE STORY', {
          storyId: currentStoryId,
          fields: ['title', 'theme', 'target_age', 'literary_style', 'central_message', 'additional_details', 'dedicatoria'],
          currentTitle: state.meta.title,
          existingTitle,
          titleToSave,
          usedCache: !state.meta.title && titleFetchedRef.current,
          consultedDB: !state.meta.title && !titleFetchedRef.current,
          hasDedicatoria: !!state.dedicatoria?.text
        });

        logger.debug('Guardando story - Título actual:', state.meta.title, 'Título existente:', existingTitle, 'Título a guardar:', titleToSave, 'Usó cache:', !state.meta.title && titleFetchedRef.current, 'Consultó BD:', !state.meta.title && !titleFetchedRef.current);
        
        const { error: storyError } = await supabase
          .from('stories')
          .update({
            title: titleToSave,
            theme: state.meta.theme,
            target_age: state.meta.targetAge,
            literary_style: state.meta.literaryStyle,
            central_message: state.meta.centralMessage,
            additional_details: state.meta.additionalDetails,
            dedicatoria_text: state.dedicatoria?.text || null,
            dedicatoria_image_url: state.dedicatoria?.imageUrl || null,
            dedicatoria_layout: state.dedicatoria ? {
              layout: state.dedicatoria.layout,
              alignment: state.dedicatoria.alignment,
              imageSize: state.dedicatoria.imageSize
            } : null,
            updated_at: new Date().toISOString(),
            status: 'draft'
          })
          .eq('id', currentStoryId);

        if (storyError) {
          autosaveLogger.error(storyError);
          throw storyError;
        }

        autosaveLogger.success();

        // Reset retry count on successful save
        retryCountRef.current = 0;
        
        // Clear localStorage backup after successful save
        localStorage.removeItem(`story_draft_${currentStoryId}_backup`);
      } catch (error) {
        if (retryCountRef.current < MAX_RETRIES) {
          // Save to localStorage backup before retrying
          localStorage.setItem(
            `story_draft_${currentStoryId}_backup`,
            JSON.stringify({ state, flow, timestamp: Date.now() })
          );
          
          // Increment retry count
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
    timeoutRef.current = setTimeout(save, AUTOSAVE_DELAY);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [state, flow, supabase, user]);


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

  return { 
    recoverFromBackup,
    currentStoryId: storyIdRef.current 
  };
};