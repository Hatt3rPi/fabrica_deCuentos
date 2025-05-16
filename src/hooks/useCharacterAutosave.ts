import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Character } from '../types';

const AUTOSAVE_DELAY = 1000; // 1 second delay between saves
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds between retries

const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const useCharacterAutosave = (character: Partial<Character>, initialCharacterId: string | null = null) => {
  const { supabase, user } = useAuth();
  const timeoutRef = useRef<number>();
  const retryCountRef = useRef(0);
  const characterIdRef = useRef<string | null>(null);

  // Initialize characterId on mount
  useEffect(() => {
    if (!characterIdRef.current) {
      // Try to recover from localStorage first
      const savedId = localStorage.getItem('current_character_draft_id');
      if (savedId && isValidUUID(savedId)) {
        characterIdRef.current = savedId;
      } else if (initialCharacterId && isValidUUID(initialCharacterId)) {
        characterIdRef.current = initialCharacterId;
        localStorage.setItem('current_character_draft_id', initialCharacterId);
      } else {
        const newId = crypto.randomUUID();
        characterIdRef.current = newId;
        localStorage.setItem('current_character_draft_id', newId);
      }
    }
  }, [initialCharacterId]);

  useEffect(() => {
    if (!user || !characterIdRef.current) return;

    const save = async () => {
      const currentCharacterId = characterIdRef.current;
      if (!currentCharacterId || !isValidUUID(currentCharacterId)) {
        console.error('Invalid characterId format');
        return;
      }

      try {
        // Save to localStorage first as backup
        localStorage.setItem(`character_draft_${currentCharacterId}`, JSON.stringify(character));

        const characterData = {
          id: currentCharacterId,
          user_id: user.id,
          name: character.name || '',
          age: character.age || '',
          description: character.description || { es: '', en: '' },
          reference_urls: character.reference_urls || [],
          thumbnail_url: character.thumbnailUrl,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('characters')
          .upsert(characterData)
          .eq('id', currentCharacterId);

        if (error) throw error;

        // Reset retry count on successful save
        retryCountRef.current = 0;
        
        // Clear localStorage backup after successful save
        localStorage.removeItem(`character_draft_${currentCharacterId}_backup`);
      } catch (error) {
        if (retryCountRef.current < MAX_RETRIES) {
          // Save to localStorage backup before retrying
          localStorage.setItem(
            `character_draft_${currentCharacterId}_backup`,
            JSON.stringify({ character, timestamp: Date.now() })
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
  }, [character, supabase, user]);

  // Cleanup characterId on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem('current_character_draft_id');
    };
  }, []);

  // Expose recovery method
  const recoverFromBackup = async (id: string) => {
    const backup = localStorage.getItem(`character_draft_${id}_backup`);
    if (backup) {
      const { character: backupCharacter } = JSON.parse(backup);
      return backupCharacter;
    }
    return null;
  };

  return { 
    recoverFromBackup,
    currentCharacterId: characterIdRef.current 
  };
};