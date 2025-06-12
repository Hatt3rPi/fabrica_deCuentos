export const promptEdgeMap: Record<string, string[]> = {
  PROMPT_DESCRIPCION_PERSONAJE: ['analyze-character'],
  PROMPT_GENERADOR_CUENTOS: ['generate-story'],
  PROMPT_CUENTO_PORTADA: ['generate-story', 'generate-cover'],
  PROMPT_CUENTO_PAGINA: ['generate-image-pages'],
  PROMPT_CREAR_MINIATURA_PERSONAJE: ['describe-and-sketch'],
  PROMPT_ESTILO_KAWAII: ['generate-cover-variant', 'generate-thumbnail-variant'],
  PROMPT_ESTILO_ACUARELADIGITAL: ['generate-cover-variant', 'generate-thumbnail-variant'],
  PROMPT_ESTILO_BORDADO: ['generate-cover-variant', 'generate-thumbnail-variant'],
  PROMPT_ESTILO_MANO: ['generate-cover-variant', 'generate-thumbnail-variant'],
  PROMPT_ESTILO_RECORTES: ['generate-cover-variant', 'generate-thumbnail-variant'],
  PROMPT_VARIANTE_TRASERA: ['generate-thumbnail-variant'],
  PROMPT_VARIANTE_LATERAL: ['generate-thumbnail-variant'],
};
export const edgeFunctionList = Array.from(new Set(Object.values(promptEdgeMap).flat()));
