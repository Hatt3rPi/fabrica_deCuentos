import { GenerateIllustrationParams } from "./types.ts";
import { logPromptMetric } from '../_shared/metrics.ts';
import { generateWithFlux } from '../_shared/flux.ts';
import { generateWithOpenAI } from '../_shared/openai.ts';

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

    const start = Date.now();
    const payload = {
      model: 'gpt-image-1',
      prompt,
      size: apiSize,
      quality: 'high',
      n: 1,
      referenced_image_ids: referencedImageIds,
    };
    console.log('[generate-illustration] [REQUEST]', JSON.stringify(payload));

    let imageUrl = '';
    if (Deno.env.get('FLUX_ENDPOINT')) {
      imageUrl = await generateWithFlux(prompt);
    } else {
      const { url } = await generateWithOpenAI({
        endpoint: 'https://api.openai.com/v1/images/generations',
        payload,
      });
      imageUrl = url;
    }

    const elapsed = Date.now() - start;
    await logPromptMetric({
      modelo_ia: 'gpt-image-1',
      tiempo_respuesta_ms: elapsed,
      estado: imageUrl ? 'success' : 'error',
      error_type: imageUrl ? null : 'service_error',
      actividad: 'generar_ilustracion',
      edge_function: 'generate-illustration',
    });

    return new Response(
      JSON.stringify({ url: imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating illustration:', error);
    await logPromptMetric({
      modelo_ia: 'gpt-image-1',
      tiempo_respuesta_ms: 0,
      estado: 'error',
      error_type: 'service_error',
      metadatos: { error: (error as Error).message },
      actividad: 'generar_ilustracion',
      edge_function: 'generate-illustration',
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});