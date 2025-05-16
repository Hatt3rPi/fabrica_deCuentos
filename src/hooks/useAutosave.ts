import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { WizardState } from '../types';

const AUTOSAVE_DELAY = 1000; // 1 second delay between saves
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds between retries

const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const useAutosave = (state: WizardState, storyId: string) => {
  const { supabase } = useAuth();
  const timeoutRef = useRef<number>();
  const retryCountRef = useRef(0);

  useEffect(() => {
    const save = async () => {
      if (!storyId || !isValidUUID(storyId)) {
        console.log('No valid storyId provided, skipping autosave');
        return;
      }

      try {
        // Save to localStorage first as backup
        localStorage.setItem(`story_draft_${storyId}`, JSON.stringify(state));

        // Save to Supabase with retry logic
        const saveToSupabase = async (attempt: number = 0): Promise<void> => {
          try {
            const { error } = await supabase
              .from('stories')
              .update({
                title: state.meta.title,
                target_age: state.meta.targetAge,
                literary_style: state.meta.literaryStyle,
                central_message: state.meta.centralMessage,
                additional_details: state.meta.additionalDetails,
                updated_at: new Date().toISOString(),
                status: 'draft'
              })
              .eq('id', storyId);

            if (error) throw error;

            // Reset retry count on successful save
            retryCountRef.current = 0;
            
            // Clear localStorage backup after successful save
            localStorage.removeItem(`story_draft_${storyId}_backup`);
          } catch (error) {
            if (attempt < MAX_RETRIES) {
              // Save to localStorage backup before retrying
              localStorage.setItem(
                `story_draft_${storyId}_backup`,
                JSON.stringify({ state, timestamp: Date.now() })
              );
              
              // Increment retry count
              retryCountRef.current = attempt + 1;
              
              // Exponential backoff
              await new Promise(resolve => 
                setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt))
              );
              
              return saveToSupabase(attempt + 1);
            }
            throw error;
          }
        };

        await saveToSupabase();
      } catch (error) {
        console.error('Error autosaving:', error);
        
        // Save to localStorage as emergency backup
        localStorage.setItem(
          `story_draft_${storyId}_emergency`,
          JSON.stringify({ state, timestamp: Date.now(), error })
        );
      }
    };

    // Debounce the save operation
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, AUTOSAVE_DELAY);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [state, storyId, supabase]);

  // Expose recovery method
  const recoverFromBackup = async () => {
    const backup = localStorage.getItem(`story_draft_${storyId}_backup`);
    const emergency = localStorage.getItem(`story_draft_${storyId}_emergency`);
    
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

  return { recoverFromBackup };
};