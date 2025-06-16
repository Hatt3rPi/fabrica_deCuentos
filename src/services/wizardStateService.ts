import { supabase } from '../lib/supabase';
import { EstadoFlujo } from '../stores/wizardFlowStore';

/**
 * Service for updating wizard_state directly in the database
 * This is separate from auto-save which handles content persistence
 */
export const wizardStateService = {
  /**
   * Updates wizard_state in database immediately
   * Used for critical state changes that need immediate persistence
   */
  async updateWizardState(storyId: string, wizardState: EstadoFlujo): Promise<{ error: any }> {
    const { error } = await supabase
      .from('stories')
      .update({ 
        wizard_state: wizardState,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    if (error) {
      console.error('[WizardStateService] ERROR updating wizard_state:', error);
    }

    return { error };
  }
};