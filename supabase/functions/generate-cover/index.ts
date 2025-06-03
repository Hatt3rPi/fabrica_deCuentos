import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let promptId: string | undefined;
  let userId: string | null = null;
  let start = Date.now();

  try {
    const { story_id, title, visual_style, color_palette, reference_image_ids } = await req.json();
    if (!story_id || !title) {
      throw new Error('Missing story_id or title');
    }

    userId = await getUserId(req);

    const { data: promptRow } = await supabaseAdmin
      .from('prompts')
      .select('id, content')
      .eq('type', 'PROMPT_CUENTO_PORTADA')
      .single();
    const basePrompt = promptRow?.content || '';
    promptId = promptRow?.id;
    if (!basePrompt) throw new Error('Prompt not found');

    const prompt = basePrompt
      .replace('{style}', visual_style || 'acuarela digital')
      .replace('{palette}', color_palette || 'colores vibrantes')
      .replace('{story}', title);

    start = Date.now();
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
        quality: 'hd',
        n: 1,
        referenced_image_ids: reference_image_ids || [],
      }),
    });
    const data = await res.json();
    const elapsed = Date.now() - start;
    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: 'gpt-image-1',
      tiempo_respuesta_ms: elapsed,
      estado: data.data?.[0]?.url ? 'success' : 'error',
      error_type: data.data?.[0]?.url ? null : 'service_error',
      tokens_entrada: 0,
      tokens_salida: 0,
      usuario_id: userId,
    });

    if (!data.data?.[0]?.url) {
      throw new Error(data.error?.message || 'No image generated');
    }

    const imgRes = await fetch(data.data[0].url);
    const blob = await imgRes.blob();
    const path = `covers/${story_id}.png`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('storage')
      .upload(path, blob, { contentType: 'image/png', upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('storage')
      .getPublicUrl(path);

    await supabaseAdmin.from('story_pages').upsert({
      story_id,
      page_number: 0,
      text: title,
      image_url: publicUrl,
      prompt
    }, { onConflict: 'story_id,page_number' });

    return new Response(
      JSON.stringify({ coverUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (promptId) {
      await logPromptMetric({
        prompt_id: promptId,
        modelo_ia: 'gpt-image-1',
        tiempo_respuesta_ms: Date.now() - start,
        estado: 'error',
        error_type: 'service_error',
        tokens_entrada: 0,
        tokens_salida: 0,
        usuario_id: userId,
        metadatos: { error: (error as Error).message },
      });
    }
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
