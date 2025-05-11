import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const { name, description, generateSpriteSheet = false, selectedVariantUrl } = await req.json();
    if (!name || !description) {
      throw new Error('Name and description are required');
    }

    if (generateSpriteSheet && !selectedVariantUrl) {
      throw new Error('Selected variant URL is required for sprite sheet generation');
    }

    let response = {};

    if (!generateSpriteSheet) {
      // Generate variations one at a time since DALL-E 3 only supports n=1
      const variations = [];
      for (let i = 0; i < 3; i++) {
        const result = await openai.images.generate({
          model: 'dall-e-3',
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          prompt: `Crea una ilustración digital de un personaje infantil para un cuento. 
El personaje se llama ${name}. sigue la siguiente descripcion ${description}.
Debe tener un estilo visual amigable y encantador para niños pequeños. 
Utiliza colores suaves y figuras redondeadas, al estilo de los libros ilustrados infantiles`,
        });

        variations.push({
          id: crypto.randomUUID(),
          imageUrl: result.data[0].url,
          seed: result.data[0].seed || '',
          style: 'dall-e-3'
        });
      }
      
      response.variations = variations;
    } else {
      // Generate sprite sheet
      const spriteSheetResult = await openai.images.generate({
        model: 'dall-e-3',
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        prompt: `Create a sprite sheet showing front, side, and back views of this character: ${description}. Arrange the views horizontally in a single image. Match the exact style of the input image.`,
      });

      response.spriteSheet = {
        id: crypto.randomUUID(),
        imageUrl: spriteSheetResult.data[0].url,
        seed: spriteSheetResult.data[0].seed || '',
        style: 'sprite-sheet'
      };
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in generate-variations:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});