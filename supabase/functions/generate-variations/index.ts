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
    const { name, description, age } = await req.json();
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Generate new thumbnail
    const start = Date.now();
    const imageResponse = await openai.images.generate({
      model: "dall-e-2",
      prompt: `Clean full-body pencil sketch illustration for a children's book. ` +
        `Character: ${age}. ${description}. Simple lines, no background, child-friendly.`,
      size: "256x256",
      //quality: "standard",
      n: 1,
    });
    const elapsed = Date.now() - start;
    await logPromptMetric({
      modelo_ia: 'dall-e-2',
      tiempo_respuesta_ms: elapsed,
      estado: imageResponse.data?.[0]?.url ? 'success' : 'error',
      error_type: imageResponse.data?.[0]?.url ? null : 'service_error',
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
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});