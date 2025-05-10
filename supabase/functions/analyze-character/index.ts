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
    const apiKey = import.meta.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Try to get the key from the request headers
      const authHeader = req.headers.get('x-openai-key');
      if (!authHeader) {
        throw new Error('OpenAI API key not found');
      }
      if (!authHeader.startsWith('sk-')) {
        throw new Error('Invalid OpenAI API key format');
      }
      apiKey = authHeader;
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const { image } = await req.json();
    if (!image) {
      throw new Error('No image data provided');
    }

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
    
    let errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    // Add additional information if it's an OpenAI error
    if (error.response?.data?.error) {
      errorMessage += `: ${error.response.data.error.message}`;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});