import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check for OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Parse and validate request body
    const { name, description } = await req.json();
    if (!name || !description) {
      throw new Error('Name and description are required');
    }

    // Generate character variations with DALL-E 3
    const variations = await openai.images.generate({
      model: 'dall-e-3',
      n: 3,
      size: '1024x1024',
      quality: 'standard',
      prompt: `Create a character illustration for a children's book named "${name}". ${description}. The style should be child-friendly and engaging.`,
    });

    // Generate sprite sheet
    const spriteSheet = await openai.images.generate({
      model: 'dall-e-3',
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      prompt: `Create a sprite sheet showing front, side, and back views of the character "${name}". ${description}. Arrange the views horizontally in a single image. Style should match children's book illustration.`,
    });

    return new Response(
      JSON.stringify({
        variations: variations.data.map(img => ({
          id: crypto.randomUUID(),
          imageUrl: img.url,
          seed: img.seed || '',
          style: 'dall-e-3'
        })),
        spriteSheet: {
          id: crypto.randomUUID(),
          imageUrl: spriteSheet.data[0].url,
          seed: spriteSheet.data[0].seed || '',
          style: 'sprite-sheet'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in generate-variations:', error);
    
    // Return a structured error response
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