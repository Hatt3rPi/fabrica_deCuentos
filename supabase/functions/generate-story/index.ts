import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';
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
  let coverPromptId: string | undefined;
  let userId: string | null = null;
  let start = 0;

  try {
    const {
      story_id,
      characters,
      theme,
      target_age,
      literary_style,
      central_message,
      additional_details,
    } = await req.json();

    if (!story_id || !Array.isArray(characters) || characters.length === 0) {
      throw new Error('Missing required fields');
    }

    userId = await getUserId(req);

    const { data: promptRow } = await supabaseAdmin
      .from('prompts')
      .select('id, content')
      .eq('type', 'PROMPT_GENERADOR_CUENTOS')
      .single();
    const storyPrompt = promptRow?.content || '';
    promptId = promptRow?.id;
    if (!storyPrompt) throw new Error('Prompt not configured');

    const charNames = characters.map((c: any) => c.name).join(', ');
    const finalPrompt = storyPrompt
      .replace('{theme}', theme || '')
      .replace('{characters}', charNames)
      .replace('{targetAge}', target_age || '')
      .replace('{literaryStyle}', literary_style || '')
      .replace('{centralMessage}', central_message || '')
      .replace('{additionalDetails}', additional_details || '');

    const model = 'gpt-4-turbo';
    start = Date.now();
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: finalPrompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
        temperature: 0.8,
      }),
    });
    const elapsed = Date.now() - start;
    const respData = await resp.json();

    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: model,
      tiempo_respuesta_ms: elapsed,
      estado: resp.ok ? 'success' : 'error',
      error_type: resp.ok ? null : 'service_error',
      tokens_entrada: respData.usage?.prompt_tokens ?? 0,
      tokens_salida: respData.usage?.completion_tokens ?? 0,
      usuario_id: userId,
    });

    if (!resp.ok) {
      throw new Error(respData.error?.message || 'OpenAI error');
    }

    const result = JSON.parse(respData.choices?.[0]?.message?.content || '{}');
    const title = result.title || 'Cuento sin título';
    const paragraphs: string[] = Array.isArray(result.paragraphs) ? result.paragraphs : [];
    if (paragraphs.length === 0) {
      throw new Error('Invalid story response');
    }

    await supabaseAdmin.from('stories').update({
      title,
      target_age,
      literary_style,
      central_message,
      additional_details,
      status: 'completed',
    }).eq('id', story_id);

    for (const ch of characters) {
      if (!ch.id) continue;
      await supabaseAdmin.rpc('link_character_to_story', {
        p_story_id: story_id,
        p_character_id: ch.id,
        p_user_id: userId,
      });
    }

    for (let i = 0; i < paragraphs.length; i++) {
      await supabaseAdmin.from('story_pages').insert({
        story_id,
        page_number: i + 1,
        text: paragraphs[i],
        image_url: '',
        prompt: '',
      });
    }

    let coverUrl = '';
    const { data: coverRow } = await supabaseAdmin
      .from('prompts')
      .select('id, content')
      .eq('type', 'PROMPT_CUENTO_PORTADA')
      .single();
    const coverPrompt = coverRow?.content || '';
    coverPromptId = coverRow?.id;
    if (coverPrompt) {
      const promptText = coverPrompt
        .replace('{style}', 'acuarela digital')
        .replace('{palette}', 'colores vibrantes')
        .replace('{story}', title);
      const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
      const cstart = Date.now();
      const coverRes = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: promptText,
        size: '1792x1024',
        n: 1,
      });
      const celapsed = Date.now() - cstart;
      await logPromptMetric({
        prompt_id: coverPromptId,
        modelo_ia: 'gpt-image-1',
        tiempo_respuesta_ms: celapsed,
        estado: coverRes.data?.[0]?.url ? 'success' : 'error',
        error_type: coverRes.data?.[0]?.url ? null : 'service_error',
        tokens_entrada: 0,
        tokens_salida: 0,
        usuario_id: userId,
      });
      if (coverRes.data?.[0]?.url) {
        coverUrl = coverRes.data[0].url;
        await supabaseAdmin.from('story_pages').insert({
          story_id,
          page_number: 0,
          text: title,
          image_url: coverUrl,
          prompt: promptText,
        });
      }
    }

    return new Response(
      JSON.stringify({ story_id, title, pages: paragraphs.length, coverUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[generate-story] Error:', err);
    if (promptId) {
      await logPromptMetric({
        prompt_id: promptId,
        modelo_ia: 'gpt-4-turbo',
        tiempo_respuesta_ms: Date.now() - start,
        estado: 'error',
        error_type: 'service_error',
        tokens_entrada: 0,
        tokens_salida: 0,
        usuario_id: userId,
        metadatos: { error: (err as Error).message },
      });
    }
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
