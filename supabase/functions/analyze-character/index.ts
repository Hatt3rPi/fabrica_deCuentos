import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image, imageUrl } = await req.json();
    if (!image && !imageUrl) {
      throw new Error('No image data or URL provided');
    }

    const requestBody = {
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Convierte a la persona presente en la(s) imagen(es) adjunta(s) en un personaje de cuento infantil.
    El personaje debe mantener la apariencia visual consistente con la persona real: considera su edad, color de piel, tipo de cabello, rasgos faciales y complexión.
    Usa colores suaves, expresiones dulces y formas redondeadas para que el personaje transmita ternura y se integre bien en un cuento infantil.
    Si hay más de una imagen, intégralas para obtener una descripción consolidada del personaje.
    Si se incluye un texto adicional, úsalo para complementar la interpretación: puedes tomar inspiración de su personalidad, profesión, gustos, emociones o rol en el cuento.
    El fondo debe ser blanco o neutro, ya que la imagen será utilizada como miniatura o como parte de un kit de identidad.
    texto adicional: ${sanitizedNotes || 'sin información'}`;
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl || image
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" }
    };

    console.log('[analyze-character] [Análisis de imagen] [IN]', JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log('[analyze-character] [Análisis de imagen] [OUT]', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      throw new Error(responseData.error?.message || 'Failed to analyze image');
    }

    if (!responseData.choices?.[0]?.message?.content) {
      throw new Error('No analysis result received from OpenAI');
    }

    const description = JSON.parse(responseData.choices[0].message.content).description;

    return new Response(
      JSON.stringify({ description }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in analyze-character function:', error);
    
    let errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});