import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Character {
  name: string;
  age: string;
  description: {
    es: string;
    en: string;
  };
  referenceUrls: string[];
}

interface SceneRequest {
  characters: Character[];
  scene: {
    background: string;
    action: string;
    visualStyle: string;
    colorPalette: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { characters, scene }: SceneRequest = await req.json();

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Build character identity blocks
    const characterBlocks = characters.map(char => `
Character: ${char.name}
Age/Appearance: ${char.age}
Base description: ${char.description.en}
    `).join('\n');

    // Build scene block
    const sceneBlock = `
Scene:
- Background: ${scene.background}
- Action: ${scene.action}
- Keep physical traits and clothing exactly as in reference images
- Visual style: ${scene.visualStyle}
- Color palette: ${scene.colorPalette}
- Children's book illustration. Panoramic format for spreads.
    `;

    // Generate scene image
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `${characterBlocks}\n${sceneBlock}`,
      referenced_image_ids: characters.flatMap(char => 
        char.referenceUrls.slice(0, 2) // Use max 2 references per character
      ),
      size: "1792x1024",
      quality: "hd",
      n: 1,
    });

    return new Response(
      JSON.stringify({ imageUrl: response.data[0].url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});