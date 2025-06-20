import { logPromptMetric } from '../_shared/metrics.ts';
import { generateWithFlux } from '../_shared/flux.ts';
import { generateWithOpenAI } from '../_shared/openai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, description, age } = await req.json();
    
    const start = Date.now();
    // Use configurable defaults - can be overridden via environment or future prompt configuration
    const defaultSize = Deno.env.get('DEFAULT_IMAGE_SIZE') || '1024x1024';
    const defaultQuality = Deno.env.get('DEFAULT_IMAGE_QUALITY') || 'high';
    const defaultModel = Deno.env.get('DEFAULT_IMAGE_MODEL') || 'gpt-image-1';
    
    const payload = {
      model: defaultModel,
      prompt:
        `Clean full-body pencil sketch illustration for a children's book. ` +
        `Character: ${age}. ${description}. Simple lines, no background, child-friendly.`,
      size: defaultSize,
      quality: defaultQuality,
      n: 1,
    };
    console.log('[generate-variations] [REQUEST]', JSON.stringify(payload));
    let imageUrl = '';
    if (Deno.env.get('FLUX_ENDPOINT')) {
      imageUrl = await generateWithFlux(payload.prompt);
    } else {
      const { url } = await generateWithOpenAI({
        endpoint: 'https://api.openai.com/v1/images/generations',
        payload,
      });
      imageUrl = url;
    }
    const elapsed = Date.now() - start;
    await logPromptMetric({
      modelo_ia: defaultModel,
      tiempo_respuesta_ms: elapsed,
      estado: imageUrl ? 'success' : 'error',
      error_type: imageUrl ? null : 'service_error',
      actividad: 'generar_variacion',
      edge_function: 'generate-variations',
    });

    return new Response(
      JSON.stringify({
        thumbnailUrl: imageUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-variations:', error);
    await logPromptMetric({
      modelo_ia: 'dall-e-2',
      tiempo_respuesta_ms: 0,
      estado: 'error',
      error_type: 'service_error',
      metadatos: { error: (error as Error).message },
      actividad: 'generar_variacion',
      edge_function: 'generate-variations',
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});