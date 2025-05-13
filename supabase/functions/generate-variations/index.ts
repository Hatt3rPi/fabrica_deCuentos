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
    const { name, description, age } = await req.json();
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Generate new thumbnail
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a character illustration for a children's book. The character is ${name}, ${age}. ${description}. Style should be child-friendly and engaging. Make this variation unique and different from previous versions.`,
      size: "320x320",
      quality: "standard",
      n: 1,
    });

    return new Response(
      JSON.stringify({
        thumbnailUrl: imageResponse.data[0].url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-variations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});