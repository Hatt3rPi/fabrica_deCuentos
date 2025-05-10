// Tipos para el personaje
export interface Character {
  id: string;
  user_id: string;
  name: string;
  description: string;
  photo?: File;
  selected_variant: string | null;
  variants: CharacterVariant[];
  created_at?: string;
  updated_at?: string;
  sprite_sheet: SpriteSheet | null;
  sprite_sheet_status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface CharacterVariant {
  id: string;
  imageUrl: string;
  seed: string;
  style: string;
}

export interface SpriteSheet {
  id: string;
  imageUrl: string;
  seed: string;
  style: string;
}

// Tipos para la configuración del cuento
export interface StorySettings {
  targetAge: string;
  literaryStyle: string;
  centralMessage: string;
  additionalDetails: string;
}

// Tipos para la configuración del diseño
export interface DesignSettings {
  visualStyle: string;
  colorPalette: string;
}

// Opciones disponibles para la configuración del cuento
export const ageOptions = [
  { value: '3-5', label: '3 a 5 años' },
  { value: '6-8', label: '6 a 8 años' },
  { value: '9-12', label: '9 a 12 años' }
];

export const styleOptions = [
  { value: 'aventura', label: 'Aventura' },
  { value: 'fantasia', label: 'Fantasía' },
  { value: 'educativo', label: 'Educativo' },
  { value: 'humor', label: 'Humor' },
  { value: 'misterio', label: 'Misterio' }
];

export const messageOptions = [
  { value: 'amistad', label: 'Amistad' },
  { value: 'superacion', label: 'Superación' },
  { value: 'familia', label: 'Familia' },
  { value: 'ecologia', label: 'Ecología' },
  { value: 'respeto', label: 'Respeto' },
  { value: 'valentia', label: 'Valentía' }
];

// Opciones disponibles para el diseño
export const visualStyleOptions = [
  { value: 'acuarela', label: 'Acuarela' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'pixar', label: 'Estilo Pixar' },
  { value: 'dibujado', label: 'Dibujado a mano' },
  { value: 'realista', label: 'Semi-realista' }
];

export const colorPaletteOptions = [
  { value: 'pastel', label: 'Pastel' },
  { value: 'vivido', label: 'Colores vívidos' },
  { value: 'natural', label: 'Naturales' },
  { value: 'contrastado', label: 'Alto contraste' },
  { value: 'fantasia', label: 'Fantasía' }
];