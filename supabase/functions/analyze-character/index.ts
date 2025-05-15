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

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    // Create Supabase client to access storage
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Check if the URL is from Supabase storage
    const isSupabaseStorage = imageUrl.includes(Deno.env.get('SUPABASE_URL') ?? '');

    let response;
    if (isSupabaseStorage) {
      // Extract the bucket and file path from the URL
      const url = new URL(imageUrl);
      const pathSegments = url.pathname.split('/');
      
      // Find the bucket name after 'storage/v1/object/public/'
      const publicIndex = pathSegments.indexOf('public');
      if (publicIndex === -1) {
        throw new Error('Invalid Supabase storage URL format');
      }
      
      const bucketName = pathSegments[publicIndex + 1];
      const filePath = pathSegments.slice(publicIndex + 2).join('/');

      if (!bucketName || !filePath) {
        throw new Error('Could not extract bucket name or file path from URL');
      }

      console.log(`[analyze-character] Fetching from bucket: ${bucketName}, path: ${filePath}`);

      // Download file directly from Supabase storage
      const { data, error } = await supabaseAdmin
        .storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        console.error('Supabase storage error:', error);
        throw new Error(`Failed to download from Supabase storage: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data received from Supabase storage');
      }

      // Convert blob to base64
      const buffer = await data.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      return `data:${data.type};base64,${base64}`;
    } else {
      // For external URLs, use fetch
      response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      return `data:${contentType};base64,${base64}`;
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageUrl, name, age, description: sanitizedNotes } = await req.json();
    
    if (!imageUrl) {
      throw new Error('No image URL provided');
    }

    // Get the analysis prompt from environment variable
    const analysisPrompt = Deno.env.get('PROMPT_DESCRIPCION_PERSONAJE');
    if (!analysisPrompt) {
      throw new Error('Error de configuración: Falta el prompt de análisis de personaje');
    }

    console.log('[analyze-character] Attempting to fetch image:', imageUrl);

    // Convert the image URL to base64
    const base64Image = await fetchImageAsBase64(imageUrl);

    // Replace placeholders in the prompt
    const prompt = analysisPrompt
      .replace('{{name}}', name || '')
      .replace('{{age}}', age || '')
      .replace('{{notes}}', sanitizedNotes || '');

    const requestBody = {
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" }
    };

    console.log('[analyze-character] [Análisis de imagen] [IN] Sending request to OpenAI');

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log('[analyze-character] [Análisis de imagen] [OUT] Received response from OpenAI');

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