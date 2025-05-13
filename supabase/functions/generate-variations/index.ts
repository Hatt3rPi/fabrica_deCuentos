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
      model: "dall-e-2",
      prompt: `Clean pencil sketch portrait for a children's book. ` +
        `Character: ${age}. ${description}. Simple lines, no background, child-friendly.`,
      size: "256x256",
      //quality: "standard",
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