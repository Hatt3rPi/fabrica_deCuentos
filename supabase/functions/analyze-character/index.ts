const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image, imageUrl } = await req.json();
    if (!image && !imageUrl) {
      throw new Error('No image data or URL provided');
    }

    console.log('Sending request to OpenAI API...');

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image and provide a JSON response with the following structure: { description: string }. Observe carefully and describe what you see in detail."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl || image
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        response_format: { type: "json_object" }
      })
    });

    const responseData = await response.json();
    console.log('OpenAI API Response:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      throw new Error(responseData.error?.message || 'Failed to analyze image');
    }

    if (!responseData.choices?.[0]?.message?.content) {
      throw new Error('No analysis result received from OpenAI');
    }

    const description = JSON.parse(responseData.choices[0].message.content).description;
    console.log('Extracted description:', description);

    return new Response(
      JSON.stringify({ description }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in analyze-character function:', error);
    
    let errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});