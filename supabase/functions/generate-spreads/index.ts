import OpenAI from 'npm:openai@4.28.0';
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
    const { prompts } = await req.json();
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const images = await Promise.all(
      prompts.map(async (prompt: string) => {
        const start = Date.now();
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          size: "2362x4724",
          quality: "hd",
          n: 1,
        });
        const elapsed = Date.now() - start;
        await logPromptMetric({
          modelo_ia: 'dall-e-3',
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