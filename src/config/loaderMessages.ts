export type Etapa = 'personajes' | 'cuento_fase1' | 'cuento_fase2' | 'vista_previa';

export interface LoaderMessage {
  id: string;
  text: string;
  etapa: Etapa[];
}

const loaderMessages: LoaderMessage[] = [
  {
    id: 'personaje_creando',
    text: 'Dando vida a {personaje} con magia digital... ✨',
    etapa: ['personajes']
  },
  {
    id: 'story_generating',
    text: 'Tejiendo la trama de tu historia...',
    etapa: ['cuento_fase1']
  },
  {
    id: 'story_characters',
    text: 'Haciendo que {personaje} cobre protagonismo...',
    etapa: ['cuento_fase1']
  },
  {
    id: 'cover_creating',
    text: 'Ilustrando la portada mágica...',
    etapa: ['cuento_fase2']
  },
  {
    id: 'cover_finishing',
    text: 'Aplicando los últimos toques artísticos...',
    etapa: ['cuento_fase2']
  },
  {
    id: 'preview_loading',
    text: 'Preparando la vista previa de tu cuento...',
    etapa: ['vista_previa']
  }
];

export function getLoaderMessages(etapa: Etapa, context: Record<string, string> = {}): string[] {
  return loaderMessages
    .filter(m => m.etapa.includes(etapa))
    .map(m => {
      return Object.entries(context).reduce(
        (msg, [key, value]) => msg.replace(`{${key}}`, value),
        m.text
      );
    });
}

export default loaderMessages;
