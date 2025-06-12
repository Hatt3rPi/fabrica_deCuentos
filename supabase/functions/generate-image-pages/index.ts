import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { generateWithFlux } from '../_shared/flux.ts';
import { generateWithOpenAI } from '../_shared/openai.ts';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const FILE = 'generate-image-pages';
const STAGE = 'historia';
const ACTIVITY = 'generar_paginas';

async function downloadImage(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to download image');
  return await res.arrayBuffer();
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
    const { story_id, page_id, prompt } = await req.json();
    if (!story_id || !page_id || !prompt) {
      throw new Error('Faltan parámetros');
    }

    userId = await getUserId(req);

    const { data: promptRow } = await supabaseAdmin
      .from('prompts')
      .select('id, endpoint, model')
      .eq('type', 'PROMPT_CUENTO_PAGINA')
      .single();

    const endpoint = promptRow?.endpoint || 'https://api.openai.com/v1/images/generations';
    model = promptRow?.model || 'gpt-image-1';
    promptId = promptRow?.id;

    const payload = { model, prompt, size: '1024x1024', quality: 'high', n: 1 };
    console.log('[generate-image-pages] [REQUEST]', JSON.stringify(payload));

    let url: string;
    if (endpoint.includes('bfl.ai')) {
      url = await generateWithFlux(prompt);
    } else {
      const { url: result } = await generateWithOpenAI({ endpoint, payload });
      url = result;
    }

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
