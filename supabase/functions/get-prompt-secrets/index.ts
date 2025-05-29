import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const thumbnailPrompt = Deno.env.get('PROMPT_CREAR_MINIATURA_PERSONAJE') || ''
    const descriptionPrompt = Deno.env.get('PROMPT_DESCRIPCION_PERSONAJE') || ''

    return new Response(
      JSON.stringify({
        PROMPT_CREAR_MINIATURA_PERSONAJE: thumbnailPrompt,
        PROMPT_DESCRIPCION_PERSONAJE: descriptionPrompt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Error fetching prompt secrets', err)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch prompt secrets' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
