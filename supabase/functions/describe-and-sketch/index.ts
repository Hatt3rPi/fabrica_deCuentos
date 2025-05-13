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
    const { image, text } = await req.json();
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Analizar imagen y texto
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Analiza esta imagen y combínala con la descripción: ${text}` },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ]
    });

    // Generar thumbnail
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: analysisResponse.choices[0].message.content || "",
      size: "256x256",
      quality: "standard",
      n: 1,
    });

    return new Response(
      JSON.stringify({
        description: analysisResponse.choices[0].message.content,
        thumbnail: imageResponse.data[0].url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});