import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 segundos entre reintentos

async function downloadImage(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

// Función para convertir ArrayBuffer a Blob
function arrayBufferToBlob(buffer: ArrayBuffer, type: string = 'image/png'): Blob {
  return new Blob([buffer], { type });
}

async function generateImageWithRetry(
  prompt: string,
  referenceImages: Blob[],
  retries = MAX_RETRIES
): Promise<{ url: string }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('model', 'gpt-image-1');
      formData.append('prompt', prompt);
      formData.append('size', '1024x1024');
      formData.append('n', '1');
      
      // Si no hay imágenes, usar generación estándar
      if (referenceImages.length === 0) {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt,
            size: '1024x1024',
            n: 1
          }),
        });
        
        const data = await response.json();
        
        // gpt-image-1 siempre devuelve la imagen en base64
        if (data.data?.[0]?.b64_json) {
          return { url: `data:image/png;base64,${data.data[0].b64_json}` };
        }
        
        throw new Error(data.error?.message || 'No se pudo generar la imagen');
      } else {
        // Para gpt-image-1, podemos enviar múltiples imágenes de referencia
        // Agregar todas las imágenes de referencia al formData
        referenceImages.forEach((img, index) => {
          formData.append('image', img, `reference_${index}.png`);
        });
        
        const response = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: formData
        });
        
        const data = await response.json();
        
        if (data.data?.[0]?.b64_json) {
          return { url: `data:image/png;base64,${data.data[0].b64_json}` };
        }
        
        throw new Error(data.error?.message || 'No se pudo generar la imagen con referencia');
      }
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(`Intento ${attempt} fallido, reintentando en ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  
  throw new Error('Número máximo de reintentos alcanzado');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let promptId: string | undefined;
  let userId: string | null = null;
  const startTime = Date.now();

  try {
    const { story_id, title, visual_style, color_palette, reference_image_ids } = await req.json();
    if (!story_id || !title) {
      throw new Error('Falta story_id o título');
    }

    userId = await getUserId(req);

    // Obtener el prompt
    const { data: promptRow } = await supabaseAdmin
      .from('prompts')
      .select('id, content')
      .eq('type', 'PROMPT_CUENTO_PORTADA')
      .single();
      
    const basePrompt = promptRow?.content || '';
    promptId = promptRow?.id;
    if (!basePrompt) throw new Error('No se encontró el prompt');

    const prompt = basePrompt
      .replace('{style}', visual_style || 'acuarela digital')
      .replace('{palette}', color_palette || 'colores vibrantes')
      .replace('{story}', title);
      
    // Registrar el prompt generado
    console.log('=== PROMPT GENERADO ===');
    console.log(`Story ID: ${story_id}`);
    console.log(`Título: ${title}`);
    console.log(`Estilo visual: ${visual_style || 'No especificado'}`);
    console.log(`Paleta de colores: ${color_palette || 'No especificada'}`);
    console.log('--- Prompt final ---');
    console.log(prompt);
    console.log('=====================');

    // Descargar imágenes de referencia si se proporcionan
    let referenceImages: Blob[] = [];
    if (reference_image_ids?.length > 0) {
      console.log(`Intentando procesar ${reference_image_ids.length} referencias de imágenes`);
      
      // Filtrar URLs vacías o inválidas
      const validUrls = reference_image_ids.filter(url => 
        url && typeof url === 'string' && url.trim() !== ''
      );
      
      if (validUrls.length > 0) {
        try {
          // Procesar todas las imágenes en paralelo
          const downloadPromises = validUrls.map(async (url: string) => {
            try {
              console.log(`Procesando imagen desde: ${url}`);
              
              // Extraer la ruta del archivo de la URL
              const urlObj = new URL(url);
              const pathParts = urlObj.pathname.split('/').filter(Boolean); // Eliminar strings vacíos
              
              // En Supabase, la ruta después de 'storage/v1/object/public/' es el bucket/ruta
              const storageIndex = pathParts.indexOf('storage');
              if (storageIndex === -1 || pathParts[storageIndex + 1] !== 'v1' || 
                  pathParts[storageIndex + 2] !== 'object' || pathParts[storageIndex + 3] !== 'public') {
                throw new Error('Formato de URL no válido: no es una URL de almacenamiento de Supabase');
              }
              
              // La estructura es: storage/v1/object/public/[bucket]/[ruta...]
              const bucket = pathParts[storageIndex + 4]; // El bucket está después de 'public/'
              const filePath = pathParts.slice(storageIndex + 5).join('/'); // El resto es la ruta del archivo
              
              console.log(`Descargando imagen: bucket=${bucket}, ruta=${filePath}`);
              
              const { data: imageData, error: imageError } = await supabaseAdmin.storage
                .from(bucket)
                .download(filePath);
                
              if (imageError) throw imageError;
              if (!imageData) throw new Error('No se pudo obtener los datos de la imagen');
              
              return imageData;
              
            } catch (error) {
              console.error(`Error al procesar imagen ${url}:`, error);
              return null; // Retornar null para filtrar después
            }
          });
          
          // Esperar a que todas las descargas terminen y filtrar las nulas
          const results = await Promise.all(downloadPromises);
          referenceImages = results.filter((img): img is Blob => img !== null);
          
          console.log(`Se descargaron ${referenceImages.length} de ${validUrls.length} imágenes correctamente`);
          
        } catch (error) {
          console.error('Error al procesar imágenes de referencia:', error);
          // Continuar sin imágenes de referencia
          referenceImages = [];
        }
      } else {
        console.log('No hay URLs de imágenes válidas para procesar');
      }
    }

    // Generar imagen con reintentos
    const { url: imageUrl } = await generateImageWithRetry(prompt, referenceImages);
    
    // Convertir base64 a Blob
    const base64Data = imageUrl.split(',')[1];
    const byteString = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], { type: 'image/png' });
    
    // Subir a Supabase Storage
    const path = `covers/${story_id}.png`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('storage')
      .upload(path, blob, { contentType: 'image/png', upsert: true });
      
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('storage')
      .getPublicUrl(path);

    // Actualizar base de datos
    try {
      const { error: upsertError } = await supabaseAdmin
        .from('story_pages')
        .upsert(
          {
            story_id,
            page_number: 0,
            text: title,
            image_url: publicUrl,
            prompt
          },
          { onConflict: 'story_id,page_number' }
        );

      if (upsertError) {
        throw new Error(`Error al actualizar story_pages: ${upsertError.message}`);
      }

      console.log('✅ Portada guardada en story_pages correctamente', {
        story_id,
        page_number: 0,
        image_url: publicUrl
      });
    } catch (error) {
      console.error('Error al actualizar story_pages:', error);
      throw new Error(`No se pudo guardar la portada en la base de datos: ${error.message}`);
    }

    // Registrar métricas
    const elapsed = Date.now() - startTime;
    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: 'gpt-image-1',
      tiempo_respuesta_ms: elapsed,
      estado: 'success',
      error_type: null,
      tokens_entrada: 0,
      tokens_salida: 0,
      usuario_id: userId,
    });

    console.log('✅ Portada generada exitosamente', {
      story_id,
      image_url: publicUrl,
      elapsed_time_ms: elapsed,
      reference_images_used: referenceImages.length
    });

    return new Response(
      JSON.stringify({ coverUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en generate-cover:', error);
    
    if (promptId) {
      await logPromptMetric({
        prompt_id: promptId,
        modelo_ia: 'gpt-image-1',
        tiempo_respuesta_ms: Date.now() - startTime,
        estado: 'error',
        error_type: 'service_error',
        tokens_entrada: 0,
        tokens_salida: 0,
        usuario_id: userId,
        metadatos: { error: (error as Error).message },
      });
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Error al generar la portada',
        details: (error as Error).message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
