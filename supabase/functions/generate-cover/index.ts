import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';
import { startInflightCall, endInflightCall } from '../_shared/inflight.ts';
import { isActivityEnabled } from '../_shared/stages.ts';
import { generateWithFlux } from '../_shared/flux.ts';
import { generateWithOpenAI } from '../_shared/openai.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.203.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const FILE = 'generate-cover';
const STAGE = 'historia';
const ACTIVITY = 'generar_portada';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 segundos entre reintentos

async function downloadImage(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

// Función para convertir ArrayBuffer a Blob
function arrayBufferToBlob(buffer: ArrayBuffer, type: string = 'image/png'): Blob {
  return new Blob([buffer], { type });
}

interface CharacterWithImage {
  name: string;
  blob: Blob;
}

/**
 * Genera una portada con múltiples personajes usando una estrategia mejorada
 * que intenta maximizar la consistencia visual
 */
async function generateCoverWithCharacters(
  basePrompt: string,
  characters: CharacterWithImage[],
  endpoint: string,
  model: string,
  size: string,
  quality: string,
): Promise<{ url: string }> {
  // Si no hay personajes, generar sin referencias
  if (characters.length === 0) {
    return generateImageWithRetry(basePrompt, [], endpoint, model, size, quality);
  }

  // Si el endpoint soporta múltiples imágenes con gpt-image-1
  if (endpoint.includes('/images/edits') && model === 'gpt-image-1') {
    // gpt-image-1 soporta hasta 16 imágenes
    const imagesToUse = characters.slice(0, 16); // Limitar a 16 imágenes máximo
    
    // Enriquecer el prompt con información detallada sobre cada personaje
    const characterDescriptions = imagesToUse.map((char, idx) => 
      `- Imagen ${idx + 1} corresponde al personaje "${char.name}"`
    ).join('. ');
    
    const enrichedPrompt = `# CONTEXTO DE PERSONAJES PRINCIPALES: \n ${characterDescriptions}. \n\n # PORTADA A GENERAR: ${basePrompt}\n\n**IMPORTANTE**: Si la portada incluye personajes, usa sus imágenes de referencia correspondientes para mantener consistencia visual. Las imágenes están ordenadas alfabéticamente por nombre de personaje.`;
    
    console.log('[generate-cover] Usando gpt-image-1 con múltiples imágenes de personajes');
    console.log('[generate-cover] Personajes incluidos:', imagesToUse.map(c => c.name));
    console.log('[generate-cover] Prompt enriquecido:', enrichedPrompt);
    
    // gpt-image-1 soporta múltiples imágenes
    const blobs = imagesToUse.map(c => c.blob);
    return generateImageWithRetry(enrichedPrompt, blobs, endpoint, model, size, quality);
  }
  
  // Para dall-e-2 (solo soporta una imagen)
  if (endpoint.includes('/images/edits') && model === 'dall-e-2' && characters.length > 0) {
    console.log('[generate-cover] Usando dall-e-2 (limitado a una imagen)');
    const characterInfo = `El personaje principal es "${characters[0].name}". `;
    const enrichedPrompt = characterInfo + basePrompt;
    return generateImageWithRetry(enrichedPrompt, [characters[0].blob], endpoint, model, size, quality);
  }

  // Para otros endpoints o casos
  const blobs = characters.map(c => c.blob);
  return generateImageWithRetry(basePrompt, blobs, endpoint, model, size, quality);
}

async function generateImageWithRetry(
  prompt: string,
  referenceImages: Blob[],
  endpoint: string,
  model: string,
  size: string = '1024x1024',
  quality: string = 'standard',
  retries = MAX_RETRIES
): Promise<{ url: string }> {

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      
      // Si no hay imágenes, usar generación estándar
      if (endpoint.includes('bfl.ai')) {
        let inputUrl: string | undefined;
        if (referenceImages[0]) {
          const buf = new Uint8Array(await referenceImages[0].arrayBuffer());
          const b64 = base64Encode(buf);
          inputUrl = `data:image/png;base64,${b64}`;
        }
        return { url: await generateWithFlux(prompt, inputUrl) };
      } else if (referenceImages.length === 0 && model !== 'gpt-image-1') {
        const payload = { model, prompt, size, quality, n: 1 };
        console.log('[generate-cover] [REQUEST]', JSON.stringify(payload));
        const { url } = await generateWithOpenAI({
          endpoint,
          payload,
        });
        return { url };
      } else {
        // Para gpt-image-1, podemos enviar múltiples imágenes de referencia
        // Deben enviarse usando el parámetro image[]
        const payload = { model, prompt, size, quality, n: 1 };
        console.log('[generate-cover] [REQUEST]', JSON.stringify(payload));
        const { url } = await generateWithOpenAI({
          endpoint,
          payload,
          files: { 'image[]': referenceImages },
        });
        return { url };
      }
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(`Intento ${attempt} fallido, reintentando en ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  
  throw new Error('Número máximo de reintentos alcanzado');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let promptId: string | undefined;
  let userId: string | null = null;
  let apiModel = '';
  const startTime = Date.now();

  try {
    const { story_id, visual_style, color_palette, reference_image_ids } = await req.json();
    if (!story_id) {
      throw new Error('Falta story_id');
    }

    // Obtener información de la página de portada
    const { data: coverRow } = await supabaseAdmin
      .from('story_pages')
      .select('text, prompt')
      .eq('story_id', story_id)
      .eq('page_number', 0)
      .maybeSingle();

    let title: string;
    let coverPrompt: string;

    if (!coverRow) {
      const { data: story, error: storyError } = await supabaseAdmin
        .from('stories')
        .select('title')
        .eq('id', story_id)
        .single();

      if (storyError || !story) {
        throw new Error('No se encontró la información de la portada');
      }

      title = story.title;
      coverPrompt = story.title;

      await supabaseAdmin.from('story_pages').insert({
        story_id,
        page_number: 0,
        text: title,
        image_url: '',
        prompt: coverPrompt,
      });
    } else {
      title = coverRow.text;
      coverPrompt = coverRow.prompt || coverRow.text;
    }

    userId = await getUserId(req);
    const enabled = await isActivityEnabled(STAGE, ACTIVITY);
    if (!enabled) {
      return new Response(
        JSON.stringify({ error: 'Actividad deshabilitada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el prompt
    const { data: promptRow } = await supabaseAdmin
      .from('prompts')
      .select('id, content, endpoint, model, size, quality, width, height')
      .eq('type', 'PROMPT_CUENTO_PORTADA')
      .single();
      
    const basePrompt = promptRow?.content || '';
    const apiEndpoint = promptRow?.endpoint || 'https://api.openai.com/v1/images/generations';
    apiModel = promptRow?.model || 'gpt-image-1';
    promptId = promptRow?.id;
    if (!basePrompt) throw new Error('No se encontró el prompt');

    await startInflightCall({
      user_id: userId,
      etapa: STAGE,
      actividad: ACTIVITY,
      modelo: apiModel,
      input: { story_id, visual_style, color_palette, reference_image_ids }
    });

    const prompt = basePrompt
      .replace('{estilo}', visual_style || 'acuarela digital')
      .replace('{paleta}', color_palette || 'colores vibrantes')
      .replace('{historia}', coverPrompt);
      
    // Registrar el prompt generado
    console.log('=== PROMPT GENERADO ===');
    console.log(`Story ID: ${story_id}`);
    console.log(`Título: ${title}`);
    console.log(`Prompt de portada: ${coverPrompt}`);
    console.log(`Estilo visual: ${visual_style || 'No especificado'}`);
    console.log(`Paleta de colores: ${color_palette || 'No especificada'}`);
    console.log('--- Prompt final ---');
    console.log(prompt);
    console.log('=====================');

    // Obtener personajes con sus nombres y miniaturas para la portada
    const { data: characterRows } = await supabaseAdmin
      .from('story_characters')
      .select('characters(name, thumbnail_url)')
      .eq('story_id', story_id);

    let referenceImages: Blob[] = [];
    let charactersWithImages: CharacterWithImage[] = [];
    
    if (characterRows && characterRows.length > 0) {
      console.log(`Encontrados ${characterRows.length} personajes para la portada`);
      
      // Filtrar personajes válidos con nombre y thumbnail
      const validCharacters = characterRows
        .filter((r: any) => r.characters?.name && r.characters?.thumbnail_url)
        .map((r: any) => ({
          name: r.characters.name,
          url: r.characters.thumbnail_url
        }));

      // Ordenar personajes para mantener consistencia
      validCharacters.sort((a, b) => a.name.localeCompare(b.name));
      
      if (validCharacters.length > 0) {
        try {
          const downloadPromises = validCharacters.map(async (char) => {
            try {
              console.log(`Procesando personaje: ${char.name} desde ${char.url}`);
              
              const urlObj = new URL(char.url);
              const pathParts = urlObj.pathname.split('/').filter(Boolean);
              const storageIndex = pathParts.indexOf('storage');
              if (
                storageIndex === -1 ||
                pathParts[storageIndex + 1] !== 'v1' ||
                pathParts[storageIndex + 2] !== 'object' ||
                pathParts[storageIndex + 3] !== 'public'
              ) {
                throw new Error('Formato de URL no válido');
              }
              const bucket = pathParts[storageIndex + 4];
              const filePath = pathParts.slice(storageIndex + 5).join('/');
              const { data } = await supabaseAdmin.storage
                .from(bucket)
                .download(filePath);
              return { blob: data, name: char.name };
            } catch (err) {
              console.error(`Error al descargar imagen del personaje ${char.name}:`, err);
              return null;
            }
          });
          
          const results = await Promise.all(downloadPromises);
          const validResults = results.filter((r): r is { blob: Blob, name: string } => r !== null && r.blob !== null);
          
          referenceImages = validResults.map(r => r.blob);
          charactersWithImages = validResults.map(r => ({
            name: r.name,
            blob: r.blob
          }));
          
          console.log(`Se procesaron ${charactersWithImages.length} personajes correctamente:`, charactersWithImages.map(c => c.name));
        } catch (error) {
          console.error('Error al procesar personajes para la portada:', error);
          charactersWithImages = [];
          referenceImages = [];
        }
      }
    }

    // Generar portada con personajes si están disponibles
    const configuredSize = promptRow?.size || '1024x1024';
    const configuredQuality = promptRow?.quality || 'standard';
    
    console.log('[generate-cover] prompt base:', prompt);
    console.log('[generate-cover] personajes detectados:', charactersWithImages.map(c => c.name));
    
    // Usar la nueva función que maneja mejor múltiples personajes
    const { url: imageUrl } = await generateCoverWithCharacters(
      prompt,
      charactersWithImages,
      apiEndpoint,
      apiModel,
      configuredSize,
      configuredQuality
    );
    
    // Convertir base64 a Blob
    const base64Data = imageUrl.split(',')[1];
    const byteString = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], { type: 'image/png' });
    
    // Subir a Supabase Storage
    const path = `covers/${story_id}.png`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('storage')
      .upload(path, blob, { contentType: 'image/png', upsert: true });
      
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('storage')
      .getPublicUrl(path);

    // Actualizar base de datos
    try {
      const { data: updatedRows, error: updateError } = await supabaseAdmin
        .from('story_pages')
        .update({ image_url: publicUrl })
        .eq('story_id', story_id)
        .eq('page_number', 0)
        .select();

      if (updateError) {
        throw new Error(`Error al actualizar story_pages: ${updateError.message}`);
      }

      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabaseAdmin
          .from('story_pages')
          .insert({
            story_id,
            page_number: 0,
            text: title,
            image_url: publicUrl,
            prompt: coverPrompt
          });

        if (insertError) {
          throw new Error(`Error al insertar story_pages: ${insertError.message}`);
        }
      }

      console.log('✅ Portada guardada en story_pages correctamente', {
        story_id,
        page_number: 0,
        image_url: publicUrl
      });
    } catch (error) {
      console.error('Error al actualizar story_pages:', error);
      throw new Error(`No se pudo guardar la portada en la base de datos: ${error.message}`);
    }

    // Registrar métricas
    const elapsed = Date.now() - startTime;
    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: apiModel,
      tiempo_respuesta_ms: elapsed,
      estado: 'success',
      error_type: null,
      tokens_entrada: 0,
      tokens_salida: 0,
      usuario_id: userId,
      actividad: 'generar_portada',
      edge_function: 'generate-cover',
    });

    console.log('✅ Portada generada exitosamente', {
      story_id,
      image_url: publicUrl,
      elapsed_time_ms: elapsed,
      reference_images_used: referenceImages.length,
      characters_used: charactersWithImages.map(c => c.name)
    });

    await endInflightCall(userId, ACTIVITY);
    return new Response(
      JSON.stringify({ coverUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en generate-cover:', error);
    
    if (promptId) {
      await logPromptMetric({
        prompt_id: promptId,
        modelo_ia: apiModel,
        tiempo_respuesta_ms: Date.now() - startTime,
        estado: 'error',
        error_type: 'service_error',
        tokens_entrada: 0,
        tokens_salida: 0,
        usuario_id: userId,
        metadatos: { error: (error as Error).message },
        actividad: 'generar_portada',
        edge_function: 'generate-cover',
      });
    }

    await endInflightCall(userId, ACTIVITY);

    return new Response(
      JSON.stringify({
        error: 'Error al generar la portada',
        details: (error as Error).message
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
