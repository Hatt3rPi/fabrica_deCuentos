export type Etapa =
  | 'personajes'
  | 'cuento_fase1'
  | 'cuento_fase1_multi'
  | 'cuento_fase2'
  | 'cuento_fase2_multi'
  | 'vista_previa'
  | 'vista_previa_multi';
  {
    id: 'story_generating_multi',
    text: 'Tejiendo la trama de {personajes}...',
    etapa: ['cuento_fase1_multi']
  },
  {
    id: 'story_characters_multi',
    text: 'Haciendo que {personajes} cobren protagonismo...',
    etapa: ['cuento_fase1_multi']
  },
  {
    id: 'cover_creating_multi',
    text: 'Ilustrando la portada para {personajes}...',
    etapa: ['cuento_fase2_multi']
  },
  {
    id: 'cover_finishing_multi',
    text: 'Afinando detalles para cada protagonista...',
    etapa: ['cuento_fase2_multi']
  },
  },
  {
    id: 'preview_loading_multi',
    text: 'Preparando la vista previa de la historia de {personajes}...',
    etapa: ['vista_previa_multi']
export function formatNames(names: string[]): string {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

export function getLoaderMessages(etapa: Etapa, context: Record<string, any> = {}): string[] {
      let msg = m.text;
      for (const [key, value] of Object.entries(context)) {
        let val = value;
        if (key === 'personajes' && Array.isArray(value)) {
          val = formatNames(value);
        }
        msg = msg.replace(`{${key}}`, String(val));
      }
      return msg;
export type Etapa = 
  | 'personajes' 
  | 'cuento_fase1' | 'cuento_fase1_multi'
  | 'cuento_fase2' | 'cuento_fase2_multi'
  | 'vista_previa' | 'vista_previa_multi';

export interface LoaderMessage {
  /** Identificador único del mensaje */
  id: string;
  
  /** 
   * Texto del mensaje que puede contener placeholders como {personaje}, {current}, {total}
   * Ejemplo: "Creando personaje {current} de {total}: {personaje}"
   */
  text: string;
  
  /** 
   * Etapas donde este mensaje puede aparecer.
   * Usar la variante _multi para mensajes específicos de múltiples personajes
   */
  etapa: Etapa[];
  
  /** 
   * Indica si este mensaje es específico para múltiples personajes
   * @default false
   */
  multi?: boolean;
}

const loaderMessages: LoaderMessage[] = [
  {
    id: 'a.1',
    text: 'Encontrando la chispa creativa...',
    etapa: ['personajes']
  },
  {
    id: 'a.2',
    text: 'Bosquejando rostros y personalidades..',
    etapa: ['personajes']
  },
  {
    id: 'a.3',
    text: 'Invitando a {personaje} a ser parte de algo único...',
    etapa: ['personajes']
  },
  {
    id: 'a.4',
    text: 'Dando vida a {personaje} con magia digital... ✨',
    etapa: ['personajes']
  },
  {
    id: 'b.1',
    text: 'Invitando a {personaje} a protagonizar esta aventura…',
    etapa: ['cuento_fase1']
  },
  {
    id: 'b.2',
    text: 'Haciendo que {personaje} cobre protagonismo...',
    etapa: ['cuento_fase1']
  },
  {
    id: 'b.3',
    text: 'Enseñando a {personaje} como actuar en escena…',
    etapa: ['cuento_fase1']
  },
  {
    id: 'b.4',
    text: 'Ilustrando la portada mágica...',
    etapa: ['cuento_fase2']
  },
  {
    id: 'b.5',
    text: 'Aplicando los últimos toques artísticos...',
    etapa: ['cuento_fase2']
  },
  {
    id: 'b.6',
    text: 'Preparando la vista previa de tu cuento...',
    etapa: ['vista_previa']
  },
  {
    id: 'b.1_multi',
    text: 'Invitando a {personaje} a protagonizar esta aventura…',
    etapa: ['cuento_fase1_multi']
  },
  {
    id: 'b.2_multi',
    text: 'Haciendo que {personaje} cobren protagonismo...',
    etapa: ['cuento_fase1_multi']
  },
  {
    id: 'b.3_multi',
    text: 'Enseñando a {personaje} como actuar en escena…',
    etapa: ['cuento_fase1_multi']
  },
  {
    id: 'b.4_multi',
    text: 'Ilustrando la portada mágica...',
    etapa: ['cuento_fase2_multi']
  },
  {
    id: 'b.5_multi',
    text: 'Aplicando los últimos toques artísticos...',
    etapa: ['cuento_fase2_multi']
  },
  {
    id: 'b.6_multi',
    text: 'Preparando la vista previa de tu cuento...',
    etapa: ['vista_previa_multi']
  }
];

/**
 * Obtiene los mensajes de carga para una etapa específica
 * 
 * @param etapa - Etapa actual del flujo (usar variante _multi para múltiples personajes)
 * @param context - Objeto con variables para interpolar en los mensajes
 * @param isMulti - Indica si se deben incluir mensajes para múltiples personajes
 * @returns Array de mensajes formateados
 * 
 * @example
 * // Para un solo personaje
 * getLoaderMessages('personajes', { personaje: 'Luna' });
 * 
 * // Para múltiples personajes
 * getLoaderMessages('personajes_multi', { 
 *   personaje: 'Luna',
 *   current: 1,
 *   total: 3
 * });
 */
export function getLoaderMessages(
  etapa: Etapa, 
  context: Record<string, string | number> = {},
  isMulti: boolean = etapa.endsWith('_multi')
): string[] {
  // Determinar la etapa base (sin sufijo _multi)
  const baseEtapa = etapa.replace(/_multi$/, '') as Etapa;
  
  // Filtrar mensajes para la etapa actual
  return loaderMessages
    .filter(m => {
      // Incluir mensajes específicos para multi o estándar según corresponda
      const isForMulti = m.etapa.some(e => e.endsWith('_multi'));
      return (isMulti ? isForMulti : !isForMulti) && 
             m.etapa.some(e => e.replace(/_multi$/, '') === baseEtapa);
    })
    .map(m => {
      // Aplicar las variables del contexto al texto del mensaje
      return Object.entries(context).reduce(
        (msg, [key, value]) => msg.replace(new RegExp(`{${key}}`, 'g'), String(value)),
        m.text
      );
    });
}

export default loaderMessages;
