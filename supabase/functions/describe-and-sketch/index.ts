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
    const { imageBase64, userNotes, name, age } = await req.json();
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Analyze image and text
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analiza esta imagen y combínala con la siguiente información:
                Nombre: ${name}
                Edad: ${age}
                Notas del usuario: ${userNotes}
                
                Genera una descripción detallada del personaje basada en la imagen y la información proporcionada.` 
            },
            { 
              type: "image_url", 
              image_url: { 
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              } 
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    // Generate thumbnail
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a character illustration for a children's book. The character is ${name}, ${age}. ${analysisResponse.choices[0].message.content}. Style should be child-friendly and engaging.`,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    return new Response(
      JSON.stringify({
        description: analysisResponse.choices[0].message.content,
        thumbnailUrl: imageResponse.data[0].url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in describe-and-sketch:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});