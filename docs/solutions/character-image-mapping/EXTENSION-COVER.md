# Extensión de Solución: generate-cover

## Contexto
Después de implementar la solución para `generate-image-pages`, se identificó que `generate-cover` tenía el mismo problema de asignación de imágenes de referencia a personajes.

## Problema en generate-cover
- **storyService.ts** obtiene URLs de thumbnails de personajes y las envía como `reference_image_ids`
- **generate-cover** recibe estas URLs pero no los nombres de los personajes
- Sin nombres, no puede hacer asociación explícita imagen-personaje en el prompt

## Solución Implementada

### 1. Nueva función especializada
```typescript
async function generateCoverWithCharacters(
  basePrompt: string,
  characters: CharacterWithImage[],
  endpoint: string,
  model: string,
  size: string,
  quality: string,
): Promise<{ url: string }>
```

### 2. Obtención mejorada de personajes
Cambió de recibir `reference_image_ids` a obtener directamente de la base de datos:
```typescript
const { data: characterRows } = await supabaseAdmin
  .from('story_characters')
  .select('characters(name, thumbnail_url)')
  .eq('story_id', story_id);
```

### 3. Prompt enriquecido para portadas
```typescript
const enrichedPrompt = `CONTEXTO DE PERSONAJES PRINCIPALES: ${characterDescriptions}. 

PORTADA A GENERAR: ${basePrompt}

IMPORTANTE: Si la portada incluye personajes, usa sus imágenes de referencia correspondientes para mantener consistencia visual. Las imágenes están ordenadas alfabéticamente por nombre de personaje.`;
```

## Diferencias con generate-image-pages
- **Propósito**: Portadas generalmente incluyen personajes de forma más estilizada
- **Texto del prompt**: Adaptado para contexto de portada vs. escena narrativa
- **Uso opcional**: Los personajes en portadas son opcionales, no siempre necesarios

## Beneficios
1. **Consistencia visual**: Personajes en portada coinciden con el resto del cuento
2. **Mejor experiencia**: Portadas más coherentes con los personajes creados
3. **Flexibilidad**: Funciona tanto con como sin personajes

## Archivos Modificados
- `/supabase/functions/generate-cover/index.ts`

## Testing
Para probar:
1. Crear historia con personajes específicos
2. Generar portada que mencione o incluya personajes
3. Verificar que la portada refleje las características visuales de los personajes
4. Comparar con comportamiento anterior

## Compatibilidad
- Mantiene compatibilidad con el parámetro `reference_image_ids` existente
- Funcionará tanto con llamadas que incluyan URLs como con el nuevo sistema