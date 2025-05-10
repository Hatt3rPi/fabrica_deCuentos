import OpenAI from 'npm:openai@4.28.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiKey = req.headers.get('x-openai-key');
    if (!openaiKey) {
      throw new Error('OpenAI API key not found in request headers');
    }

    const openai = new OpenAI({
      apiKey: openaiKey,
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
      // Generate variations
      const variations = await openai.images.generate({
        model: 'dall-e-3',
        n: 3,
        size: '1024x1024',
        quality: 'standard',
        prompt: `Create a character illustration for a children's book named "${name}". ${description}. The style should be child-friendly and engaging.`,
      });

      response.variations = variations.data.map(img => ({
        id: crypto.randomUUID(),
        imageUrl: img.url,
        seed: img.seed || '',
        style: 'dall-e-3'
      }));
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