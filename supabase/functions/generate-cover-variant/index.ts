import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';
import { startInflightCall, endInflightCall } from '../_shared/inflight.ts';
import { isActivityEnabled } from '../_shared/stages.ts';
import { generateWithFlux } from '../_shared/flux.ts';
import { generateWithOpenAI } from '../_shared/openai.ts';

import { configureForEdgeFunction, captureException, setUser, setTags } from '../_shared/sentry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);
const FILE = 'generate-cover-variant';
const STAGE = 'historia';
const ACTIVITY = 'portada_variante';

// Mapeo de estilos a descripciones breves para logging
const STYLE_DESCRIPTIONS: Record<string, string> = {
  'PROMPT_ESTILO_KAWAII': 'Kawaii',
  'PROMPT_ESTILO_ACUARELADIGITAL': 'Acuarela Digital',
  'PROMPT_ESTILO_BORDADO': 'Parche Bordado',
  'PROMPT_ESTILO_MANO': 'Dibujado a Mano',
  'PROMPT_ESTILO_RECORTES': 'Recortes de Papel',
  'PROMPT_ESTILO_DEFAULT': 'Default'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let promptId: string | undefined;
  let userId: string | null = null;
  let apiModel = '';

  try {
    const { imageUrl, promptType, storyId, styleKey } = await req.json();
    if (!imageUrl || !promptType || !storyId || !styleKey) {
      throw new Error('Missing imageUrl, promptType, storyId or styleKey');
    }

    const { data: promptRow } = await supabaseAdmin
      .from('prompts')
      .select('id, content, endpoint, model, size, quality, width, height')
      .eq('type', promptType)
      .single();

    const stylePrompt = promptRow?.content || '';
    const apiEndpoint = promptRow?.endpoint || 'https://api.openai.com/v1/images/edits';
    apiModel = promptRow?.model || 'gpt-image-1';
    promptId = promptRow?.id;
    if (!stylePrompt) {
      throw new Error('Prompt not found');
    }

    // Crear prompt enriquecido con formato Markdown
    const enrichedPrompt = `# TRANSFORMACIÓN DE PORTADA

## Instrucciones de Transformación
Aplica la siguiente transformación estilística a la portada:

${stylePrompt}

## Consideraciones Importantes

- **Adaptar colores y texturas** según el estilo solicitado
- **Conservar la magia** y atractivo para el público infantil`;

    userId = await getUserId(req);
    
    // Configurar contexto de usuario en Sentry
    if (userId) {
      setUser({ id: userId });
    }
    
    // Configurar tags básicos
    setTags({
      'function.name': 'generate-cover-variant'
    });
const enabled = await isActivityEnabled(STAGE, ACTIVITY);
    if (!enabled) {
      return new Response(
        JSON.stringify({ error: 'Actividad deshabilitada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    await startInflightCall({
      user_id: userId,
      etapa: STAGE,
      actividad: ACTIVITY,
      modelo: apiModel,
      input: { imageUrl, promptType, storyId, styleKey }
    });

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Failed to download image: ${imgRes.status}`);
    }
    const buf = await imgRes.arrayBuffer();
    const urlPath = new URL(imageUrl).pathname;
    const ext = urlPath.split('.').pop()?.toLowerCase() || 'png';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp'
    };
    const mimeType = mimeMap[ext] || 'image/png';
    const blob = new Blob([buf], { type: mimeType });

    // Prepare request to OpenAI/Flux

    let resultUrl = '';
    let elapsed = 0;
    let tokensIn = 0;
    let tokensOut = 0;
    if (apiEndpoint.includes('bfl.ai')) {
      const start = Date.now();
      resultUrl = await generateWithFlux(enrichedPrompt);
      elapsed = Date.now() - start;
      tokensIn = 0;
      tokensOut = 0;
      console.log('[generate-cover-variant] [OUT]', resultUrl);
    } else {
      const start = Date.now();
      const configuredSize = promptRow?.size || '1024x1024';
      const configuredQuality = promptRow?.quality || 'standard';
      const openaiPayload = {
        model: apiModel,
        prompt: enrichedPrompt,
        size: configuredSize,
        quality: configuredQuality,
        n: 1,
      };
      console.log('[generate-cover-variant] [REQUEST]', JSON.stringify(openaiPayload));
    console.log('[generate-cover-variant] Estilo aplicado:', STYLE_DESCRIPTIONS[promptType] || promptType);
    console.log('[generate-cover-variant] Prompt enriquecido:', enrichedPrompt);
      const result = await generateWithOpenAI({
        endpoint: apiEndpoint,
        payload: openaiPayload,
        files: { image: blob },
        mimeType,
      });
      elapsed = Date.now() - start;
      tokensIn = result.tokensIn;
      tokensOut = result.tokensOut;
      resultUrl = result.url;
    }

    const base64Data = resultUrl.startsWith('data:')
      ? resultUrl.split(',')[1]
      : null;
    let publicUrl = resultUrl;
    if (base64Data) {
      const byteString = atob(base64Data);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      const resultBlob = new Blob([uint8Array], { type: 'image/png' });
      const path = `covers/${storyId}_${styleKey}.png`;
      await supabaseAdmin.storage
        .from('storage')
        .upload(path, resultBlob, { contentType: 'image/png', upsert: true });
      const { data: { publicUrl: url } } = supabaseAdmin.storage
        .from('storage')
        .getPublicUrl(path);
      publicUrl = url;
    }

    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: apiModel,
      tiempo_respuesta_ms: elapsed,
      estado: 'success',
      error_type: null,
      tokens_entrada: tokensIn,
      tokens_salida: tokensOut,
      usuario_id: userId,
      actividad: ACTIVITY,
      edge_function: FILE,
    });

    await endInflightCall(userId, ACTIVITY);
    return new Response(JSON.stringify({ coverUrl: publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in generate-cover-variant:', error);
    await endInflightCall(userId, ACTIVITY);
    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: apiModel,
      tiempo_respuesta_ms: 0,
      estado: 'error',
      error_type: 'service_error',
      tokens_entrada: 0,
      tokens_salida: 0,
      usuario_id: userId,
      metadatos: { error: (error as Error).message },
      actividad: ACTIVITY,
      edge_function: FILE,
    });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
