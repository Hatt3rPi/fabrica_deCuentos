import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate image base64 string
function isValidBase64Image(str: string) {
  if (!str) return false;
  try {
    if (str.startsWith('data:image/')) {
      const base64 = str.split(',')[1];
      return base64 && base64.length > 0;
    }
    return /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(str);
  } catch {
    return false;
  }
}

// Clean and validate text
function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text).replace(/[^\w\s.,!?-]/g, '').trim().slice(0, 500);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image, name, age, description } = await req.json();
    
    if (!image && !description) {
      throw new Error('Se requiere una imagen o descripción');
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Generate initial sketch
    const sketchPrompt = `Convert this character into a children's book character.
Clean pencil drawing, simple lines.
Full body illustration.
White background.
Name: ${sanitizeText(name)}
Age: ${sanitizeText(age)}
Description: ${sanitizeText(description)}`;

    const sketchResponse = await openai.images.edit({
      image: image,
      prompt: sketchPrompt,
      size: "512x512",
      n: 1,
    });

    const thumbnailUrl = sketchResponse.data[0].url;

    // Generate three reference views
    const views = [
      "Full body front view, white background.",
      "Full body three-quarter left view, white background.",
      "Full body right profile view, white background."
    ];

    const referenceUrls = await Promise.all(
      views.map(async (viewPrompt) => {
        const response = await openai.images.edit({
          image: image,
          prompt: `${sketchPrompt}\n${viewPrompt}`,
          size: "512x512",
          n: 1,
        });
        return response.data[0].url;
      })
    );

    // Generate bilingual description
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this character and provide a detailed description in both Spanish and English. Include:
- Physical appearance (hair, eyes, build, height, etc.)
- Base clothing and accessories
- Personality traits visible in expression/posture
Format as JSON: { "es": "Spanish description", "en": "English description" }`
            },
            {
              type: "image_url",
              image_url: { url: thumbnailUrl }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const description = JSON.parse(analysisResponse.choices[0].message.content);

    return new Response(
      JSON.stringify({
        thumbnailUrl,
        referenceUrls,
        description
      }),
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