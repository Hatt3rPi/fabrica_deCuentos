import { ModelType } from '../components/UI/ModelBadge';

export function getModelType(modelId: string): ModelType {
  // Modelos de imagen
  if (modelId.includes('dall-e') || modelId.includes('gpt-image') || 
      modelId.includes('stable-diffusion') || modelId.includes('flux')) {
    return 'image';
  }
  
  // Modelos de audio
  if (modelId.includes('audio') || modelId.includes('realtime')) {
    return 'audio';
  }
  
  // Modelos legacy
  if (modelId.includes('davinci') || modelId.includes('babbage') || 
      modelId.includes('curie') || modelId.includes('ada') ||
      modelId.includes('codex')) {
    return 'legacy';
  }
  
  // Por defecto, asumimos que es texto
  return 'text';
}

export function isCompatibleModel(modelId: string, promptType: string): boolean {
  const modelType = getModelType(modelId);
  
  // Para prompts de imagen, solo permitir modelos de imagen
  if (
    promptType === 'PROMPT_CUENTO_PORTADA' ||
    promptType === 'PROMPT_CUENTO_PAGINA' ||
    promptType === 'PROMPT_CREAR_MINIATURA_PERSONAJE' ||
    promptType.startsWith('PROMPT_ESTILO_') ||
    promptType.startsWith('PROMPT_VARIANTE_')
  ) {
    return modelType === 'image';
  }
  
  // Para prompts de texto, permitir modelos de texto y legacy
  if (promptType === 'PROMPT_GENERADOR_CUENTOS' || promptType === 'PROMPT_ANALISIS_PERSONAJE') {
    return modelType === 'text' || modelType === 'legacy';
  }
  
  // Por defecto, permitir todos los modelos
  return true;
}
