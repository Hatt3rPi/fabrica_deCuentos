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
        @page {
          size: A4;
          margin: 2cm 1.5cm;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Georgia', 'Times New Roman', serif; 
          margin: 0; 
          padding: 0;
          line-height: 1.6;
          color: #333;
          font-size: 12pt;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .cover {
          text-align: center;
          page-break-after: always;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2cm;
        }
        
        .cover h1 {
          font-size: 2.8em;
          color: #4a154b;
          margin-bottom: 0.8em;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        
        ${coverPage?.image_url ? `
        .cover-image {
          max-width: 350px;
          max-height: 400px;
          width: auto;
          height: auto;
          margin: 1.5em auto;
          border-radius: 12px;
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
          object-fit: contain;
        }` : ''}
        
        .cover p {
          font-size: 1.1em;
          color: #666;
          margin: 0.5em 0;
          font-style: italic;
        }
        
        .metadata {
          padding: 1.5em;
          background: #f8f9fa;
          border-left: 6px solid #4a154b;
          page-break-after: always;
          margin-bottom: 0;
        }
        
        .metadata h2 {
          color: #4a154b;
          margin-top: 0;
          margin-bottom: 1em;
          font-size: 1.5em;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 0.5em;
        }
        
        .metadata p {
          margin: 0.8em 0;
          font-size: 1em;
        }
        
        .metadata strong {
          color: #4a154b;
          font-weight: bold;
        }
        
        .characters-list {
          margin: 1em 0;
          padding-left: 1.5em;
          background: #fff;
          padding: 1em 1.5em;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }
        
        .page {
          page-break-before: always;
          min-height: 85vh;
          padding: 1em 0;
          position: relative;
        }
        
        .page:first-of-type {
          page-break-before: auto;
        }
        
        .page-number {
          text-align: center;
          font-style: italic;
          color: #888;
          margin-bottom: 2em;
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .page-content {
          max-width: 100%;
          margin: 0 auto;
          padding: 0 1em;
        }
        
        .page-content p {
          font-size: 1.15em;
          text-align: justify;
          margin-bottom: 1.5em;
          line-height: 1.7;
          text-indent: 1.5em;
          orphans: 3;
          widows: 3;
        }
        
        .page-content p:first-of-type {
          text-indent: 0;
        }
        
        .page-content img {
          max-width: 80%;
          max-height: 50vh;
          width: auto;
          height: auto;
          display: block;
          margin: 1.5em auto;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.12);
          object-fit: contain;
          page-break-inside: avoid;
        }
        
        .footer {
          position: fixed;
          bottom: 1cm;
          right: 1.5cm;
          font-size: 0.75em;
          color: #999;
          font-style: italic;
        }
        
        /* Optimizaciones para impresión */
        @media print {
          body {
            font-size: 11pt;
          }
          
          .cover h1 {
            font-size: 2.5em;
          }
          
          .page-content p {
            font-size: 1.1em;
          }
          
          img {
            max-width: 75% !important;
          }
        }
        
        /* Evitar saltos de página dentro de elementos */
        h1, h2, h3, .page-number, .metadata h2 {
          page-break-after: avoid;
        }
        
        p, .page-content p {
          page-break-inside: avoid;
        }
        
        .page-content img {
          page-break-before: avoid;
          page-break-after: avoid;
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
  console.log('[story-export] Iniciando generación real de PDF con Puppeteer...');
  
  let browser;
  try {
    // Lanzar navegador
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    console.log('[story-export] Navegador iniciado, creando página...');
    
    // Crear nueva página
    const page = await browser.newPage();
    
    // Configurar viewport para PDF
    await page.setViewport({ width: 1200, height: 800 });
    
    // Cargar contenido HTML
    await page.setContent(htmlContent, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });

    console.log('[story-export] Contenido cargado, generando PDF...');
    
    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      preferCSSPageSize: false
    });

    console.log('[story-export] PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');
    
    return new Uint8Array(pdfBuffer);
    
  } catch (error) {
    console.error('[story-export] Error en generación de PDF:', error);
    throw new Error(`Error generando PDF: ${error.message}`);
  } finally {
    // Cerrar navegador siempre
    if (browser) {
      try {
        await browser.close();
        console.log('[story-export] Navegador cerrado correctamente');
      } catch (closeError) {
        console.error('[story-export] Error cerrando navegador:', closeError);
      }
    }
  }
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