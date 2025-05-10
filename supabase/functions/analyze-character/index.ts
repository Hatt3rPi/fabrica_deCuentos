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
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const { image } = await req.json();
    if (!image) {
      throw new Error('No image data provided');
    }

    // Convert base64 to blob
    const imageBlob = await fetch(image).then(res => res.blob());
    const imageFile = new File([imageBlob], 'image.jpg', { type: 'image/jpeg' });

    // Use GPT-4 Vision to analyze the image
    const analysis = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe este personaje en detalle, incluyendo su apariencia física, vestimenta, expresión facial, postura y cualquier característica distintiva. Proporciona una descripción estructurada que pueda usarse para un cuento infantil.',
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    if (!analysis.choices[0]?.message?.content) {
      throw new Error('No analysis result received from OpenAI');
    }

    return new Response(
      JSON.stringify({ description: analysis.choices[0].message.content }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in analyze-character function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});