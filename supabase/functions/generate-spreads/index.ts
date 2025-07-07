
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric } from '../_shared/metrics.ts';
import { generateWithFlux } from '../_shared/flux.ts';
import { generateWithOpenAI } from '../_shared/openai.ts';

// import { configureForEdgeFunction, captureException, setUser, setTags } from '../_shared/sentry.ts';

// Stubs temporales para funciones de Sentry
const configureForEdgeFunction = (_fn: string, _req: Request) => {};
const captureException = async (_error: Error, _context?: any) => {};
const setUser = (_user: any) => {};
const setTags = (_tags: any) => {};

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

  try {
    const { prompts, referenceImageIds = [] } = await req.json();
    
    // Obtener configuración desde la base de datos
    const { data: promptConfig } = await supabaseAdmin
      .from('prompts')
      .select('model, size, quality, endpoint')
      .eq('type', 'PROMPT_GENERADOR_IMAGENES')
      .single();

    const defaultSize = promptConfig?.size || '1024x1024';
    const defaultQuality = promptConfig?.quality || 'high';
    const defaultModel = promptConfig?.model || 'gpt-image-1';
    const endpoint = promptConfig?.endpoint || 'https://api.openai.com/v1/images/generations';
    
    const images = await Promise.all(
      prompts.map(async (prompt: string) => {
        const start = Date.now();
        
        const payload = {
          model: defaultModel,
          prompt,
          size: defaultSize,
          quality: defaultQuality,
          n: 1,
        };
        console.log('[generate-spreads] [REQUEST]', JSON.stringify(payload));
        let url = '';
        if (endpoint.includes('bfl.ai') || Deno.env.get('FLUX_ENDPOINT')) {
          url = await generateWithFlux(prompt);
        } else {
          const { url: result } = await generateWithOpenAI({
            endpoint,
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