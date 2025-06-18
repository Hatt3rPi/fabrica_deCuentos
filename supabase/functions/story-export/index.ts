import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';
import { startInflightCall, endInflightCall } from '../_shared/inflight.ts';
import { isActivityEnabled } from '../_shared/stages.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const FILE = 'story-export';
const STAGE = 'exportar';
const ACTIVITY = 'generar_pdf';

interface StoryExportRequest {
  story_id: string;
  save_to_library: boolean;
  format?: 'pdf' | 'epub' | 'web';
  include_metadata?: boolean;
}

interface StoryData {
  id: string;
  title: string;
  user_id: string;
  target_age: string;
  literary_style: string;
  central_message: string;
  additional_details: string;
  created_at: string;
  completed_at: string;
}

interface StoryPage {
  id: string;
  page_number: number;
  text: string;
  image_url: string;
  prompt: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
  age: string;
  thumbnail_url: string;
}

interface DesignSettings {
  visual_style: string;
  color_palette: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let userId: string | null = null;
  let start = 0;

  try {
    const requestData: StoryExportRequest = await req.json();
    const { story_id, save_to_library = true, format = 'pdf', include_metadata = true } = requestData;

    if (!story_id) {
      throw new Error('story_id es requerido');
    }

    userId = await getUserId(req);
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const enabled = await isActivityEnabled(STAGE, ACTIVITY);
    if (!enabled) {
      return new Response(
        JSON.stringify({ error: 'Actividad de exportación deshabilitada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await startInflightCall({
      user_id: userId,
      etapa: STAGE,
      actividad: ACTIVITY,
      modelo: 'pdf-generator',
      input: { story_id, save_to_library, format }
    });

    start = Date.now();

    // 1. Obtener datos completos del cuento
    const storyData = await getCompleteStoryData(story_id, userId);
    
    // 2. Generar PDF
    const pdfBuffer = await generateStoryPDF(storyData, format, include_metadata);
    
    // 3. Subir a Supabase Storage
    const downloadUrl = await uploadPDFToStorage(story_id, pdfBuffer, userId);
    
    // 4. Actualizar estado del cuento
    await markStoryAsCompleted(story_id, downloadUrl, save_to_library);
    
    const elapsed = Date.now() - start;

    // Log metrics
    await logPromptMetric({
      modelo_ia: 'pdf-generator',
      tiempo_respuesta_ms: elapsed,
      estado: 'success',
      tokens_entrada: 0,
      tokens_salida: 0,
      tokens_entrada_cacheados: 0,
      tokens_salida_cacheados: 0,
      usuario_id: userId,
      actividad: ACTIVITY,
      edge_function: FILE,
      metadatos: {
        story_id,
        format,
        save_to_library,
        file_size_kb: Math.round(pdfBuffer.byteLength / 1024)
      }
    });

    await endInflightCall(userId, ACTIVITY);

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl,
        format,
        file_size_kb: Math.round(pdfBuffer.byteLength / 1024),
        story_id
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (err) {
    console.error('[story-export] Error:', err);
    
    const elapsed = Date.now() - start;
    await logPromptMetric({
      modelo_ia: 'pdf-generator',
      tiempo_respuesta_ms: elapsed,
      estado: 'error',
      error_type: 'service_error',
      tokens_entrada: 0,
      tokens_salida: 0,
      tokens_entrada_cacheados: 0,
      tokens_salida_cacheados: 0,
      usuario_id: userId,
      metadatos: { error: (err as Error).message },
      actividad: ACTIVITY,
      edge_function: FILE,
    });

    await endInflightCall(userId, ACTIVITY);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: (err as Error).message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getCompleteStoryData(storyId: string, userId: string) {
  console.log(`[story-export] Obteniendo datos del cuento ${storyId}`);
  
  // Obtener datos del cuento
  const { data: story, error: storyError } = await supabaseAdmin
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .eq('user_id', userId)
    .single();

  if (storyError || !story) {
    throw new Error('Cuento no encontrado o sin permisos de acceso');
  }

  // Obtener páginas del cuento
  const { data: pages, error: pagesError } = await supabaseAdmin
    .from('story_pages')
    .select('*')
    .eq('story_id', storyId)
    .order('page_number');

  if (pagesError) {
    throw new Error('Error al obtener páginas del cuento');
  }

  // Obtener personajes vinculados
  const { data: storyCharacters } = await supabaseAdmin
    .from('story_characters')
    .select('character_id')
    .eq('story_id', storyId);

  let characters: Character[] = [];
  if (storyCharacters && storyCharacters.length > 0) {
    const characterIds = storyCharacters.map(sc => sc.character_id);
    const { data: charactersData } = await supabaseAdmin
      .from('characters')
      .select('*')
      .in('id', characterIds);
    characters = charactersData || [];
  }

  // Obtener configuración de diseño
  const { data: design } = await supabaseAdmin
    .from('story_designs')
    .select('*')
    .eq('story_id', storyId)
    .maybeSingle();

  return {
    story: story as StoryData,
    pages: pages as StoryPage[],
    characters,
    design: design as DesignSettings | null
  };
}

async function generateStoryPDF(
  storyData: { story: StoryData; pages: StoryPage[]; characters: Character[]; design: DesignSettings | null },
  format: string,
  includeMetadata: boolean
): Promise<Uint8Array> {
  console.log('[story-export] Generando PDF...');
  
  // Por ahora generamos un PDF simple con texto
  // En una implementación real usarías una librería como Puppeteer, jsPDF, etc.
  const { story, pages, characters, design } = storyData;
  
  // Crear contenido HTML para convertir a PDF
  const htmlContent = generateHTMLContent(story, pages, characters, design, includeMetadata);
  
  // Simular generación de PDF (en una implementación real usarías Puppeteer o similar)
  const pdfContent = await generatePDFFromHTML(htmlContent);
  
  return pdfContent;
}

function generateHTMLContent(
  story: StoryData,
  pages: StoryPage[],
  characters: Character[],
  design: DesignSettings | null,
  includeMetadata: boolean
): string {
  const charactersList = characters.map(c => `• ${c.name} (${c.age} años)`).join('\n');
  
  const pagesContent = pages
    .filter(p => p.page_number > 0) // Excluir portada
    .map(page => `
      <div class="page">
        <div class="page-number">Página ${page.page_number}</div>
        <div class="page-content">
          <p>${page.text}</p>
          ${page.image_url ? `<img src="${page.image_url}" alt="Ilustración página ${page.page_number}" />` : ''}
        </div>
      </div>
    `)
    .join('');

  const coverPage = pages.find(p => p.page_number === 0);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${story.title}</title>
      <style>
        body { 
          font-family: 'Georgia', serif; 
          margin: 0; 
          padding: 20px;
          line-height: 1.6;
          color: #333;
        }
        .cover {
          text-align: center;
          page-break-after: always;
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .cover h1 {
          font-size: 2.5em;
          color: #4a154b;
          margin-bottom: 1em;
        }
        ${coverPage?.image_url ? `
        .cover-image {
          max-width: 400px;
          height: auto;
          margin: 20px auto;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }` : ''}
        .metadata {
          margin-top: 2em;
          padding: 20px;
          background: #f8f9fa;
          border-left: 4px solid #4a154b;
          page-break-after: always;
        }
        .metadata h2 {
          color: #4a154b;
          margin-top: 0;
        }
        .page {
          page-break-before: always;
          min-height: 80vh;
          padding: 20px 0;
        }
        .page-number {
          text-align: center;
          font-style: italic;
          color: #666;
          margin-bottom: 2em;
        }
        .page-content {
          max-width: 600px;
          margin: 0 auto;
        }
        .page-content p {
          font-size: 1.2em;
          text-align: justify;
          margin-bottom: 2em;
        }
        .page-content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 20px auto;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .characters-list {
          margin: 1em 0;
          padding-left: 20px;
        }
        .footer {
          position: fixed;
          bottom: 20px;
          right: 20px;
          font-size: 0.8em;
          color: #666;
        }
      </style>
    </head>
    <body>
      <!-- Portada -->
      <div class="cover">
        <h1>${story.title}</h1>
        ${coverPage?.image_url ? `<img src="${coverPage.image_url}" alt="Portada" class="cover-image" />` : ''}
        <p><em>Creado con La CuenteAI</em></p>
        <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
      </div>

      ${includeMetadata ? `
      <!-- Metadatos -->
      <div class="metadata">
        <h2>Información del Cuento</h2>
        <p><strong>Título:</strong> ${story.title}</p>
        <p><strong>Edad objetivo:</strong> ${story.target_age}</p>
        <p><strong>Estilo literario:</strong> ${story.literary_style}</p>
        <p><strong>Mensaje central:</strong> ${story.central_message}</p>
        ${story.additional_details ? `<p><strong>Detalles adicionales:</strong> ${story.additional_details}</p>` : ''}
        <p><strong>Estilo visual:</strong> ${design?.visual_style || 'Por defecto'}</p>
        <p><strong>Paleta de colores:</strong> ${design?.color_palette || 'Por defecto'}</p>
        <p><strong>Personajes:</strong></p>
        <div class="characters-list">
          ${charactersList || 'Sin personajes específicos'}
        </div>
        <p><strong>Creado:</strong> ${new Date(story.created_at).toLocaleDateString('es-ES')}</p>
        <p><strong>Completado:</strong> ${new Date(story.completed_at).toLocaleDateString('es-ES')}</p>
      </div>
      ` : ''}

      <!-- Páginas del cuento -->
      ${pagesContent}

      <div class="footer">
        Generado con La CuenteAI - ${new Date().toLocaleDateString('es-ES')}
      </div>
    </body>
    </html>
  `;
}

async function generatePDFFromHTML(htmlContent: string): Promise<Uint8Array> {
  // En una implementación real, aquí usarías Puppeteer para generar PDF desde HTML
  // Por ahora, creamos un PDF simulado con el contenido HTML como texto
  
  console.log('[story-export] Convirtiendo HTML a PDF...');
  
  // Simular delay de procesamiento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Por ahora devolvemos el HTML como texto en un "PDF" simulado
  // En producción reemplazar con: await page.pdf({ format: 'A4', printBackground: true });
  const encoder = new TextEncoder();
  const htmlBytes = encoder.encode(htmlContent);
  
  // Agregar header PDF simple para que sea reconocido como PDF
  const pdfHeader = encoder.encode('%PDF-1.4\n');
  const pdfFooter = encoder.encode('\n%%EOF');
  
  const pdfBuffer = new Uint8Array(pdfHeader.length + htmlBytes.length + pdfFooter.length);
  pdfBuffer.set(pdfHeader, 0);
  pdfBuffer.set(htmlBytes, pdfHeader.length);
  pdfBuffer.set(pdfFooter, pdfHeader.length + htmlBytes.length);
  
  return pdfBuffer;
}

async function uploadPDFToStorage(storyId: string, pdfBuffer: Uint8Array, userId: string): Promise<string> {
  console.log('[story-export] Subiendo PDF a storage...');
  
  const timestamp = Date.now();
  const fileName = `story-${storyId}-${timestamp}.pdf`;
  const filePath = `exports/${userId}/${fileName}`;
  
  const { data, error } = await supabaseAdmin.storage
    .from('stories')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false
    });

  if (error) {
    console.error('[story-export] Error uploading PDF:', error);
    throw new Error('Error al subir el archivo PDF');
  }

  // Obtener URL pública
  const { data: urlData } = supabaseAdmin.storage
    .from('stories')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

async function markStoryAsCompleted(storyId: string, downloadUrl: string, saveToLibrary: boolean): Promise<void> {
  console.log('[story-export] Marcando cuento como completado...');
  
  const updateData: any = {
    status: 'completed',
    completed_at: new Date().toISOString()
  };

  // Si se debe guardar en biblioteca, agregar metadata adicional
  if (saveToLibrary) {
    updateData.export_url = downloadUrl;
    updateData.exported_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin
    .from('stories')
    .update(updateData)
    .eq('id', storyId);

  if (error) {
    console.error('[story-export] Error updating story:', error);
    throw new Error('Error al actualizar el estado del cuento');
  }
}