import OpenAI from "npm:openai@4.28.0";

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
function sanitizeText(text: string | null | undefined | { es: string; en: string }): string {
  if (!text) return '';
  
  // Handle object with es/en properties
  if (typeof text === 'object' && 'es' in text) {
    return sanitizeText(text.es);
  }
  
  // Convert to string and sanitize
  const stringText = String(text);
  return stringText.replace(/[^\w\s.,!?-]/g, '').trim().slice(0, 500);
}

// Validate request payload
interface RequestPayload {
  imageBase64: string | null;
  userNotes: string;
  name: string;
  age: string;
}

function validatePayload(payload: any): RequestPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid request payload');
  }

  // Ensure all required fields are present and of correct type
  const validatedPayload: RequestPayload = {
    imageBase64: payload.imageBase64 === null ? null : String(payload.imageBase64 || ''),
    userNotes: String(payload.userNotes || ''),
    name: String(payload.name || ''),
    age: String(payload.age || '')
  };

  return validatedPayload;
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

    // Get the character prompts from environment variables
    const characterPrompt = Deno.env.get('PROMPT_CREAR_MINIATURA_PERSONAJE');
    if (!characterPrompt) {
      throw new Error('Error de configuración: Falta el prompt de generación de personaje');
    }

    const descriptionPrompt = Deno.env.get('PROMPT_DESCRIPCION_PERSONAJE');
    if (!descriptionPrompt) {
      throw new Error('Error de configuración: Falta el prompt de descripción de personaje');
    }

    // Parse and validate request payload
    const rawPayload = await req.json().catch(() => {
      throw new Error('Invalid JSON payload');
    });
    
    const { imageBase64, userNotes, name, age } = validatePayload(rawPayload);

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

    // Replace placeholders in the character prompt
    const imagePrompt = characterPrompt
      .replace('{{name}}', sanitizedName)
      .replace('{{age}}', sanitizedAge)
      .replace('{{notes}}', sanitizedNotes);

    const imageGenerationParams = {
      model: "gpt-image-1",
      prompt: imagePrompt,
      size: "1024x1024",
      n: 1,
      referenced_image_ids: imageBase64 ? [imageBase64] : undefined,
      response_format: "url"
    };

    console.log('[describe-and-sketch] [Generación de imagen] [IN] Sending request to OpenAI:', imagePrompt);

    const imageResponse = await openai.images.generate(imageGenerationParams).catch((error) => {
      if (error.status === 429) {
        throw new Error('Demasiadas solicitudes a OpenAI. Por favor, intenta de nuevo en unos momentos.');
      }
      throw new Error(`Error al generar la imagen: ${error.message}`);
    });

    console.log('[describe-and-sketch] [Generación de imagen] [OUT] Received response from OpenAI');

    if (!imageResponse.data?.[0]?.url) {
      throw new Error('No se pudo generar la imagen del personaje');
    }

    // Replace placeholders in the description prompt
    const prompt = descriptionPrompt
      .replace('{{name}}', sanitizedName)
      .replace('{{age}}', sanitizedAge)
      .replace('{{notes}}', sanitizedNotes);

    // Create messages array based on available data
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
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

    const descriptionParams = {
      model: "gpt-4-turbo-preview",
      messages,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    };

    console.log('[describe-and-sketch] [Análisis de personaje] [IN] Sending request to OpenAI:', prompt);

    // Get character description
    const description = await openai.chat.completions.create(descriptionParams).catch((error) => {
      if (error.status === 429) {
        throw new Error('Demasiadas solicitudes a OpenAI. Por favor, intenta de nuevo en unos momentos.');
      }
      throw new Error(`Error al analizar el personaje: ${error.message}`);
    });

    console.log('[describe-and-sketch] [Análisis de personaje] [OUT] Received response from OpenAI');

    if (!description.choices?.[0]?.message?.content) {
      throw new Error('No se pudo generar la descripción del personaje');
    }

    const parsedDescription = JSON.parse(description.choices[0].message.content);

    return new Response(
      JSON.stringify({
        description: parsedDescription,
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