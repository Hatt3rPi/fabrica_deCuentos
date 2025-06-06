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
    const { name, description, age } = await req.json();
    
    const start = Date.now();
    const payload = {
      model: 'gpt-image-1',
      prompt:
        `Clean full-body pencil sketch illustration for a children's book. ` +
        `Character: ${age}. ${description}. Simple lines, no background, child-friendly.`,
      size: '1024x1024',
      quality: 'hd',
      n: 1,
    };
    console.log('[generate-variations] [REQUEST]', JSON.stringify(payload));
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const imageResponse = await res.json();
    const elapsed = Date.now() - start;
    await logPromptMetric({
      modelo_ia: 'gpt-image-1',
      tiempo_respuesta_ms: elapsed,
      estado: imageResponse.data?.[0]?.url ? 'success' : 'error',
      error_type: imageResponse.data?.[0]?.url ? null : 'service_error',
      actividad: 'generar_variacion',
      edge_function: 'generate-variations',
    });

    return new Response(
      JSON.stringify({
        thumbnailUrl: imageResponse.data[0].url
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