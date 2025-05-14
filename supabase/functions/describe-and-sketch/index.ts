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
    // Validate request
    if (!req.body) {
      return new Response(
        JSON.stringify({ error: 'Request body is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse form data with error handling
    let formData;
    try {
      formData = await req.formData();
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
    
    if (!imageFile || !(imageFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'Se requiere una imagen válida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert the File to a Buffer for OpenAI
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Generate thumbnail sketch with reduced size
    const thumbnailResponse = await openai.images.edit({
      image: buffer,
      prompt: `${FIXED_PROMPT}\nNombre: ${name}\nEdad: ${age}\nDescripción: ${description}`,
      size: "256x256",
      n: 1,
      model: "gpt-image-1"
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
    console.error('Error:', error);
    
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