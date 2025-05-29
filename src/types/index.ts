// Tipos para el personaje
export interface Character {
  id: string;
  user_id: string;
  name: string;
  description: {
    es: string;
    en: string;
  } | string;
  age: string;
  images: string[];
  thumbnailUrl: string | null;
  created_at?: string;
  updated_at?: string;
}

export * from './profile';

// Tipos para la configuración del sistema
export interface SystemSettings {
  image_generation: ImageGenerationSettings;
}

export interface ImageGenerationSettings {
  engines: {
    thumbnail: ImageEngine;
    variations: ImageEngine;
    spriteSheet: ImageEngine;
  };
  last_updated: string;
}

export interface ImageEngine {
  provider: 'openai' | 'stability';
  model: OpenAIModel | StabilityModel;
  quality?: string;
  size?: string;
  style?: string;
}

export type OpenAIModel = 'dall-e-2' | 'dall-e-3' | 'gpt-image-1';
export type StabilityModel = 'stable-diffusion-3.5';

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

// Estado global del wizard
export interface WizardState {
  characters: Character[];
  styles: Array<{
    characterId: string;
    styleId: string;
    paletteId: string;
  }>;
  spreads: Array<{
    page: number;
    text: string;
    prompt: string;
    imageUrl: string;
  }>;
  meta: {
    title: string;
    synopsis: string;
    targetAge: string;
    literaryStyle: string;
    centralMessage: string;
    additionalDetails: string;
    status: 'draft' | 'done';
  };
}

// Opciones disponibles para la configuración del cuento
export const ageOptions = [
  { value: '3-5', label: '3 a 5 años' },
  { value: '6-8', label: '6 a 8 años' },
  { value: '9-12', label: '9 a 12 años' }
];

export const styleOptions = [
  { value: 'narrativo', label: 'Narrativo clásico', example: 'Una mañana luminosa, el joven triceratops Tito se acercó a la orilla del Río Azul...' },
  { value: 'rimado', label: 'Cuento rimado', example: 'En la selva se escuchó, un ¡chap! que retumbó. Era Tito, el triceratops veloz...' },
  { value: 'fabula', label: 'Fábula con moraleja', example: 'Rolo, orgulloso de sus placas lustrosas, se negó a bañarse con sus amigos...' },
  { value: 'repetitivo', label: 'Estilo repetitivo', example: 'Uno: Tito entra al río. ¡Chap! Dos: Dina entra al río. ¡Chap chap!...' }
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
  { value: 'default', label: 'Estilo por defecto' },
  { value: 'acuarela', label: 'Acuarela' },
  { value: 'bordado', label: 'Bordado' },
  { value: 'kawaii', label: 'Kawaii' },
  { value: 'dibujado', label: 'Dibujado a mano' },
  { value: 'recortes', label: 'Recortes de papel' }
];

export const colorPaletteOptions = [
  {
    value: 'pastel',
    label: 'Colores pasteles',
    colors: ['#FFE5E5', '#E5F1FF', '#E5FFE8', '#FFE5F6', '#F3E5FF']
  },
  {
    value: 'pastel_vibrant',
    label: 'Colores pasteles vibrantes',
    colors: ['#FFB3B3', '#B3D9FF', '#B3FFB9', '#FFB3E6', '#DCB3FF']
  },
  {
    value: 'earthy',
    label: 'Colores terrosos',
    colors: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3']
  },
  {
    value: 'vibrant',
    label: 'Colores vibrantes',
    colors: ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#FFFF00']
  }
];
