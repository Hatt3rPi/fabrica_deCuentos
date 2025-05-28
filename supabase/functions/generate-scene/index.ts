import OpenAI from 'npm:openai@4.28.0';
import { logPromptMetric } from '../_shared/metrics.ts';

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

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

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
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `${identityBlocks}\n${sceneBlock}`,
      referenced_image_ids: characters.flatMap(char =>
        char.referenceUrls.slice(0, 2)
      ),
      size: "1024x1024",
      n: 1
    });
    const elapsed = Date.now() - start;
    await logPromptMetric({
      modelo_ia: 'gpt-image-1',
      tiempo_respuesta_ms: elapsed,
      estado: response.data?.[0]?.url ? 'success' : 'error',
    });

    return new Response(
      JSON.stringify({ imageUrl: response.data[0].url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    await logPromptMetric({
      modelo_ia: 'gpt-image-1',
      tiempo_respuesta_ms: 0,
      estado: 'error',
      metadatos: { error: (error as Error).message },
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});