import OpenAI from 'npm:openai@4.28.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationOptions {
  openai: {
    model: string;
    quality: string;
  };
  stable_diffusion: {
    model: string;
    cfg_scale: number;
    steps: number;
  };
}

async function generateWithOpenAI(
  openai: OpenAI,
  prompt: string,
  options: GenerationOptions['openai']
) {
  const result = await openai.images.generate({
    model: options.model,
    n: 1,
    size: '1024x1024',
    quality: options.quality,
    prompt,
  });

  return {
    id: crypto.randomUUID(),
    imageUrl: result.data[0].url,
    seed: result.data[0].seed || '',
    style: 'dall-e-3'
  };
}

async function generateWithStableDiffusion(
  prompt: string,
  options: GenerationOptions['stable_diffusion']
) {
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('STABILITYDIFUSION_API_KEY')}`,
    },
    body: JSON.stringify({
      cfg_scale: options.cfg_scale,
      steps: options.steps,
      width: 1024,
      height: 1024,
      samples: 1,
      text_prompts: [
        {
          text: prompt,
          weight: 1
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error generating image with Stable Diffusion');
  }

  const result = await response.json();
  const base64Image = result.artifacts[0].base64;
  
  // Convert base64 to URL using Supabase Storage
  const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
  const filename = `${crypto.randomUUID()}.png`;
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: uploadData, error: uploadError } = await supabaseClient
    .storage
    .from('character-images')
    .upload(filename, imageBuffer, {
      contentType: 'image/png',
      cacheControl: '3600'
    });

  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabaseClient
    .storage
    .from('character-images')
    .getPublicUrl(filename);

  return {
    id: crypto.randomUUID(),
    imageUrl: publicUrl.publicUrl,
    seed: result.artifacts[0].seed.toString(),
    style: 'stable-diffusion'
  };
}

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

    // Get current engine settings
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'image_generation')
      .single();

    if (settingsError) throw settingsError;

    const settings = settingsData.value;
    const engine = settings.engine;
    const options = settings.options;

    let response = {};

    if (!generateSpriteSheet) {
      // Generate variations one at a time
      const variations = [];
      const basePrompt = `Create a character illustration for a children's book named "${name}". ${description}. The style should be child-friendly and engaging.`;

      for (let i = 0; i < 3; i++) {
        const prompt = `${basePrompt} Make this variation unique and different from the others.`;
        
        const variation = engine === 'openai'
          ? await generateWithOpenAI(openai, prompt, options.openai)
          : await generateWithStableDiffusion(prompt, options.stable_diffusion);

        variations.push(variation);
      }
      
      response.variations = variations;
    } else {
      // Generate sprite sheet
      const spriteSheetPrompt = `Create a sprite sheet showing front, side, and back views of this character: ${description}. Arrange the views horizontally in a single image. Match the exact style of the input image.`;
      
      const spriteSheet = engine === 'openai'
        ? await generateWithOpenAI(openai, spriteSheetPrompt, options.openai)
        : await generateWithStableDiffusion(spriteSheetPrompt, options.stable_diffusion);

      response.spriteSheet = {
        ...spriteSheet,
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