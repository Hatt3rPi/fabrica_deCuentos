export interface PromptMetadata {
  endpoint: string;
  model: string;
}

export const promptMetadata: Record<string, PromptMetadata> = {
  PROMPT_DESCRIPCION_PERSONAJE: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o'
  },
  PROMPT_GENERADOR_CUENTOS: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o'
  },
  PROMPT_CUENTO_PORTADA: {
    endpoint: 'https://api.openai.com/v1/images/generations',
    model: 'gpt-image-1'
  },
  PROMPT_CREAR_MINIATURA_PERSONAJE: {
    endpoint: 'https://api.openai.com/v1/images/edits',
    model: 'gpt-image-1'
  },
  PROMPT_ESTILO_KAWAII: {
    endpoint: 'https://api.openai.com/v1/images/edits',
    model: 'gpt-image-1'
  },
  PROMPT_ESTILO_ACUARELADIGITAL: {
    endpoint: 'https://api.openai.com/v1/images/edits',
    model: 'gpt-image-1'
  },
  PROMPT_ESTILO_BORDADO: {
    endpoint: 'https://api.openai.com/v1/images/edits',
    model: 'gpt-image-1'
  },
  PROMPT_ESTILO_MANO: {
    endpoint: 'https://api.openai.com/v1/images/edits',
    model: 'gpt-image-1'
  },
  PROMPT_ESTILO_RECORTES: {
    endpoint: 'https://api.openai.com/v1/images/edits',
    model: 'gpt-image-1'
  },
  PROMPT_VARIANTE_TRASERA: {
    endpoint: 'https://api.openai.com/v1/images/edits',
    model: 'gpt-image-1'
  },
  PROMPT_VARIANTE_LATERAL: {
    endpoint: 'https://api.openai.com/v1/images/edits',
    model: 'gpt-image-1'
  }
};
