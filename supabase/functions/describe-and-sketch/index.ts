import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIXED_PROMPT = `Convierte al personaje de la foto en un personaje de cuento infantil.
Deja el fondo en blanco.
Dibujo limpio a lápiz, líneas simples.
Ilustración de cuerpo entero.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, name, age, description } = await req.json();
    
    if (!imageBase64) {
      throw new Error('Se requiere una imagen');
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Generate thumbnail sketch
    const thumbnailResponse = await openai.images.edit({
      image: imageBase64,
      prompt: FIXED_PROMPT,
      size: "512x512",
      n: 1,
      model: "gpt-image-1"
    });

    const thumbnailUrl = thumbnailResponse.data[0].url;

    // Generate reference views
    const viewPrompts = [
      "Vista frontal de cuerpo entero, fondo blanco.",
      "Vista tres cuartos izquierda de cuerpo entero, fondo blanco.",
      "Vista de perfil derecho de cuerpo entero, fondo blanco."
    ];

    const referenceUrls = await Promise.all(
      viewPrompts.map(async (viewPrompt) => {
        const response = await openai.images.edit({
          image: imageBase64,
          prompt: `${FIXED_PROMPT}\n${viewPrompt}`,
          size: "512x512",
          n: 1,
          model: "gpt-image-1"
        });
        return response.data[0].url;
      })
    );

    return new Response(
      JSON.stringify({
        thumbnailUrl,
        referenceUrls
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});