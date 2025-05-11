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
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Observa cuidadosamente todas las imágenes proporcionadas. Todas muestran al mismo personaje desde diferentes ángulos o momentos. Tu tarea es generar una única descripción consolidada del personaje, sin separar la información por imagen.\n\nDescribe exclusivamente lo que es observable directamente en las imágenes.\n\nSi el personaje presenta diferentes atuendos o expresiones, integra todos los elementos relevantes en una sola descripción robusta.\n\nNo incluyas información del entorno, ni describas objetos que no estén claramente relacionados con el personaje. No inventes ni asumas detalles no visibles.\n\nEl resultado debe entregarse en el siguiente formato estructurado, para ser utilizado en un cuento infantil:\n\n    Apariencia física: [Color y estilo de cabello, rasgos faciales, edad aparente, contextura, altura relativa, etc.]\n\n    Vestimenta: [Descripción de una o más tenidas visibles. Incluir colores, patrones, estilo, tipo de calzado, accesorios visibles.]\n\n    Expresión facial y actitud: [Gestos predominantes, emociones visibles, energía del personaje, mirada.]\n\n    Postura y acciones: [Cómo se posiciona, qué hace, si está en movimiento o estática, nivel de dinamismo.]\n\n    Características distintivas: [Detalles únicos como peinados, adornos, marcas, gestos, accesorios o elementos que contribuyen a su identidad visual.]"
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
        max_tokens: 1500
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

    const description = responseData.choices[0].message.content;
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