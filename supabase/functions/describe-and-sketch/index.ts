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
    // Ensure we have a valid request with form data
    if (!req.body) {
      throw new Error('Request body is empty');
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const name = formData.get('name') as string;
    const age = formData.get('age') as string;
    const description = formData.get('description') as string;
    
    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error('Se requiere una imagen válida');
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

    // Return only the thumbnail URL to reduce resource usage
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
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});