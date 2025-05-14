import { create } from 'zustand';
import { Character } from '../types/character';

interface CharacterState {
  characters: Character[];
  stylePreviews: Record<string, string>;
  coverUrl: string | null;
  setCharacters: (characters: Character[]) => void;
  setStylePreview: (style: string, url: string) => void;
  setCoverUrl: (url: string) => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characters: [],
  stylePreviews: {},
  coverUrl: null,
  setCharacters: (characters) => set({ characters }),
  setStylePreview: (style, url) => 
    set((state) => ({ 
      stylePreviews: { ...state.stylePreviews, [style]: url } 
    })),
  setCoverUrl: (url) => set({ coverUrl: url }),
}));

export const visualStyles = [
  "Acuarela digital",
  "Kawaii", 
  "Recortes de papel",
  "Dibujado a mano"
];

export const defaultPalette = "Pasteles vibrantes";
export const defaultStyle = "Acuarela digital";