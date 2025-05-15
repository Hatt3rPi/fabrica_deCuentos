import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('[describe-and-sketch] [Paso: Inicio] [IN] Received payload:', JSON.stringify(payload, null, 2));

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Construir el prompt para la imagen
    const imagePrompt = `Convierte a la persona presente en la(s) imagen(es) adjunta(s) en un personaje de cuento infantil.
    El personaje debe mantener la apariencia visual consistente con la persona real: considera su edad, color de piel, tipo de cabello, rasgos faciales y complexión.
    Usa colores suaves, expresiones dulces y formas redondeadas para que el personaje transmita ternura y se integre bien en un cuento infantil.
    Si hay más de una imagen, intégralas para obtener una descripción consolidada del personaje.
    Si se incluye un texto adicional, úsalo para complementar la interpretación: puedes tomar inspiración de su personalidad, profesión, gustos, emociones o rol en el cuento.
    El fondo debe ser blanco o neutro, ya que la imagen será utilizada como miniatura o como parte de un kit de identidad.
    texto adicional: ${payload.description || 'sin información'}`;

    console.log('[describe-and-sketch] [Paso: Generación de imagen] [OUT] Image generation prompt:', imagePrompt);
    console.log('[describe-and-sketch] [Paso: Generación de imagen] [OUT] Reference image URL:', payload.referenceImage || 'No reference image provided');

    const openaiPayload = {
      model: "gpt-image-1",
      prompt: imagePrompt,
      size: "1024x1024",
      n: 1,
      referenced_image_ids: payload.referenceImage ? [payload.referenceImage] : undefined,
      response_format: "url",
    };

    console.log('[describe-and-sketch] [Paso: Generación de imagen] [OUT] OpenAI Request:', JSON.stringify(openaiPayload, null, 2));

    const imageResponse = await openai.images.generate(openaiPayload);

    console.log('[describe-and-sketch] [Paso: Generación de imagen] [IN] OpenAI Response:', JSON.stringify(imageResponse.data, null, 2));

    if (!imageResponse.data?.[0]?.url) {
      throw new Error('No se pudo generar la imagen del personaje');
    }

    return new Response(
      JSON.stringify({
        thumbnailUrl: imageResponse.data[0].url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[describe-and-sketch] [Error] Error in describe-and-sketch:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error al generar la miniatura'
      }),
      { 
        status: error.status || 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});