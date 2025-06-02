
import { logPromptMetric } from '../_shared/metrics.ts';

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
            referenced_image_ids: referenceImageIds,
          }),
        });
        const response = await res.json();
        const elapsed = Date.now() - start;
        await logPromptMetric({
          modelo_ia: 'gpt-image-1',
          tiempo_respuesta_ms: elapsed,
          estado: response.data?.[0]?.url ? 'success' : 'error',
          error_type: response.data?.[0]?.url ? null : 'service_error',
        });
        return response.data[0].url;
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
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});