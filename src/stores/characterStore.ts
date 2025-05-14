import { create } from 'zustand';
import { Character } from '../types';

interface CharacterStore {
  characters: Character[];
  currentCharacter: Character | null;
  setCharacters: (characters: Character[]) => void;
  setCurrentCharacter: (character: Character | null) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, character: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  characters: [],
  currentCharacter: null,
  setCharacters: (characters) => set({ characters }),
  setCurrentCharacter: (character) => set({ currentCharacter: character }),
  addCharacter: (character) => 
    set((state) => ({ 
      characters: [...state.characters, character] 
    })),
  updateCharacter: (id, updatedCharacter) =>
    set((state) => ({
      characters: state.characters.map((char) =>
        char.id === id ? { ...char, ...updatedCharacter } : char
      ),
    })),
  deleteCharacter: (id) =>
    set((state) => ({
      characters: state.characters.filter((char) => char.id !== id),
    })),
}));