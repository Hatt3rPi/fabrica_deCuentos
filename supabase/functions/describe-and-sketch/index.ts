import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate image base64 string
function isValidBase64Image(str: string) {
  if (!str) return false;
  try {
    // Check if it's a data URL
    if (str.startsWith('data:image/')) {
      const base64 = str.split(',')[1];
      return base64 && base64.length > 0;
    }
    // Check if it's a raw base64 string
    return /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(str);
  } catch {
    return false;
  }
}

// Clean and validate text for OpenAI
function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  // Remove any potentially problematic characters and limit length
  return text.replace(/[^\w\s.,!?-]/g, '').trim().slice(0, 500);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify OpenAI API key is present
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('Error de configuración: Falta la clave de API de OpenAI');
    }

    const { imageBase64, userNotes, name, age } = await req.json().catch(() => ({}));

    // Validate inputs
    const sanitizedName = sanitizeText(name);
    const sanitizedAge = sanitizeText(age);
    const sanitizedNotes = sanitizeText(userNotes);

    if (!sanitizedNotes && !imageBase64) {
      throw new Error('Se requiere una descripción o una imagen');
    }

    if (imageBase64 && !isValidBase64Image(imageBase64)) {
      throw new Error('Formato de imagen inválido');
    }

    const openai = new OpenAI({
      apiKey: openaiKey,
    });

    // Create messages array based on available data
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Describe este personaje para un libro infantil. ${
              imageBase64 ? 'Analiza la imagen proporcionada y ' : ''
            }considera la descripción del usuario si está disponible.

            Información disponible:
            ${sanitizedName ? `Nombre: ${sanitizedName}` : ''}
            ${sanitizedAge ? `Edad: ${sanitizedAge}` : ''}
            ${sanitizedNotes ? `Descripción: ${sanitizedNotes}` : ''}

            Proporciona una descripción detallada que incluya:
            - Apariencia física
            - Vestimenta
            - Expresión y personalidad
            - Características distintivas`
          }
        ]
      }
    ];

    // Only add image analysis if a valid image is provided
    if (imageBase64) {
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
        }
      });
    }

    // Get character description
    const description = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages,
      max_tokens: 500,
    }).catch((error) => {
      if (error.status === 429) {
        throw new Error('Demasiadas solicitudes a OpenAI. Por favor, intenta de nuevo en unos momentos.');
      }
      throw new Error(`Error al analizar el personaje: ${error.message}`);
    });

    if (!description.choices?.[0]?.message?.content) {
      throw new Error('No se pudo generar la descripción del personaje');
    }

    // Create a simplified prompt for DALL-E
    const imagePrompt = `Create a child-friendly illustration of ${sanitizedName || 'a character'} for a children's book. ${
      description.choices[0].message.content.slice(0, 300)
    }. Style: Colorful, engaging, suitable for children.`;

    // Generate thumbnail
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    }).catch((error) => {
      if (error.status === 429) {
        throw new Error('Demasiadas solicitudes a OpenAI. Por favor, intenta de nuevo en unos momentos.');
      }
      throw new Error(`Error al generar la imagen: ${error.message}`);
    });

    if (!imageResponse.data?.[0]?.url) {
      throw new Error('No se pudo generar la imagen del personaje');
    }

    return new Response(
      JSON.stringify({
        description: description.choices[0].message.content,
        thumbnailUrl: imageResponse.data[0].url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in describe-and-sketch:', error);
    
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