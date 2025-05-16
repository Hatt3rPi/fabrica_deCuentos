import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Character } from '../types';

interface CharacterStore {
  characters: Character[];
  currentCharacter: Character | null;
  setCharacters: (characters: Character[]) => void;
  setCurrentCharacter: (character: Character | null) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, character: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  lastSaveTimestamp: number;
  setLastSaveTimestamp: (timestamp: number) => void;
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      characters: [],
      currentCharacter: null,
      lastSaveTimestamp: Date.now(),
      setCharacters: (characters) => set({ characters }),
      setCurrentCharacter: (character) => set({ currentCharacter: character }),
      addCharacter: (character) => 
        set((state) => ({
          characters: [...state.characters, character],
          lastSaveTimestamp: Date.now()
        })),
      updateCharacter: (id, updatedCharacter) =>
        set((state) => ({
          characters: state.characters.map((char) =>
            char.id === id ? { ...char, ...updatedCharacter } : char
          ),
          lastSaveTimestamp: Date.now()
        })),
      deleteCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((char) => char.id !== id),
          lastSaveTimestamp: Date.now()
        })),
      setLastSaveTimestamp: (timestamp) => set({ lastSaveTimestamp: timestamp })
    }),
    {
      name: 'character-store',
      partialize: (state) => ({
        characters: state.characters,
        lastSaveTimestamp: state.lastSaveTimestamp
      })
    }
  )
);