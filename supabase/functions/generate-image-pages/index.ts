import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { generateWithFlux } from '../_shared/flux.ts';
import { generateWithOpenAI } from '../_shared/openai.ts';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.203.0/encoding/base64.ts';
import { handleCorsPreflightResponse, corsResponse, corsErrorResponse } from '../_shared/cors.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const FILE = 'generate-image-pages';
const STAGE = 'historia';
const ACTIVITY = 'generar_paginas';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 segundos

async function downloadImage(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to download image');
  return await res.arrayBuffer();
}

function arrayBufferToBlob(buffer: ArrayBuffer, type: string = 'image/png'): Blob {
  return new Blob([buffer], { type });
}

async function generateImageWithRetry(
  prompt: string,
  referenceImages: Blob[],
  endpoint: string,
  model: string,
  size: string = '1024x1024',
  quality: string = 'high',
  retries = MAX_RETRIES,
): Promise<{ url: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (endpoint.includes('bfl.ai')) {
        let inputUrl: string | undefined;
        if (referenceImages[0]) {
          const buf = new Uint8Array(await referenceImages[0].arrayBuffer());
          const b64 = base64Encode(buf);
          inputUrl = `data:image/png;base64,${b64}`;
        }
        return { url: await generateWithFlux(prompt, inputUrl) };
      }

      const payload = { model, prompt, size, quality, n: 1 };
      console.log('[generate-image-pages] [REQUEST]', JSON.stringify(payload));

      const supportsFiles = endpoint.includes('/images/edits') ||
        endpoint.includes('/images/variations') ||
        endpoint.includes('/responses');

      if (supportsFiles && referenceImages.length > 0) {
        const { url } = await generateWithOpenAI({
          endpoint,
          payload,
          files: { 'image[]': referenceImages },
        });
        return { url };
      }

      const { url } = await generateWithOpenAI({ endpoint, payload });
      return { url };
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(`Intento ${attempt} fallido, reintentando en ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  throw new Error('Número máximo de reintentos alcanzado');
}

function base64ToBlob(b64: string): Blob {
  const byteString = atob(b64);
  const array = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i);
  }
  return new Blob([array], { type: 'image/png' });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let promptId: string | undefined;
  let userId: string | null = null;
  let model = 'gpt-image-1';
  const start = Date.now();

  try {
    const { story_id, page_id } = await req.json();
    if (!story_id || !page_id) {
      throw new Error('Faltan story_id o page_id');
    }

    userId = await getUserId(req);

    // Obtener texto y prompt base de la página
    const { data: pageRow, error: pageError } = await supabaseAdmin
      .from('story_pages')
      .select('prompt')
      .eq('id', page_id)
      .eq('story_id', story_id)
      .maybeSingle();
    if (pageError || !pageRow) {
      throw new Error('No se encontró la página solicitada');
    }

    const pagePrompt = pageRow.prompt;

    // Obtener estilo y paleta
    const { data: designRow } = await supabaseAdmin
      .from('story_designs')
      .select('visual_style, color_palette')
      .eq('story_id', story_id)
      .maybeSingle();
    const visualStyle = designRow?.visual_style || 'default';
    const colorPalette = designRow?.color_palette || 'colores pasteles vibrantes';

    // Mapear estilo a tipo de prompt
    const STYLE_MAP: Record<string, string> = {
      kawaii: 'PROMPT_ESTILO_KAWAII',
      acuarela: 'PROMPT_ESTILO_ACUARELADIGITAL',
      bordado: 'PROMPT_ESTILO_BORDADO',
      dibujado: 'PROMPT_ESTILO_MANO',
      recortes: 'PROMPT_ESTILO_RECORTES',
      default: 'PROMPT_ESTILO_DEFAULT',
    };

    const stylePromptType = STYLE_MAP[visualStyle] || 'PROMPT_ESTILO_DEFAULT';

    const { data: prompts } = await supabaseAdmin
      .from('prompts')
      .select('id, type, content, endpoint, model, size, quality')
      .in('type', ['PROMPT_CUENTO_PAGINAS', stylePromptType]);

    const pagePromptRow = prompts?.find(p => p.type === 'PROMPT_CUENTO_PAGINAS');
    const stylePromptRow = prompts?.find(p => p.type === stylePromptType);

    if (!pagePromptRow) {
      throw new Error('No existe el prompt base para generar páginas');
    }

    const basePrompt = pagePromptRow.content;
    const stylePrompt = stylePromptRow?.content || '';
    const endpoint = pagePromptRow.endpoint || 'https://api.openai.com/v1/images/generations';
    model = pagePromptRow.model || 'gpt-image-1';
    promptId = pagePromptRow.id;

    const prompt = basePrompt
      .replace('{estilo}', stylePrompt)
      .replace('{paleta}', colorPalette || 'colores pasteles vibrantes')
      .replace('{historia}', pagePrompt);

    console.log('[generate-image-pages] prompt:', prompt);

    // Obtener miniaturas de personajes relacionados
    const { data: characterRows } = await supabaseAdmin
      .from('story_characters')
      .select('characters(thumbnail_url)')
      .eq('story_id', story_id);

    let referenceImages: Blob[] = [];
    if (characterRows && characterRows.length > 0) {
      const urls = characterRows
        .map((r: any) => r.characters?.thumbnail_url)
        .filter((u: string | null) => u && typeof u === 'string');

      const downloadPromises = urls.map(async (url: string) => {
        try {
          const urlObj = new URL(url);
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
          return data ?? null;
        } catch (err) {
          console.error('No se pudo descargar', err);
          return null;
        }
      });
      const results = await Promise.all(downloadPromises);
      referenceImages = results.filter((b): b is Blob => b !== null);
    }

    const size = pagePromptRow.size || '1024x1024';
    const quality = pagePromptRow.quality || 'high';
    
    const { url } = await generateImageWithRetry(prompt, referenceImages, endpoint, model, size, quality);

    let blob: Blob;
    if (url.startsWith('data:')) {
      blob = base64ToBlob(url.split(',')[1]);
    } else {
      const buf = await downloadImage(url);
      blob = new Blob([buf], { type: 'image/png' });
    }

    const path = `story-images/${story_id}/${page_id}.png`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('storage')
      .upload(path, blob, { contentType: 'image/png', upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('storage')
      .getPublicUrl(path);

    await supabaseAdmin
      .from('story_pages')
      .update({ image_url: publicUrl, prompt })
      .eq('id', page_id);

    const elapsed = Date.now() - start;
    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: model,
      tiempo_respuesta_ms: elapsed,
      estado: 'success',
      error_type: null,
      tokens_entrada: 0,
      tokens_salida: 0,
      usuario_id: userId,
      actividad: ACTIVITY,
      edge_function: FILE,
    });

    return new Response(
      JSON.stringify({ imageUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en generate-image-pages:', error);
    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: model,
      tiempo_respuesta_ms: Date.now() - start,
      estado: 'error',
      error_type: 'service_error',
      tokens_entrada: 0,
      tokens_salida: 0,
      usuario_id: userId,
      metadatos: { error: (error as Error).message },
      actividad: ACTIVITY,
      edge_function: FILE,
    });
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
