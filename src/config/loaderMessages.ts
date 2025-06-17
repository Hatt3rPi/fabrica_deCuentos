/**
 * Tipos de etapas del flujo de creación
 * 
 * Para soportar múltiples personajes, se pueden agregar variantes con sufijo _multi
 * Ejemplo: 'personajes_multi' para manejar múltiples personajes
 */
export type Etapa = 
  | 'personajes' 
  | 'cuento_fase1' | 'cuento_fase1_multi'
  | 'cuento_fase2' | 'cuento_fase2_multi'
  | 'vista_previa' | 'vista_previa_multi' | 'vista_previa_parallel';

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
  },
  // New parallel generation messages
  {
    id: 'c.1_parallel',
    text: 'Generando todas las páginas en paralelo... ⚡',
    etapa: ['vista_previa_parallel']
  },
  {
    id: 'c.2_parallel',
    text: 'Progreso: {current} de {total} páginas completadas',
    etapa: ['vista_previa_parallel']
  },
  {
    id: 'c.3_parallel',
    text: 'Aplicando el estilo {estilo} a cada página...',
    etapa: ['vista_previa_parallel']
  },
  {
    id: 'c.4_parallel',
    text: 'Cada página está cobrando vida simultáneamente... ✨',
    etapa: ['vista_previa_parallel']
  },
  {
    id: 'c.5_parallel',
    text: 'Optimizando tiempos con generación inteligente...',
    etapa: ['vista_previa_parallel']
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
