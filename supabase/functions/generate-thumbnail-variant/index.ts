import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let promptId: string | undefined;
  let userId: string | null = null;

  try {
    const { imageUrl, promptType } = await req.json();
    if (!imageUrl || !promptType) {
      throw new Error('Missing imageUrl or promptType');
    }

    const { data: promptRow } = await supabaseAdmin
      .from('prompts')
      .select('id, content')
      .eq('type', promptType)
      .single();

    const stylePrompt = promptRow?.content || '';
    promptId = promptRow?.id;
    if (!stylePrompt) {
      throw new Error('Prompt not found');
    }

    userId = await getUserId(req);

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
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', stylePrompt);
    formData.append('size', '1024x1024');
    formData.append('n', '1');
    formData.append('image', blob, `reference.${ext}`);

    const start = Date.now();
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const editRes = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}` },
      body: formData
    });
    const elapsed = Date.now() - start;
    const editData = await editRes.json();
    const tokensIn = editData.usage?.input_tokens ?? 0;
    const tokensOut = editData.usage?.output_tokens ?? 0;

    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: 'gpt-image-1',
      tiempo_respuesta_ms: elapsed,
      estado: editRes.ok ? 'success' : 'error',
      error_type: editRes.ok ? null : 'service_error',
      tokens_entrada: tokensIn,
      tokens_salida: tokensOut,
      usuario_id: userId,
    });

    if (!editRes.ok) {
      const msg = editData.error?.message || editRes.statusText;
      throw new Error(msg);
    }

    const b64 = editData.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error('No image returned');
    }
    const resultUrl = `data:${mimeType};base64,${b64}`;

    return new Response(JSON.stringify({ thumbnailUrl: resultUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in generate-thumbnail-variant:', error);
    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: 'gpt-image-1',
      tiempo_respuesta_ms: 0,
      estado: 'error',
      error_type: 'service_error',
      tokens_entrada: 0,
      tokens_salida: 0,
      usuario_id: userId,
      metadatos: { error: (error as Error).message },
    });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
