import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';
import { startInflightCall, endInflightCall } from '../_shared/inflight.ts';
import { isActivityEnabled } from '../_shared/stages.ts';
import { generateWithFlux } from '../_shared/flux.ts';
import { generateWithOpenAI } from '../_shared/openai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);
const FILE = 'generate-thumbnail-variant';
const STAGE = 'personajes';
const ACTIVITY = 'miniatura_variante';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let promptId: string | undefined;
  let userId: string | null = null;
  let apiModel = '';

  try {
    const { imageUrl, promptType } = await req.json();
    if (!imageUrl || !promptType) {
      throw new Error('Missing imageUrl or promptType');
    }

    const { data: promptRow } = await supabaseAdmin
      .from('prompts')
      .select('id, content, endpoint, model')
      .eq('type', promptType)
      .single();

    const stylePrompt = promptRow?.content || '';
    const apiEndpoint = promptRow?.endpoint || 'https://api.openai.com/v1/images/edits';
    apiModel = promptRow?.model || 'gpt-image-1';
    promptId = promptRow?.id;
    if (!stylePrompt) {
      throw new Error('Prompt not found');
    }

    userId = await getUserId(req);
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
      input: { imageUrl, promptType }
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

    const formData = new FormData();
    formData.append('model', apiModel);
    formData.append('prompt', stylePrompt);
    formData.append('size', '1024x1024');
    formData.append('n', '1');
    formData.append('image', blob, `reference.${ext}`);

    let resultUrl = '';
    let elapsed = 0;
    let tokensIn = 0;
    let tokensOut = 0;
    if (apiEndpoint.includes('bfl.ai')) {
      const start = Date.now();
      resultUrl = await generateWithFlux(stylePrompt);
      elapsed = Date.now() - start;
      tokensIn = 0;
      tokensOut = 0;
      console.log('[generate-thumbnail-variant] [OUT]', resultUrl);
    } else {
      const start = Date.now();
      const openaiPayload = {
        model: apiModel,
        prompt: stylePrompt,
        size: '1024x1024',
        n: 1,
        image: imageUrl.split('/').pop()
      };
      console.log('[generate-thumbnail-variant] [REQUEST]', JSON.stringify(openaiPayload));
      const result = await generateWithOpenAI({
        endpoint: apiEndpoint,
        payload: {
          model: apiModel,
          prompt: stylePrompt,
          size: '1024x1024',
          n: 1,
        },
        files: { image: refBlob },
        mimeType,
      });
      elapsed = Date.now() - start;
      tokensIn = result.tokensIn;
      tokensOut = result.tokensOut;
      resultUrl = result.url;
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
    return new Response(JSON.stringify({ thumbnailUrl: resultUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in generate-thumbnail-variant:', error);
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
