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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log request start
    console.log('Processing request:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Validate request
    if (!req.body) {
      console.error('Empty request body');
      return new Response(
        JSON.stringify({ error: 'Request body is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse form data with error handling
    let formData;
    try {
      formData = await req.formData();
      console.log('Form data received:', {
        fields: Array.from(formData.entries()).map(([key]) => key)
      });
    } catch (error) {
      console.error('Error parsing form data:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid form data format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract and validate form fields
    const imageFile = formData.get('image');
    const name = formData.get('name')?.toString() || '';
    const age = formData.get('age')?.toString() || '';
    const description = formData.get('description')?.toString() || '';
    
    console.log('Processing character:', {
      name,
      age,
      descriptionLength: description?.length,
      hasImage: !!imageFile,
      imageType: imageFile instanceof File ? imageFile.type : null,
      imageSize: imageFile instanceof File ? imageFile.size : null
    });
    
    if (!imageFile || !(imageFile instanceof File)) {
      console.error('Invalid image file:', { imageFile });
      return new Response(
        JSON.stringify({ error: 'Se requiere una imagen válida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert the File to a Buffer for OpenAI
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Verify OpenAI API key
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('OpenAI API key not found');
      throw new Error('Configuration error: OpenAI API key not found');
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Log OpenAI request parameters
    console.log('OpenAI request parameters:', {
      model: 'gpt-image-1',
      size: '256x256',
      promptLength: FIXED_PROMPT.length + name.length + age.length + description.length,
      bufferSize: buffer.length
    });

    // Generate thumbnail sketch with reduced size
    try {
      const thumbnailResponse = await openai.images.edit({
        image: buffer,
        prompt: `${FIXED_PROMPT}\nNombre: ${name}\nEdad: ${age}\nDescripción: ${description}`,
        size: "256x256",
        n: 1,
        model: "gpt-image-1"
      });

      console.log('OpenAI response received:', {
        success: true,
        hasUrl: !!thumbnailResponse.data[0].url
      });

      const thumbnailUrl = thumbnailResponse.data[0].url;

      // Return the response
      return new Response(
        JSON.stringify({
          thumbnailUrl,
          referenceUrls: [] // Empty array instead of generating multiple views
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('OpenAI API error:', {
        message: error.message,
        code: error.code,
        type: error.type,
        status: error.status
      });
      throw error;
    }
  } catch (error) {
    console.error('Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Check if it's a resource limit error
    if (error.message?.includes('capacity') || error.message?.includes('limit')) {
      return new Response(
        JSON.stringify({ 
          error: 'Servicio temporalmente no disponible. Por favor, inténtalo de nuevo en unos minutos.',
          code: 'WORKER_LIMIT'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Return a generic error response
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        code: error.code || 'INTERNAL_ERROR'
      }),
      { 
        status: error.status || 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});