import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handleOpenAIError = (error: any) => {
  if (error.response?.status === 429) {
    return {
      status: 429,
      message: 'Límite de solicitudes excedido. Por favor, intenta de nuevo en unos minutos.'
    };
  }
  return {
    status: 500,
    message: error.message || 'Error al analizar el personaje'
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image, imageUrl, name, age, description: sanitizedNotes } = await req.json();
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
              text: `Analiza cuidadosamente la(s) imágen(es) proporcionada(s) y, si existe, considera también la descripción ingresada por el usuario. Cuando dispongas de ambos elementos (imágenes y descripción del usuario), asigna un peso de 0.6 a la descripción del usuario y 0.4 a la descripción que extraigas únicamente observando las imágenes. Si sólo cuentas con las imágenes, realiza la descripción basándote exclusivamente en ellas.

    Describe detalladamente al personaje, cubriendo estos aspectos específicos:

    Apariencia física (color y tipo de cabello, color de ojos, contextura, tono de piel, altura aproximada, edad aparente).

    Vestimenta (tipo, colores, detalles distintivos, accesorios).

    Expresión facial (estado de ánimo aparente, gestos notorios).

    Postura (posición corporal, lenguaje corporal evidente).

    Cualquier característica distintiva o notable (elementos particulares como objetos especiales, rasgos únicos visibles).

    No inventes ni supongas información que no esté claramente visible en las imágenes o proporcionada explícitamente en la descripción del usuario.

    Entrega la descripción estructurada en dos idiomas: español latino e inglés, dentro de un arreglo claramente etiquetado para facilitar la selección posterior del idioma requerido, siguiendo este formato:

    {
    "es": "[Descripción en español latino]",
    "en": "[Description in English]"
    }

    Asegúrate de mantener coherencia y precisión en ambas versiones del texto.

    Antecedentes del usuario dados por el usuario:
    Edad del personaje: ${age || 'no especificada'}
    Notas del usuario: ${sanitizedNotes || 'sin información'}

    Responde exclusivamente en formato JSON válido siguiendo el formato indicado.`
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
      const error = handleOpenAIError({ response, message: responseData.error?.message });
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: error.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!responseData.choices?.[0]?.message?.content) {
      throw new Error('No analysis result received from OpenAI');
    }

    const description = JSON.parse(responseData.choices[0].message.content);

    return new Response(
      JSON.stringify({ description }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in analyze-character function:', error);
    
    const errorResponse = handleOpenAIError(error);
    
    return new Response(
      JSON.stringify({ error: errorResponse.message }),
      {
        status: errorResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});