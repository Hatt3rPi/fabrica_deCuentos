import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { WizardState, EstadoFlujo } from '../types';
import { storyService } from '../services/storyService';

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

  // Keep storyId in sync when the route parameter changes
  useEffect(() => {
    if (initialStoryId && isValidUUID(initialStoryId)) {
      if (storyIdRef.current !== initialStoryId) {
        storyIdRef.current = initialStoryId;
        localStorage.setItem('current_story_draft_id', initialStoryId);
      }
    } else if (!storyIdRef.current) {
      // Fallback to any value already stored in localStorage
      const savedId = localStorage.getItem('current_story_draft_id');
      if (savedId && isValidUUID(savedId)) {
        storyIdRef.current = savedId;
      }
    }
  }, [initialStoryId]);

  useEffect(() => {
    if (!user || !storyIdRef.current) return;

    const save = async () => {
      const currentStoryId = storyIdRef.current;
      if (!currentStoryId || !isValidUUID(currentStoryId)) {
        console.error('Invalid storyId format');
        return;
      }

      console.log('[AutoSave] INICIANDO SAVE', {
        storyId: currentStoryId,
        flow: flow,
        timestamp: new Date().toISOString()
      });

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

        // Save story metadata
        console.log('[AutoSave] PERSISTIENDO STORY CON WIZARD_STATE', {
          storyId: currentStoryId,
          wizard_state_que_se_guarda: flow
        });

        const { error: storyError } = await storyService.persistStory(currentStoryId, {
          title: state.meta.title,
          theme: state.meta.theme,
          target_age: state.meta.targetAge,
          literary_style: state.meta.literaryStyle,
          central_message: state.meta.centralMessage,
          additional_details: state.meta.additionalDetails,
          updated_at: new Date().toISOString(),
          status: 'draft'
        });

        if (storyError) {
          console.error('[AutoSave] ERROR AL PERSISTIR STORY:', storyError);
          throw storyError;
        }

        console.log('[AutoSave] ✅ SAVE COMPLETADO EXITOSAMENTE');

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