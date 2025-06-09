import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';
import { startInflightCall, endInflightCall } from '../_shared/inflight.ts';
import { isActivityEnabled } from '../_shared/stages.ts';
import { generateWithFlux } from '../_shared/flux.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const FILE = 'generate-story';
const STAGE = 'historia';
const ACTIVITY = 'generar_historia';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let promptId: string | undefined;
  let coverPromptId: string | undefined;
  let userId: string | null = null;
  let start = 0;

  try {
    const { story_id, characters, theme } = await req.json();

    if (!story_id || !Array.isArray(characters) || characters.length === 0 || !theme) {
      throw new Error('Faltan campos requeridos: story_id, characters o theme');
    }

    userId = await getUserId(req);
    const enabled = await isActivityEnabled(STAGE, ACTIVITY);
    if (!enabled) {
      return new Response(
        JSON.stringify({ error: 'Actividad deshabilitada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: promptRow } = await supabaseAdmin
      .from('prompts')
      .select('id, content, endpoint, model')
      .eq('type', 'PROMPT_GENERADOR_CUENTOS')
      .single();
    const storyPrompt = promptRow?.content || '';
    promptId = promptRow?.id;
    if (!storyPrompt) throw new Error('Prompt not configured');
    const apiEndpoint = promptRow?.endpoint || 'https://api.openai.com/v1/chat/completions';
    const model = promptRow?.model || 'gpt-4-turbo';

    // Formatear personajes: "Nombre de 99 años, Otro de 5 años"
    const charNames = characters
      .map((c: any) => `${c.name} de ${c.age} años`)
      .join(', ');

    const charThumbnails = characters
      .map((c: any) => c.thumbnailUrl || c.thumbnail_url)
      .filter((u: string | null | undefined) => !!u) as string[];
    
    // Usar solo el tema como historia
    const storyTheme = theme || 'Sin tema específico';
    
    const finalPrompt = storyPrompt
      .replace('{personajes}', charNames)
      .replace('{historia}', storyTheme);

    await startInflightCall({
      user_id: userId,
      etapa: STAGE,
      actividad: ACTIVITY,
      modelo: model,
      input: { story_id, characters, theme }
    });

    start = Date.now();
    const storyPayload = {
      model,
      messages: [{ 
        role: 'user', 
        content: finalPrompt 
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.8,
      user: userId, // Agregar user ID para mejorar el prompt caching
    };
    console.log('[generate-story] [REQUEST]', JSON.stringify(storyPayload));
    const resp = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storyPayload),
    });
    const elapsed = Date.now() - start;
    const rawResponse = await resp.text();
    let respData;
    try {
      respData = JSON.parse(rawResponse);
    } catch (_err) {
      await logPromptMetric({
        prompt_id: promptId,
        modelo_ia: model,
        tiempo_respuesta_ms: elapsed,
        estado: 'error',
        error_type: 'invalid_json',
        tokens_entrada: 0,
        tokens_salida: 0,
        tokens_entrada_cacheados: 0,
        tokens_salida_cacheados: 0,
        usuario_id: userId,
        actividad: 'generar_historia',
        edge_function: 'generate-story',
      });
      console.error('Respuesta inválida de OpenAI:', rawResponse.slice(0, 100));
      throw new Error('Formato de respuesta de OpenAI inválido');
    }

    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: model,
      tiempo_respuesta_ms: elapsed,
      estado: resp.ok ? 'success' : 'error',
      error_type: resp.ok ? null : 'service_error',
      tokens_entrada: respData.usage?.prompt_tokens ?? 0,
      tokens_salida: respData.usage?.completion_tokens ?? 0,
      tokens_entrada_cacheados: respData.usage?.prompt_tokens_details?.cached_tokens ?? 0,
      tokens_salida_cacheados: 0, // OpenAI no cachea tokens de salida actualmente
      usuario_id: userId,
      actividad: 'generar_historia',
      edge_function: 'generate-story',
    });

    if (!resp.ok) {
      throw new Error(respData.error?.message || 'OpenAI error');
    }

    const responseContent = respData.choices?.[0]?.message?.content;
    
    if (!responseContent) {
      console.error('OpenAI response has no content:', JSON.stringify(respData, null, 2));
      throw new Error('La respuesta de OpenAI no contiene contenido');
    }

    let result;
    try {
      result = JSON.parse(responseContent);
    } catch (e) {
      console.error('Error al parsear la respuesta de OpenAI:', e, '\nContenido:', responseContent);
      throw new Error('Formato de respuesta de OpenAI inválido');
    }

    console.log('Respuesta parseada de OpenAI:', JSON.stringify(result, null, 2));

    // Verificar la estructura esperada
    if (!result.titulo || !result.paginas || typeof result.paginas !== 'object') {
      console.error('Estructura de respuesta inesperada:', result);
      throw new Error('Formato de historia inválido. Se esperaba {titulo: string, paginas: {1: {texto: string, prompt: string}, ...}}');
    }

    const title = result.titulo;
    const paginas = result.paginas;
    const loaderMessages = result.loader || result.loaders || null;
    const coverPromptBase = result.portada?.prompt || '';

    // Extraer texto y prompt por página en orden
    const pages = Object.entries(paginas)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([_, page]: [string, any]) => ({
        texto: page?.texto,
        prompt: page?.prompt || '',
      }))
      .filter(p => !!p.texto);

    const paragraphs = pages.map(p => p.texto as string);

    if (paragraphs.length === 0) {
      throw new Error('La historia generada no contiene párrafos válidos');
    }

    await supabaseAdmin.from('stories')
      .update({
        title,
        status: 'draft',
        loader: loaderMessages,
      })
      .eq('id', story_id);

    for (const ch of characters) {
      if (!ch.id) continue;
      await supabaseAdmin.rpc('link_character_to_story', {
        p_story_id: story_id,
        p_character_id: ch.id,
        p_user_id: userId,
      });
    }

    // Remove existing pages to avoid duplicates if the story is regenerated
    await supabaseAdmin
      .from('story_pages')
      .delete()
      .eq('story_id', story_id);

    const pageRows = pages.map((p, idx) => ({
      story_id,
      page_number: idx + 1,
      text: p.texto,
      image_url: '',
      prompt: p.prompt,
    }));
    // Insertar también la portada con un placeholder para actualizar luego
    pageRows.unshift({
      story_id,
      page_number: 0,
      text: title,
      image_url: '',
      prompt: coverPromptBase,
    });

    await supabaseAdmin.from('story_pages').insert(pageRows);

    let coverUrl = '';
    const { data: coverRow } = await supabaseAdmin
      .from('prompts')
      .select('id, content, endpoint, model')
      .eq('type', 'PROMPT_CUENTO_PORTADA')
      .single();
    const coverPrompt = coverRow?.content || '';
    coverPromptId = coverRow?.id;
    const coverEndpoint = coverRow?.endpoint || 'https://api.openai.com/v1/images/generations';
    const coverModel = coverRow?.model || 'gpt-image-1';
    if (coverPrompt) {
      const promptText = coverPrompt
        .replace('{style}', 'acuarela digital')
        .replace('{palette}', 'colores vibrantes')
        .replace('{story}', title);
      const cstart = Date.now();
      const coverPayload = {
        model: coverModel,
        prompt: promptText,
        size: '1024x1024',
        quality: 'hd',
        n: 1,
        referenced_image_ids: charThumbnails,
      };
      console.log('[generate-story] [COVER REQUEST]', JSON.stringify(coverPayload));
      let coverRes: any;
      if (coverEndpoint.includes('bfl.ai')) {
        coverUrl = await generateWithFlux(promptText);
        coverRes = { data: [{ url: coverUrl }] };
      } else {
        const cRes = await fetch(coverEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(coverPayload),
        });
        coverRes = await cRes.json();
        if (coverRes.data?.[0]?.url) {
          coverUrl = coverRes.data[0].url;
        }
      }
      const celapsed = Date.now() - cstart;
      await logPromptMetric({
        prompt_id: coverPromptId,
        modelo_ia: coverModel,
        tiempo_respuesta_ms: celapsed,
        estado: coverUrl ? 'success' : 'error',
        error_type: coverUrl ? null : 'service_error',
        tokens_entrada: 0,
        tokens_salida: 0,
        tokens_entrada_cacheados: 0,
        tokens_salida_cacheados: 0,
        usuario_id: userId,
        actividad: 'generar_portada',
        edge_function: 'generate-story',
      });
      if (coverUrl) {
        await supabaseAdmin.from('story_pages')
          .update({ image_url: coverUrl })
          .eq('story_id', story_id)
          .eq('page_number', 0);
      }
    }

    // Devolver la historia generada antes de crear la portada
    await endInflightCall(userId, ACTIVITY);
    return new Response(
      JSON.stringify({
        story_id,
        title,
        paragraphs,
        pages: paragraphs.length,
        coverUrl
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err) {
    console.error('[generate-story] Error:', err);
    if (promptId) {
      await logPromptMetric({
        prompt_id: promptId,
        modelo_ia: model,
        tiempo_respuesta_ms: Date.now() - start,
        estado: 'error',
        error_type: 'service_error',
        tokens_entrada: 0,
        tokens_salida: 0,
        tokens_entrada_cacheados: 0,
        tokens_salida_cacheados: 0,
        usuario_id: userId,
        metadatos: { error: (err as Error).message },
        actividad: 'generar_historia',
        edge_function: 'generate-story',
      });
    }
    await endInflightCall(userId, ACTIVITY);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
