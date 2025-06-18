import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';
import { startInflightCall, endInflightCall } from '../_shared/inflight.ts';
import { isActivityEnabled } from '../_shared/stages.ts';
import puppeteer from 'puppeteer';

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
  // Para cuentos infantiles, generamos un diseño visual atractivo
  // con imágenes de fondo y texto superpuesto
  
  const storyPages = pages.filter(p => p.page_number > 0); // Excluir portada
  const coverPage = pages.find(p => p.page_number === 0);
  
  const pagesContent = storyPages
    .map(page => `
      <div class="story-page" style="background-image: url('${page.image_url || ''}')">
        <div class="page-overlay">
          <div class="story-text">
            ${page.text}
          </div>
        </div>
      </div>
    `)
    .join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${story.title}</title>
      <style>
        @page {
          size: A4;
          margin: 0;
          padding: 0;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body { 
          margin: 0; 
          padding: 0;
          font-family: 'Comic Sans MS', 'Comic Sans', cursive;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* PORTADA - Imagen de fondo con título superpuesto */
        .cover-page {
          width: 100%;
          height: 100vh;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          page-break-after: always;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          ${coverPage?.image_url ? `background-image: url('${coverPage.image_url}');` : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'}
        }
        
        .cover-overlay {
          background: rgba(255, 255, 255, 0.85);
          padding: 2rem 3rem;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          backdrop-filter: blur(5px);
          border: 3px solid #fff;
          max-width: 80%;
        }
        
        .cover-title {
          font-size: 3.5rem;
          font-weight: bold;
          color: #2c3e50;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          line-height: 1.2;
        }
        
        .cover-subtitle {
          font-size: 1.2rem;
          color: #7f8c8d;
          margin: 1rem 0 0 0;
          font-style: italic;
        }
        
        /* PÁGINAS DEL CUENTO - Imagen de fondo con texto superpuesto */
        .story-page {
          width: 100%;
          height: 100vh;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          page-break-after: always;
          position: relative;
          display: flex;
          align-items: flex-end;
          padding: 0;
          margin: 0;
        }
        
        .page-overlay {
          width: 100%;
          background: linear-gradient(transparent 0%, rgba(0,0,0,0.1) 40%, rgba(255,255,255,0.95) 70%, rgba(255,255,255,0.98) 100%);
          padding: 3rem 4rem 4rem 4rem;
          min-height: 40%;
          display: flex;
          align-items: center;
        }
        
        .story-text {
          font-size: 1.8rem;
          line-height: 1.6;
          color: #2c3e50;
          text-align: center;
          width: 100%;
          font-weight: 500;
          text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
          background: rgba(255, 255, 255, 0.9);
          padding: 2rem;
          border-radius: 15px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          border: 2px solid rgba(255,255,255,0.8);
        }
        
        /* Páginas sin imagen - diseño alternativo */
        .story-page:not([style*="background-image"]) {
          background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
        }
        
        .story-page:nth-child(even):not([style*="background-image"]) {
          background: linear-gradient(135deg, #a8e6cf 0%, #88d8c0 100%);
        }
        
        .story-page:nth-child(3n):not([style*="background-image"]) {
          background: linear-gradient(135deg, #ffd3e1 0%, #c44569 100%);
        }
        
        /* Optimizaciones para impresión */
        @media print {
          .cover-title {
            font-size: 3rem;
          }
          
          .story-text {
            font-size: 1.6rem;
          }
          
          .page-overlay {
            padding: 2rem 3rem 3rem 3rem;
          }
        }
        
        /* Evitar saltos de página dentro de elementos */
        .cover-page, .story-page {
          page-break-inside: avoid;
        }
        
        .story-text {
          orphans: 3;
          widows: 3;
        }
      </style>
    </head>
    <body>
      <!-- PORTADA -->
      <div class="cover-page">
        <div class="cover-overlay">
          <h1 class="cover-title">${story.title}</h1>
          <p class="cover-subtitle">Cuento mágico</p>
        </div>
      </div>

      <!-- PÁGINAS DEL CUENTO -->
      ${pagesContent}
      
    </body>
    </html>
  `;
}

async function generatePDFFromHTML(htmlContent: string): Promise<Uint8Array> {
  console.log('[story-export] Iniciando generación de PDF con Browserless.io API...');
  
  try {
    // Obtener token de Browserless.io
    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');
    if (!browserlessToken) {
      throw new Error('BROWSERLESS_TOKEN no configurado en variables de entorno');
    }

    console.log('[story-export] Enviando HTML a Browserless.io API...');
    
    // Usar API REST de Browserless.io (endpoint moderno)
    const response = await fetch(`https://production-sfo.browserless.io/pdf?token=${browserlessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        options: {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '1cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm'
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browserless.io API error: ${response.status} - ${errorText}`);
    }

    console.log('[story-export] PDF generado por Browserless.io, descargando...');
    
    const pdfBuffer = await response.arrayBuffer();
    console.log('[story-export] PDF descargado exitosamente, tamaño:', pdfBuffer.byteLength, 'bytes');
    
    return new Uint8Array(pdfBuffer);
    
  } catch (error) {
    console.error('[story-export] Error en generación de PDF:', error);
    throw new Error(`Error generando PDF: ${error.message}`);
  }
}

async function uploadPDFToStorage(storyId: string, pdfBuffer: Uint8Array, userId: string): Promise<string> {
  console.log('[story-export] Subiendo PDF a storage...');
  
  const timestamp = Date.now();
  const fileName = `story-${storyId}-${timestamp}.pdf`;
  const filePath = `exports/${userId}/${fileName}`;
  
  const { data, error } = await supabaseAdmin.storage
    .from('exports')
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
    .from('exports')
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