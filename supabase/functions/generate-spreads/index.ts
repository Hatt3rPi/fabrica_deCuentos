
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
    const { prompts, referenceImageIds = [] } = await req.json();
    
    const images = await Promise.all(
      prompts.map(async (prompt: string) => {
        const start = Date.now();
        // Use configurable defaults - can be overridden via environment or future prompt configuration
        const defaultSize = Deno.env.get('DEFAULT_IMAGE_SIZE') || '1024x1024';
        const defaultQuality = Deno.env.get('DEFAULT_IMAGE_QUALITY') || 'standard';
        const defaultModel = Deno.env.get('DEFAULT_IMAGE_MODEL') || 'gpt-image-1';
        
        const payload = {
          model: defaultModel,
          prompt,
          size: defaultSize,
          quality: defaultQuality,
          n: 1,
          referenced_image_ids: referenceImageIds,
        };
        console.log('[generate-spreads] [REQUEST]', JSON.stringify(payload));
        let url = '';
        if (Deno.env.get('FLUX_ENDPOINT')) {
          url = await generateWithFlux(prompt);
        } else {
          const { url: result } = await generateWithOpenAI({
            endpoint: 'https://api.openai.com/v1/images/generations',
            payload,
          });
          url = result;
        }
        const elapsed = Date.now() - start;
        await logPromptMetric({
          modelo_ia: defaultModel,
          tiempo_respuesta_ms: elapsed,
          estado: url ? 'success' : 'error',
          error_type: url ? null : 'service_error',
          actividad: 'generar_spread',
          edge_function: 'generate-spreads',
        });
        return url;
      })
    );

    return new Response(
      JSON.stringify({ images }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    await logPromptMetric({
      modelo_ia: 'dall-e-3',
      tiempo_respuesta_ms: 0,
      estado: 'error',
      error_type: 'service_error',
      metadatos: { error: (error as Error).message },
      actividad: 'generar_spread',
      edge_function: 'generate-spreads',
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});