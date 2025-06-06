import { logPromptMetric } from '../_shared/metrics.ts';
import { generateWithFlux } from '../_shared/flux.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Character {
  name: string;
  age: string;
  description: string;
  referenceUrls: string[];
}

interface SceneRequest {
  characters: Character[];
  scene: {
    background: string;
    action: string;
    visualStyle: string;
    colorPalette: string;
  };
}

function buildCharacterBlock(character: Character) {
  return `
Nombre: ${character.name}
Edad/apariencia: ${character.age}
Ropa base: ${character.description}
Personalidad: ${character.description}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { characters, scene }: SceneRequest = await req.json();


    // Build identity blocks
    const identityBlocks = characters.map(buildCharacterBlock).join('\n\n');

    // Build scene block
    const sceneBlock = `
Escenario o fondo: ${scene.background}
Acción o pose: ${scene.action}
Mantén los rasgos físicos y la ropa exactamente como en la referencia.
Estilo gráfico: ${scene.visualStyle}
Paleta de color: ${scene.colorPalette}
Ilustración para libro infantil. Formato panorámico si es spread.`;

    // Generate scene image using max 2 reference images per character
    const start = Date.now();
    const payload = {
      model: 'gpt-image-1',
      prompt: `${identityBlocks}\n${sceneBlock}`,
      referenced_image_ids: characters.flatMap((char) =>
        char.referenceUrls.slice(0, 2)
      ),
      size: '1024x1024',
      quality: 'hd',
      n: 1,
    };
    console.log('[generate-scene] [REQUEST]', JSON.stringify(payload));
    let imageUrl = '';
    if (Deno.env.get('FLUX_ENDPOINT')) {
      imageUrl = await generateWithFlux(`${identityBlocks}\n${sceneBlock}`);
    } else {
      const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const response = await imgRes.json();
      if (!response.data?.[0]?.url) {
        throw new Error('No image generated');
      }
      imageUrl = response.data[0].url;
    }
    const elapsed = Date.now() - start;
    await logPromptMetric({
      modelo_ia: 'gpt-image-1',
      tiempo_respuesta_ms: elapsed,
      estado: imageUrl ? 'success' : 'error',
      error_type: imageUrl ? null : 'service_error',
      actividad: 'generar_escena',
      edge_function: 'generate-scene',
    });

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    await logPromptMetric({
      modelo_ia: 'gpt-image-1',
      tiempo_respuesta_ms: 0,
      estado: 'error',
      error_type: 'service_error',
      metadatos: { error: (error as Error).message },
      actividad: 'generar_escena',
      edge_function: 'generate-scene',
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});