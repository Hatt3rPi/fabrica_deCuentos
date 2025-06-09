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
  provider: 'openai' | 'stability' | 'flux';
  model: OpenAIModel | StabilityModel | FluxModel;
  quality?: string;
  size?: string;
  style?: string;
}

export type OpenAIModel = 
  // Modelos de imagen
  | 'dall-e-2' 
  | 'dall-e-3' 
  | 'gpt-image-1'
  // Modelos de texto
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4o-2024-11-20'
  | 'gpt-4o-2024-08-06'
  | 'gpt-4o-2024-05-13'
  | 'gpt-4o-mini-2024-07-18'
  | 'gpt-4.1-standard'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-4.5-preview'
  | 'o1'
  | 'o1-pro'
  | 'o1-preview'
  | 'o1-preview-2024-09-12'
  | 'o1-mini'
  | 'o1-mini-2024-09-12'
  | 'o3'
  | 'o3-mini'
  | 'o4-mini'
  | 'gpt-4-turbo'
  | 'gpt-4-turbo-2024-04-09'
  | 'gpt-4-turbo-preview'
  | 'gpt-4-0125-preview'
  | 'gpt-4-1106-preview'
  | 'gpt-4'
  | 'gpt-4-0613'
  | 'gpt-4-0314'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-0125'
  | 'gpt-3.5-turbo-1106'
  | 'gpt-3.5-turbo-0613'
  | 'gpt-3.5-turbo-16k'
  | 'gpt-3.5-turbo-16k-0613'
  | 'gpt-3.5-turbo-0301'
  | 'codex-mini-latest'
  | 'davinci-002'
  | 'babbage-002'
  // Modelos de audio
  | 'gpt-4o-audio-preview'
  | 'gpt-4o-audio-preview-2024-10-01'
  | 'gpt-4o-mini-audio-preview'
  | 'gpt-4o-mini-audio-preview-2024-11-05'
  | 'gpt-4o-realtime-preview'
  | 'gpt-4o-realtime-preview-2024-10-01'
  | 'gpt-4o-mini-realtime-preview'
  | 'gpt-4o-mini-realtime-preview-2024-12-17';

export type StabilityModel = 'stable-diffusion-3.5';
export type FluxModel =
  | 'flux-kontext-pro'
  | 'flux-kontext-max'
  | 'flux-pro'
  | 'flux-pro-1.1'
  | 'flux-pro-1.1-ultra'
  | 'flux-pro-1.0-fill'
  | 'flux-pro-1.0-expand'
  | 'flux-pro-1.0-canny'
  | 'flux-pro-1.0-depth'
  | 'flux-pro-finetuned'
  | 'flux-pro-1.0-depth-finetuned'
  | 'flux-pro-1.0-canny-finetuned'
  | 'flux-pro-1.0-fill-finetuned'
  | 'flux-pro-1.1-ultra-finetuned'
  | 'flux-dev';

// Tipos para la configuración del cuento
export interface StorySettings {
  theme: string;
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
    theme: string;
    targetAge: string;
    literaryStyle: string;
    centralMessage: string;
    additionalDetails: string;
    status: 'draft' | 'done';
  };
}


// --- Wizard Flow State Types ---
export type EtapaEstado = 'no_iniciada' | 'borrador' | 'completado';

export interface EstadoFlujo {
  personajes: {
    estado: EtapaEstado;
    personajesAsignados: number;
  };
  cuento: EtapaEstado;
  diseno: EtapaEstado;
  vistaPrevia: EtapaEstado;
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
