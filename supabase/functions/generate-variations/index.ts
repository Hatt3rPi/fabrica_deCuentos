import OpenAI from 'npm:openai@4.28.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
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
      // Download the base image for variations
      const baseImageResponse = await fetch('https://images.pexels.com/photos/3662157/pexels-photo-3662157.jpeg');
      const baseImageBlob = await baseImageResponse.blob();

      // Convert blob to File object
      const baseImageFile = new File([baseImageBlob], 'base.jpg', { type: 'image/jpeg' });

      // Generate variations using image edits
      const variations = await Promise.all([1, 2, 3].map(async () => {
        const result = await openai.images.edit({
          image: baseImageFile,
          prompt: `Create a character illustration for a children's book named "${name}". ${description}. The style should be child-friendly and engaging.`,
          model: "gpt-image-1",
          n: 1,
          size: "640x640",
          quality: "high",
          background: "auto",
          moderation: "auto",
        });

        return {
          id: crypto.randomUUID(),
          imageUrl: result.data[0].url,
          seed: result.data[0].seed || '',
          style: 'dall-e-3'
        };
      }));

      response.variations = variations;
    } else {
      // Download the selected variant for sprite sheet generation
      const variantResponse = await fetch(selectedVariantUrl);
      const variantBlob = await variantResponse.blob();
      const variantFile = new File([variantBlob], 'variant.jpg', { type: 'image/jpeg' });

      // Generate sprite sheet using image edits
      const spriteSheetResult = await openai.images.edit({
        image: variantFile,
        prompt: `Create a sprite sheet showing front, side, and back views of this character: ${description}. Arrange the views horizontally in a single image. Match the exact style of the input image.`,
        model: "gpt-image-1",
        n: 1,
        size: "640x640",
        quality: "high",
        background: "auto",
        moderation: "auto",
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