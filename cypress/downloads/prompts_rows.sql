INSERT INTO "public"."prompts" ("id", "type", "content", "version", "updated_at", "updated_by", "size", "quality", "width", "height", "endpoint", "model") VALUES ('12722572-1d49-480e-8b6a-21d9143eed83', 'PROMPT_CUENTO_PAGINAS', 'Genera una ilustración para una página específica del cuento basada en el texto proporcionado. La imagen debe complementar perfectamente la narrativa, capturar las emociones del momento, y mantener la coherencia visual con el estilo del cuento.', '1', '2025-07-04 03:23:36.293964+00', null, null, null, null, null, 'https://api.openai.com/v1/images/generations', 'gpt-image-1'), ('1dc7a1c4-74ba-43d7-8577-eb9d1421de3b', 'PROMPT_GENERADOR_MINIATURAS', 'Crea una miniatura/avatar en estilo de ilustración infantil para un personaje de cuento con estas características:

**INFORMACIÓN DEL PERSONAJE:**
- Nombre: {nombre}
- Edad: {edad} años
- Descripción: {descripcion}

**ESTILO VISUAL REQUERIDO:**
- Estilo: Ilustración digital infantil, similar a libros de cuentos
- Técnica: Acuarela digital suave con contornos definidos
- Colores: Paleta vibrante pero suave, apropiada para niños
- Formato: Retrato/busto del personaje
- Fondo: Simple, color sólido o degradado suave

**CARACTERÍSTICAS ESPECÍFICAS:**
- El personaje debe verse amigable y apropiado para cuentos infantiles
- Expresión facial alegre y carismática
- Proporciones ligeramente estilizadas (estilo cartoon suave)
- Detalles que reflejen la personalidad descrita
- Sin elementos violentos o inapropiados

**COMPOSICIÓN:**
- Encuadre: Plano medio (cabeza y hombros)
- Iluminación: Suave y cálida
- Calidad: Alta definición, colores saturados pero armoniosos

Genera una imagen que capture la esencia del personaje y sea perfecta para un cuento infantil personalizado.', '1', '2025-07-04 03:20:37.791422+00', null, '1024x1024', 'standard', '1024', '1024', 'https://api.openai.com/v1/images/generations', 'dall-e-3'), ('2457997a-31d8-4474-8185-1e1f2269bf97', 'PROMPT_ESTILO_ACUARELADIGITAL', 'Aplica un estilo de acuarela digital a la imagen: bordes suaves y difuminados, colores que se mezclan naturalmente, texturas de papel acuarela, transparencias sutiles, y el efecto característico de la pintura al agua con tonos vibrantes pero armoniosos.', '1', '2025-07-04 03:23:03.985785+00', null, null, null, null, null, 'https://api.openai.com/v1/images/edits', 'gpt-image-1'), ('39498cfb-9d20-495c-9cc1-677a784b3969', 'PROMPT_DESCRIPCION_PERSONAJE', 'Analiza la imagen proporcionada y genera una descripción detallada del personaje para un cuento infantil, incluyendo características físicas, personalidad aparente, y sugerencias para el desarrollo del personaje en una historia.', '1', '2025-07-04 03:23:03.985785+00', null, null, null, null, null, 'https://api.openai.com/v1/chat/completions', 'gpt-4o'), ('4b07a8ca-c0b2-420b-95ba-f74eaeb29e5c', 'PROMPT_VARIANTE_TRASERA', 'Genera una vista trasera del personaje manteniendo todas sus características principales: cabello, vestimenta, accesorios, pero desde la perspectiva posterior. Conserva el estilo artístico y la paleta de colores de la imagen original.', '1', '2025-07-04 03:23:22.507644+00', null, null, null, null, null, 'https://api.openai.com/v1/images/edits', 'gpt-image-1'), ('4ba93020-7446-4940-9a6b-177c00fd0d3b', 'PROMPT_ESTILO_KAWAII', 'Transforma la imagen aplicando un estilo kawaii (japonés lindo) con características exageradas de ternura: ojos grandes, mejillas sonrosadas, expresiones dulces, colores pastel suaves, y elementos decorativos tiernos como estrellitas o corazones.', '1', '2025-07-04 03:23:03.985785+00', null, null, null, null, null, 'https://api.openai.com/v1/images/edits', 'gpt-image-1'), ('536d24ec-74e2-4da6-8c35-7db7395bffff', 'PROMPT_CUENTO_USUARIO', 'Crea un cuento personalizado basado en las preferencias del usuario, incorporando los personajes seleccionados y la temática elegida. El cuento debe ser apropiado para la edad especificada y seguir una estructura narrativa completa y satisfactoria.', '1', '2025-07-04 03:23:36.293964+00', null, null, null, null, null, 'https://api.openai.com/v1/chat/completions', 'o3'), ('55cf64e6-8cdf-4082-9375-0f6f2be4f868', 'PROMPT_GENERADOR_CUENTOS', 'Eres un experto escritor de cuentos infantiles. Tu tarea es crear un cuento personalizado, cautivador y apropiado para niños, siguiendo estos parámetros específicos:

**PERSONAJES PRINCIPALES:**
{personajes}

**TEMÁTICA/HISTORIA:**
{historia}

**REQUISITOS DEL CUENTO:**
- Debe tener exactamente 8 párrafos (numerados del 1 al 8)
- Cada párrafo debe tener entre 80-120 palabras
- El lenguaje debe ser apropiado para niños de 3-10 años
- Incluir valores positivos como amistad, valentía, bondad, etc.
- El cuento debe ser coherente y tener un arco narrativo completo
- Evitar contenido violento, aterrador o inapropiado

**FORMATO DE RESPUESTA (JSON):**
Debes responder ÚNICAMENTE en formato JSON válido con esta estructura exacta:

{
  "titulo": "Título atractivo del cuento",
  "paginas": {
    "1": {
      "texto": "Primer párrafo de 80-120 palabras...",
      "prompt": "Descripción visual detallada de la escena para generar una imagen"
    },
    "2": {
      "texto": "Segundo párrafo de 80-120 palabras...",
      "prompt": "Descripción visual detallada de la escena para generar una imagen"
    }
  },
  "portada": {
    "prompt": "Descripción visual detallada para la portada del cuento"
  },
  "loader": [
    "Mensaje motivacional 1",
    "Mensaje motivacional 2", 
    "Mensaje motivacional 3"
  ]
}

**IMPORTANTE:** 
- NO incluyas explicaciones adicionales fuera del JSON
- Asegúrate de que el JSON esté perfectamente formateado
- Todos los textos deben estar en español', '1', '2025-07-04 03:20:22.651447+00', null, null, null, null, null, 'https://api.openai.com/v1/chat/completions', 'gpt-4o'), ('5d9954db-6d1c-4f15-99af-2bd441e7561f', 'PROMPT_VARIACIONES_PORTADAS', 'Crea una variación artística de esta portada de cuento infantil:

**IMAGEN DE REFERENCIA:**
{imagen_original}

**INSTRUCCIONES PARA LA VARIACIÓN:**
- Mantener la composición general y personajes principales
- Cambiar el estilo artístico: {estilo}
- Ajustar la paleta de colores: {paleta}
- Conservar la esencia y el mensaje visual del original
- Mantener el nivel de detalle apropiado para niños

**ESTILOS DISPONIBLES:**
- acuarela_vibrante: Acuarelas con colores intensos y fluidos
- digital_suave: Ilustración digital con bordes suaves
- cartoon_clasico: Estilo animación tradicional
- mixed_media: Combinación de técnicas digitales

**PALETAS DE COLORES:**
- colores_calidos: Rojos, naranjas, amarillos, rosas
- colores_frios: Azules, verdes, púrpuras, turquesas  
- tierra_natural: Marrones, verdes naturales, beiges
- fantasia_magica: Púrpuras, dorados, plateados, cristales

**REQUISITOS:**
- Mantener la temática infantil y apropiada
- Preservar la identidad de los personajes principales
- Ajustar solo el estilo y colores, no el contenido narrativo
- Calidad profesional de ilustración para libro infantil

Crea una hermosa variación que ofrezca una nueva perspectiva visual manteniendo la magia del cuento original.', '1', '2025-07-04 03:21:08.621993+00', null, '1024x1024', 'standard', '1024', '1024', 'https://api.openai.com/v1/images/generations', 'dall-e-3'), ('6edb7bea-31fb-4fc1-ba8f-99eab3b2ee3b', 'SCRIPT_ENTORNO_CODEX', 'Script de configuración del entorno de desarrollo para Codex y herramientas de IA integradas en La Cuentería.', '1', '2025-07-04 03:23:36.293964+00', null, null, null, null, null, null, null), ('6f853c4a-c4f5-472d-a732-abb4cc165ea1', 'PROMPT_ESTILO_MANO', 'Aplica un estilo de dibujo hecho a mano: líneas expresivas y ligeramente irregulares, sombreado a lápiz o carbón, texturas de papel, trazos visibles que muestren la técnica manual, y la calidez característica del arte hecho a mano.', '1', '2025-07-04 03:23:22.507644+00', null, null, null, null, null, 'https://api.openai.com/v1/images/edits', 'gpt-image-1'), ('737f1236-0b66-4cc2-9fb9-d9b37a8e6f5f', 'PROMPT_ESTILO_RECORTES', 'Transforma la imagen en estilo collage de recortes: elementos que parecen cortados de revistas o papeles de colores, bordes irregulares de tijera, superposiciones de texturas de papel, y la estética vintage del arte de recortes y collage.', '1', '2025-07-04 03:23:22.507644+00', null, null, null, null, null, 'https://api.openai.com/v1/images/edits', 'gpt-image-1'), ('a927dd39-a7cd-4a1f-8ff7-d5f8a370ab3c', 'PROMPT_CREAR_MINIATURA_PERSONAJE', 'Crea una miniatura estilo avatar del personaje basada en la imagen de referencia proporcionada. Mantén las características principales pero adapta el estilo para ser apropiado como avatar de cuento infantil.', '1', '2025-07-04 03:23:03.985785+00', null, null, null, null, null, 'https://api.openai.com/v1/images/edits', 'gpt-image-1'), ('aae8cfaf-b2c9-4fc1-9c44-f432cf8bbaf2', 'PROMPT_ESTILO_DEFAULT', 'Aplica el estilo por defecto de La Cuentería: ilustración digital infantil con colores vibrantes pero suaves, contornos definidos pero amigables, estilo cartoon apropiado para niños, y la calidez característica de los cuentos infantiles.', '1', '2025-07-04 03:23:22.507644+00', null, null, null, null, null, 'https://api.openai.com/v1/images/edits', 'gpt-image-1'), ('c3ed47ee-c920-424b-80ca-cab28572fa2d', 'PROMPT_ESTILO_BORDADO', 'Transforma la imagen para que parezca un bordado hecho a mano: líneas de hilo visibles, texturas de tela, patrones de puntadas decorativas, colores típicos de hilos de bordar, y el aspecto artesanal característico del bordado tradicional.', '1', '2025-07-04 03:23:03.985785+00', null, null, null, null, null, 'https://api.openai.com/v1/images/edits', 'gpt-image-1'), ('c80c82d0-6406-450f-8150-0146639f5c72', 'SCRIPT_ENTORNO_CODEX_SUPABASE', 'Script de configuración de la integración entre Codex y Supabase para funciones de IA y base de datos en tiempo real.', '1', '2025-07-04 03:23:36.293964+00', null, null, null, null, null, null, null), ('e14aa22f-f20c-4f97-a649-bb3b4c4bc094', 'PROMPT_CUENTO_PORTADA', 'Crea una portada cautivadora para un cuento infantil personalizado:

**INFORMACIÓN DEL CUENTO:**
- Título: {story}
- Estilo visual: {style}
- Paleta de colores: {palette}

**ELEMENTOS REQUERIDOS:**
- Composición central enfocada en la acción principal del cuento
- Personajes principales en poses dinámicas y expresivas
- Ambiente que refleje el mundo y la atmósfera del cuento
- Elementos visuales que sugieran aventura y magia

**ESTILO ARTÍSTICO:**
- Técnica: Ilustración digital de alta calidad
- Enfoque: Estilo libro de cuentos profesional
- Iluminación: Cálida y acogedora, que invite a la lectura
- Detalles: Ricos pero no abrumadores para niños

**COMPOSICIÓN:**
- Formato: Rectangular vertical (proporción libro)
- Espacios: Dejar área superior para título
- Profundidad: Múltiples planos visuales para crear interés
- Balance: Armonioso entre personajes y ambiente

**ATMÓSFERA:**
- Emoción: Alegre, mágica, aventurera
- Edad objetivo: Apropiado para niños de 3-10 años
- Mensaje: Debe transmitir la esencia y tema central del cuento
- Invitación: Debe generar curiosidad y ganas de leer

Crea una portada que capture perfectamente la magia y aventura del cuento, siendo irresistible para niños y padres.', '3', '2025-07-04 19:31:40.976988+00', null, '1536x1024', 'high', '1024', '1024', 'https://api.openai.com/v1/images/edits', 'gpt-image-1'), ('e4f8c3b2-db8e-433e-acc5-0d5b6f7ff7e1', 'PROMPT_GENERADOR_IMAGENES', 'Genera una ilustración para una página específica de cuento infantil:

**DESCRIPCIÓN DE LA ESCENA:**
{prompt_pagina}

**ESTILO VISUAL REQUERIDO:**
- Técnica: Ilustración digital infantil de alta calidad
- Estilo: Acuarela digital con contornos suaves
- Colores: Paleta vibrante y alegre, apropiada para niños
- Composición: Balanced y visualmente atractiva

**PERSONAJES:**
- Mantener consistencia con las descripciones del cuento
- Expresiones claras y emotivas apropiadas para la escena
- Proporciones amigables estilo cartoon suave
- Vestimenta y características coherentes con el personaje

**AMBIENTE Y FONDO:**
- Escenario detallado que apoye la narrativa
- Elementos que enriquezcan la historia visual
- Perspectiva apropiada para la escena
- Iluminación que refuerce el mood de la página

**REQUISITOS TÉCNICOS:**
- Resolución: Alta calidad para impresión
- Formato: Horizontal o cuadrado según la escena
- Detalles: Suficientes para mantener interés pero no abrumar
- Edad objetivo: Apropiado para niños de 3-10 años

**COHERENCIA NARRATIVA:**
- La imagen debe complementar perfectamente el texto
- Capturar el momento específico descrito en la página
- Mantener continuidad visual con otras páginas del cuento
- Transmitir las emociones y acciones del momento narrativo

Crea una ilustración que haga cobrar vida la página del cuento de manera mágica y apropiada para el público infantil.', '1', '2025-07-04 03:21:24.502632+00', null, '1024x1024', 'standard', '1024', '1024', 'https://api.openai.com/v1/images/generations', 'dall-e-3'), ('e9a65f2e-fada-4f7b-ba09-ae5b69ccacfe', 'PROMPT_VARIANTE_LATERAL', 'Crea una vista de perfil lateral del personaje preservando todas sus características distintivas: rasgos faciales, peinado, ropa, y accesorios. Mantén la coherencia con el estilo artístico y colores de la imagen de referencia.', '1', '2025-07-04 03:23:22.507644+00', null, null, null, null, null, 'https://api.openai.com/v1/images/edits', 'gpt-image-1');