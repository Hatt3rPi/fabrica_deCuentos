import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { WizardState } from '../types';

const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const useAutosave = (state: WizardState, storyId: string) => {
  const { supabase } = useAuth();
  const timeoutRef = useRef<number>();

  useEffect(() => {
    const save = async () => {
      if (!storyId || !isValidUUID(storyId)) {
        console.log('No valid storyId provided, skipping autosave');
        return;
      }

      try {
        // Guardar en localStorage
        localStorage.setItem(`story_draft_${storyId}`, JSON.stringify(state));

        // Guardar en Supabase
        const { error } = await supabase
          .from('stories')
          .update({
            title: state.meta.title,
            target_age: state.meta.targetAge,
            literary_style: state.meta.literaryStyle,
            central_message: state.meta.centralMessage,
            additional_details: state.meta.additionalDetails,
            updated_at: new Date().toISOString()
          })
          .eq('id', storyId);

        if (error) throw error;
      } catch (error) {
        console.error('Error autosaving:', error);
      }
    };

    // Debounce el guardado
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, 1000);

    return () => clearTimeout(timeoutRef.current);
  }, [state, storyId, supabase]);
};