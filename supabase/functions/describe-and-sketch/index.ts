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
              text: `Analiza cuidadosamente la(s) imágen(es) proporcionada(s) y, si existe, considera también la descripción ingresada por el usuario. Cuando dispongas de ambos elementos (imágenes y descripción del usuario), asigna un peso de 0.6 a la descripción del usuario y 0.4 a la descripción que extraigas únicamente observando las imágenes. Si sólo cuentas con las imágenes, realiza la descripción basándote exclusivamente en ellas.

Describe detalladamente al personaje, cubriendo estos aspectos específicos:

Apariencia física (color y tipo de cabello, color de ojos, contextura, tono de piel, altura aproximada, edad aparente).

Vestimenta (tipo, colores, detalles distintivos, accesorios).

Expresión facial (estado de ánimo aparente, gestos notorios).

Postura (posición corporal, lenguaje corporal evidente).

Cualquier característica distintiva o notable (elementos particulares como objetos especiales, rasgos únicos visibles).

No inventes ni supongas información que no esté claramente visible en las imágenes o proporcionada explícitamente en la descripción del usuario.

Entrega la descripción estructurada en dos idiomas: español latino e inglés, dentro de un arreglo claramente etiquetado para facilitar la selección posterior del idioma requerido, siguiendo este formato:

{
"es": "[Descripción en español latino]",
"en": "[Description in English]"
}

Asegúrate de mantener coherencia y precisión en ambas versiones del texto.

Antecedentes del usuario dados por el usuario:
Edad del personaje: ${age}
Notas del usuario: ${userNotes}`
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
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const descriptions = JSON.parse(analysisResponse.choices[0].message.content);

    // Generate thumbnail using Spanish description
    const imageResponseES = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a character illustration for a children's book. The character is ${name}, ${age}. ${descriptions.es}. Style should be child-friendly and engaging.`,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    // Generate thumbnail using English description
    const imageResponseEN = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a character illustration for a children's book. The character is ${name}, ${age}. ${descriptions.en}. Style should be child-friendly and engaging.`,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    return new Response(
      JSON.stringify({
        description: descriptions.es, // Store Spanish description in character.description
        thumbnailUrl: imageResponseES.data[0].url, // Use Spanish version as primary thumbnail
        thumbnailUrlEN: imageResponseEN.data[0].url, // Store English version as alternative
        descriptions // Store both descriptions for future use
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