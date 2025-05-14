import OpenAI from "npm:openai@4.28.0";
import { GenerateIllustrationParams } from "../../../src/types/illustration";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const params: GenerateIllustrationParams = await req.json();
    const {
      identity,
      scene,
      side = "central",
      size = "auto",
      quality = "low",
      output = "png",
      referencedImageIds,
    } = params;

    // Mapear tamaño a API
    let apiSize: string;
    switch (size) {
      case "1024x1024":
        apiSize = "1024x1024";
        break;
      case "1536x1024":
        apiSize = "1536x1024";
        break;
      case "1024x1536":
        apiSize = "1024x1536";
        break;
      default:
        apiSize = "1024x1536";
        break;
    }

    const prompt = `
      Nombre: ${identity.name}
      Edad: ${identity.age}
      Descripción: ${identity.description}

      Escenario o fondo: ${scene.background}
      Acción o pose: ${scene.pose}
      Estilo gráfico: ${scene.style}
      Paleta de color: ${scene.palette}

      Enfoca la acción en el sector ${side}.
      Calidad de imagen: ${quality}.
      Formato de salida: ${output}.

      Mantén los rasgos físicos y la ropa exactamente como en la referencia.
      Ilustración para libro infantil.
    `.trim();

    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: apiSize,
      n: 1,
      referenced_image_ids: referencedImageIds,
      response_format: "url",
    });

    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error("Error: No se generó la imagen.");
    }

    return new Response(
      JSON.stringify({ url: response.data[0].url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating illustration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});