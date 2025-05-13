import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { WizardState } from '../types';

export const useAutosave = (state: WizardState, storyId: string) => {
  const { supabase } = useAuth();
  const timeoutRef = useRef<number>();

  useEffect(() => {
    const save = async () => {
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