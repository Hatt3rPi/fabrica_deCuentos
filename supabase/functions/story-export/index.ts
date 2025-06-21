import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';
import { startInflightCall, endInflightCall } from '../_shared/inflight.ts';
import { isActivityEnabled } from '../_shared/stages.ts';
import puppeteer from 'npm:puppeteer';

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

    console.log(`[story-export] 🚀 Iniciando export para story: ${story_id}`);
    console.log(`[story-export] 📋 Parámetros:`, { story_id, save_to_library, format, include_metadata });

    if (!story_id) {
      throw new Error('story_id es requerido');
    }

    userId = await getUserId(req);
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    console.log(`[story-export] 👤 User ID: ${userId}`);

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
    const downloadUrl = await uploadPDFToStorage(story_id, pdfBuffer, userId, storyData.story.title);
    
    // 4. Actualizar estado del cuento
    try {
      await markStoryAsCompleted(story_id, downloadUrl, save_to_library);
      console.log('[story-export] ✅ Estado del cuento actualizado exitosamente');
    } catch (markError) {
      console.error('[story-export] ❌ Error marcando cuento como completado:', markError);
      // No lanzar el error para que el PDF se pueda descargar igual
      console.log('[story-export] ⚠️ Continuando con descarga a pesar del error de estado');
    }
    
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

  // Obtener páginas del cuento (solo campos necesarios para la exportación)
  const { data: pages, error: pagesError } = await supabaseAdmin
    .from('story_pages')
    .select('id, page_number, text, image_url')
    .eq('story_id', storyId)
    .order('page_number', { ascending: true })
    .order('id', { ascending: true }); // Campo de desempate para garantizar orden consistente

  if (pagesError) {
    throw new Error('Error al obtener páginas del cuento');
  }

  // Validar que existan páginas y que tengan los datos mínimos requeridos
  if (!pages || pages.length === 0) {
    throw new Error('El cuento no tiene páginas para exportar');
  }

  // Validar que las páginas tengan los campos esenciales
  const invalidPages = pages.filter(page => 
    typeof page.page_number !== 'number' || 
    !page.text || page.text.trim() === '' ||
    !page.image_url || page.image_url.trim() === ''
  );

  if (invalidPages.length > 0) {
    console.warn(`[story-export] Páginas con datos incompletos encontradas: ${invalidPages.length}`);
    // Filtrar páginas inválidas en lugar de fallar completamente
    const validPages = pages.filter(page => 
      typeof page.page_number === 'number' && 
      page.text && page.text.trim() !== '' &&
      page.image_url && page.image_url.trim() !== ''
    );
    
    if (validPages.length === 0) {
      throw new Error('No se encontraron páginas válidas para exportar');
    }
    
    console.log(`[story-export] Usando ${validPages.length} páginas válidas de ${pages.length} total`);
    pages.splice(0, pages.length, ...validPages);
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

  // Obtener configuración de estilos activa (mismo método que usa /read)
  const { data: activeTemplate } = await supabaseAdmin
    .from('story_style_templates')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  // Transformar a la estructura que usa /read
  const styleConfig = activeTemplate ? {
    id: activeTemplate.id,
    name: activeTemplate.name,
    coverConfig: activeTemplate.config_data.cover_config,
    pageConfig: activeTemplate.config_data.page_config,
    coverBackgroundUrl: undefined, // Templates no tienen backgrounds custom
    pageBackgroundUrl: undefined
  } : null;

  return {
    story: story as StoryData,
    pages: pages as StoryPage[],
    characters,
    design: design as DesignSettings | null,
    styleConfig: styleConfig || null
  };
}

async function generateStoryPDF(
  storyData: { story: StoryData; pages: StoryPage[]; characters: Character[]; design: DesignSettings | null; styleConfig: any },
  format: string,
  includeMetadata: boolean
): Promise<Uint8Array> {
  console.log('[story-export] Generando PDF...');
  
  const { story, pages, characters, design, styleConfig } = storyData;
  
  // Detectar aspect ratio de la primera imagen disponible
  const storyPages = pages.filter(p => p.page_number > 0);
  const coverPage = pages.find(p => p.page_number === 0);
  
  let aspectRatio = 'portrait'; // Por defecto
  
  if (coverPage?.image_url) {
    aspectRatio = await detectImageAspectRatio(coverPage.image_url);
  } else if (storyPages.length > 0 && storyPages[0].image_url) {
    aspectRatio = await detectImageAspectRatio(storyPages[0].image_url);
  }
  
  console.log(`[story-export] 🎯 Aspect ratio final para PDF: ${aspectRatio}`);
  
  // Crear contenido HTML para convertir a PDF
  const htmlContent = generateHTMLContent(story, pages, characters, design, includeMetadata, aspectRatio, styleConfig);
  
  // Generar PDF usando Browserless.io con aspect ratio específico
  const pdfContent = await generatePDFFromHTML(htmlContent, aspectRatio);
  
  return pdfContent;
}

// Función para detectar aspect ratio de imagen desde URL
async function detectImageAspectRatio(imageUrl: string): Promise<string> {
  try {
    console.log(`[story-export] 🔍 Iniciando detección de aspect ratio para: ${imageUrl}`);
    
    // Primero intentar con Range headers para optimizar descarga
    console.log(`[story-export] 📥 Descargando primeros bytes de imagen para análisis...`);
    
    // Para PNG necesitamos 24 bytes, para JPEG hasta ~600 bytes para encontrar SOF
    let imageResponse = await fetch(imageUrl, {
      headers: { 'Range': 'bytes=0-1023' } // Solo primer KB
    });
    
    // Si el servidor no soporta Range, hacer descarga normal pero limitada
    if (imageResponse.status === 416 || imageResponse.status === 200) {
      console.log(`[story-export] ⚠️ Servidor no soporta Range headers, descargando inicio de imagen...`);
      imageResponse = await fetch(imageUrl);
    }
    
    if (!imageResponse.ok && imageResponse.status !== 206) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);
    
    console.log(`[story-export] 📊 Bytes descargados: ${uint8Array.length} (optimizado con Range headers)`);
    console.log(`[story-export] 🔬 Primeros 12 bytes: ${Array.from(uint8Array.slice(0, 12)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    
    // Detectar dimensiones desde los primeros bytes de la imagen
    const aspectRatio = analyzeImageDimensions(uint8Array);
    
    console.log(`[story-export] ✅ Aspect ratio detectado: ${aspectRatio}`);
    
    return aspectRatio;
    
  } catch (error) {
    console.error(`[story-export] ❌ Error en detección de aspect ratio:`, error);
    console.log(`[story-export] 🔄 Usando portrait por defecto`);
    return 'portrait';
  }
}

// Función para analizar dimensiones de imagen desde bytes
function analyzeImageDimensions(buffer: Uint8Array): string {
  try {
    console.log(`[story-export] 🔍 Analizando tipo de imagen...`);
    
    // Detectar tipo de imagen y extraer dimensiones
    // PNG signature: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      console.log(`[story-export] 🖼️ Formato detectado: PNG`);
      
      // PNG - las dimensiones están en bytes 16-23
      const width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
      const height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];
      
      console.log(`[story-export] 📏 Dimensiones PNG extraídas: ${width}x${height}`);
      
      return classifyAspectRatio(width, height);
    }
    
    // JPEG signature: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      console.log(`[story-export] 🖼️ Formato detectado: JPEG`);
      
      // Para JPEG es más complejo, buscar en segmentos SOF
      const dimensions = extractJPEGDimensions(buffer);
      if (dimensions) {
        console.log(`[story-export] 📏 Dimensiones JPEG extraídas: ${dimensions.width}x${dimensions.height}`);
        return classifyAspectRatio(dimensions.width, dimensions.height);
      } else {
        console.warn(`[story-export] ⚠️ No se pudieron extraer dimensiones de JPEG`);
      }
    }
    
    // WebP signature: RIFF...WEBP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      console.log(`[story-export] 🖼️ Formato detectado: WebP`);
      console.log(`[story-export] ⚠️ WebP no soportado completamente, usando portrait por defecto`);
      return 'portrait'; // Por defecto
    }
    
    console.warn(`[story-export] ⚠️ Formato de imagen no reconocido`);
    
  } catch (error) {
    console.error('[story-export] ❌ Error analizando dimensiones de imagen:', error);
  }
  
  console.log(`[story-export] 🔄 Fallback a portrait por defecto`);
  return 'portrait'; // Por defecto
}

// Función para extraer dimensiones de JPEG (básica)
function extractJPEGDimensions(buffer: Uint8Array): { width: number; height: number } | null {
  let i = 2; // Skip FF D8
  
  while (i < buffer.length - 1) {
    if (buffer[i] === 0xFF) {
      const marker = buffer[i + 1];
      
      // SOF0, SOF1, SOF2 markers contienen dimensiones
      if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
        if (i + 9 < buffer.length) {
          const height = (buffer[i + 5] << 8) | buffer[i + 6];
          const width = (buffer[i + 7] << 8) | buffer[i + 8];
          return { width, height };
        }
      }
      
      // Skip this segment
      if (i + 3 < buffer.length) {
        const segmentLength = (buffer[i + 2] << 8) | buffer[i + 3];
        i += 2 + segmentLength;
      } else {
        break;
      }
    } else {
      i++;
    }
  }
  
  return null;
}

// Función para clasificar aspect ratio basado en dimensiones
function classifyAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  
  console.log(`[story-export] 📐 Clasificando aspect ratio:`);
  console.log(`[story-export] 📏 Dimensiones: ${width}x${height}`);
  console.log(`[story-export] 📊 Ratio calculado: ${ratio.toFixed(3)}`);
  
  // Clasificar según ratios conocidos de GPT-image-1
  if (Math.abs(ratio - 1.0) < 0.1) {
    console.log(`[story-export] ⬛ Clasificado como: SQUARE (ratio ≈ 1.0)`);
    return 'square'; // 1024x1024 (ratio ≈ 1.0)
  } else if (ratio > 1.3) {
    console.log(`[story-export] ⬜ Clasificado como: LANDSCAPE (ratio > 1.3)`);
    return 'landscape'; // 1536x1024 (ratio = 1.5)
  } else {
    console.log(`[story-export] 📱 Clasificado como: PORTRAIT (ratio < 1.3)`);
    return 'portrait'; // 1024x1536 (ratio ≈ 0.67)
  }
}

// Función para generar CSS dinámico basado en aspect ratio
function generateDynamicPageCSS(aspectRatio: string): string {
  console.log(`[story-export] 🎨 Generando CSS dinámico para formato: ${aspectRatio}`);
  
  switch (aspectRatio) {
    case 'square': // 1024x1024
      console.log(`[story-export] ⬛ Aplicando CSS para páginas cuadradas (21cm x 21cm)`);
      return `
        @page {
          size: 21cm 21cm; /* Página cuadrada */
          margin: 0;
          padding: 0;
        }
        
        .story-page, .cover-page {
          width: 21cm;
          height: 21cm;
        }
      `;
      
    case 'landscape': // 1536x1024
      console.log(`[story-export] ⬜ Aplicando CSS para páginas landscape (29.7cm x 21cm)`);
      return `
        @page {
          size: 29.7cm 21cm; /* A4 landscape */
          margin: 0;
          padding: 0;
        }
        
        .story-page, .cover-page {
          width: 29.7cm;
          height: 21cm;
        }
      `;
      
    case 'portrait': // 1024x1536
    default:
      console.log(`[story-export] 📱 Aplicando CSS para páginas portrait (21cm x 29.7cm)`);
      return `
        @page {
          size: 21cm 29.7cm; /* A4 portrait */
          margin: 0;
          padding: 0;
        }
        
        .story-page, .cover-page {
          width: 21cm;
          height: 29.7cm;
        }
      `;
  }
}

function generateHTMLContent(
  story: StoryData,
  pages: StoryPage[],
  characters: Character[],
  design: DesignSettings | null,
  includeMetadata: boolean,
  aspectRatio: string = 'portrait',
  styleConfig: any = null
): string {
  // Para cuentos infantiles, generamos un diseño visual atractivo
  // con imágenes de fondo y texto superpuesto
  
  const storyPages = pages.filter(p => p.page_number > 0); // Excluir portada
  const coverPage = pages.find(p => p.page_number === 0);
  
  console.log(`[story-export] 🎨 Generando HTML con aspect ratio: ${aspectRatio}`);
  console.log(`[story-export] 📖 Total páginas: ${pages.length}`);
  console.log(`[story-export] 📑 Páginas interiores: ${storyPages.length}`);
  console.log(`[story-export] 🏠 Portada encontrada:`, coverPage ? 'SÍ' : 'NO');
  console.log(`[story-export] 🖼️ Imagen de portada:`, coverPage?.image_url || 'NINGUNA');
  
  // Generar CSS dinámico basado en aspect ratio
  const dynamicCSS = generateDynamicPageCSS(aspectRatio);
  
  // Definir configuraciones fuera del scope para uso global
  const coverConfig = styleConfig?.coverConfig?.title || {};
  const pageConfig = styleConfig?.pageConfig?.text || {};
  
  if (styleConfig) {
    console.log('[story-export] 🎨 Configuración de estilos detectada:');
    console.log(`[story-export] 📝 pageConfig.fontSize: ${pageConfig.fontSize}`);
    console.log(`[story-export] 📐 pageConfig.position: ${pageConfig.position}`);
    console.log(`[story-export] 🎨 pageConfig.containerStyle.background: ${pageConfig.containerStyle?.background}`);
    console.log(`[story-export] 📏 pageConfig.containerStyle.padding: ${pageConfig.containerStyle?.padding}`);
    console.log(`[story-export] 🎨 coverConfig.fontFamily: ${coverConfig.fontFamily}`);
    console.log(`[story-export] 📐 coverConfig.position: ${coverConfig.position}`);
  }
  
  // Extraer fuentes únicas para importar de Google Fonts
  const extractFontName = (fontFamily: string): string => {
    if (!fontFamily) return '';
    // Primero remover todos los escapes
    let cleaned = fontFamily.replace(/\\/g, '');
    // Buscar contenido entre las comillas más internas
    const match = cleaned.match(/["']([^"']+)["']/);
    if (match) {
      return match[1].trim();
    }
    // Fallback: limpiar comillas y tomar primera parte
    return cleaned.replace(/["']/g, '').split(',')[0].trim();
  };
  
  const fonts = new Set<string>();
  if (coverConfig.fontFamily) {
    const coverFont = extractFontName(coverConfig.fontFamily);
    if (coverFont && coverFont !== 'cursive' && coverFont !== 'sans-serif') {
      fonts.add(coverFont);
    }
  }
  if (pageConfig.fontFamily) {
    const pageFont = extractFontName(pageConfig.fontFamily);
    if (pageFont && pageFont !== 'cursive' && pageFont !== 'sans-serif') {
      fonts.add(pageFont);
    }
  }
  // Siempre incluir Indie Flower como fallback
  fonts.add('Indie Flower');
  
  // Generar imports de Google Fonts
  const fontImports = Array.from(fonts).map(font => {
    // Manejar espacios en nombres de fuentes
    const urlFont = font.replace(/\s+/g, '+');
    return `<link href="https://fonts.googleapis.com/css2?family=${urlFont}&display=swap" rel="stylesheet">`;
  }).join('\n      ');
  
  console.log(`[story-export] 📚 Fuentes a importar:`, Array.from(fonts));

  // Generar estilos dinámicos desde la configuración (misma estructura que /read)
  const generateDynamicStyles = () => {
    if (!styleConfig) {
      console.log('[story-export] ⚠️ No styleConfig encontrado, usando estilos por defecto');
      return '';
    }
    
    // Procesar fontFamily correctamente (remover escapes y comillas extras)
    const processFontFamily = (fontFamily: string): string => {
      if (!fontFamily) return 'Indie Flower';
      // Primero remover todos los escapes
      let cleaned = fontFamily.replace(/\\/g, '');
      // Buscar contenido entre las comillas más internas
      const match = cleaned.match(/["']([^"']+)["']/);
      if (match) {
        return match[1].trim();
      }
      // Fallback: limpiar comillas y tomar primera parte
      return cleaned.replace(/["']/g, '').split(',')[0].trim();
    };
    
    const coverFontFamily = processFontFamily(coverConfig.fontFamily);
    const pageFontFamily = processFontFamily(pageConfig.fontFamily);
    
    console.log(`[story-export] 🔤 Cover font procesada: "${coverFontFamily}" (original: "${coverConfig.fontFamily}")`);
    console.log(`[story-export] 🔤 Page font procesada: "${pageFontFamily}" (original: "${pageConfig.fontFamily}")`);
    
    return `
      /* Estilos dinámicos de portada - Con !important para override */
      .cover-title {
        font-family: ${coverFontFamily}, cursive !important;
        font-size: ${coverConfig.fontSize || '4rem'} !important;
        font-weight: ${coverConfig.fontWeight || 'bold'} !important;
        color: ${coverConfig.color || 'white'} !important;
        text-shadow: ${coverConfig.textShadow || '3px 3px 6px rgba(0,0,0,0.8)'} !important;
        text-align: ${coverConfig.textAlign || 'center'} !important;
        ${coverConfig.letterSpacing ? `letter-spacing: ${coverConfig.letterSpacing} !important;` : ''}
        ${coverConfig.textTransform ? `text-transform: ${coverConfig.textTransform} !important;` : ''}
      }
      
      .cover-overlay {
        background: ${coverConfig.containerStyle?.background || 'transparent'} !important;
        padding: ${coverConfig.containerStyle?.padding || '2rem 3rem'} !important;
        border-radius: ${coverConfig.containerStyle?.borderRadius || '0'} !important;
        max-width: ${coverConfig.containerStyle?.maxWidth || '85%'} !important;
        ${coverConfig.containerStyle?.border ? `border: ${coverConfig.containerStyle.border} !important;` : ''}
        ${coverConfig.containerStyle?.boxShadow ? `box-shadow: ${coverConfig.containerStyle.boxShadow} !important;` : ''}
        ${coverConfig.containerStyle?.backdropFilter ? `backdrop-filter: ${coverConfig.containerStyle.backdropFilter} !important;` : ''}
      }
      
      /* Posicionamiento dinámico de portada */
      .cover-page {
        ${coverConfig.position === 'top' ? 'align-items: flex-start !important; padding-top: 3rem !important;' : ''}
        ${coverConfig.position === 'center' ? 'align-items: center !important; padding-top: 0 !important;' : ''}
        ${coverConfig.position === 'bottom' ? 'align-items: flex-end !important; padding-bottom: 3rem !important; padding-top: 0 !important;' : ''}
      }
      
      /* Estilos dinámicos de páginas */
      .story-text {
        font-family: ${pageFontFamily}, cursive !important;
        font-size: ${pageConfig.fontSize || '2.2rem'} !important;
        font-weight: ${pageConfig.fontWeight || '600'} !important;
        line-height: ${pageConfig.lineHeight || '1.4'} !important;
        color: ${pageConfig.color || 'white'} !important;
        text-shadow: ${pageConfig.textShadow || '3px 3px 6px rgba(0,0,0,0.9)'} !important;
        text-align: ${pageConfig.textAlign || 'center'} !important;
      }
      
      .page-overlay {
        position: relative;
        background: ${pageConfig.containerStyle?.background || 'transparent'} !important;
        padding: ${pageConfig.containerStyle?.padding || '1rem 2rem 6rem 2rem'} !important;
        min-height: ${pageConfig.containerStyle?.minHeight || '25%'} !important;
        width: ${pageConfig.containerStyle?.maxWidth || '100%'} !important;
        ${pageConfig.containerStyle?.border ? `border: ${pageConfig.containerStyle.border} !important;` : ''}
        ${pageConfig.containerStyle?.borderRadius ? `border-radius: ${pageConfig.containerStyle.borderRadius} !important;` : ''}
        ${pageConfig.containerStyle?.boxShadow ? `box-shadow: ${pageConfig.containerStyle.boxShadow} !important;` : ''}
        ${pageConfig.containerStyle?.backdropFilter ? `backdrop-filter: ${pageConfig.containerStyle.backdropFilter} !important;` : ''}
        
        /* Alineación vertical del contenedor basada en template */
        display: flex !important;
        flex-direction: column !important;
        ${pageConfig.verticalAlign ? `justify-content: ${pageConfig.verticalAlign} !important;` : 'justify-content: flex-end !important;'}
      }
      
      /* Gradiente overlay si existe */
      ${pageConfig.containerStyle?.gradientOverlay ? `
      .page-overlay::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${pageConfig.containerStyle.gradientOverlay};
        border-radius: inherit;
        z-index: -1;
      }
      ` : ''}
      
      /* Posicionamiento dinámico basado en template */
      .story-page {
        justify-content: center !important; /* Centrar horizontalmente */
        ${pageConfig.position === 'top' ? 'align-items: flex-start !important;' : ''}
        ${pageConfig.position === 'center' ? 'align-items: center !important;' : ''}
        ${pageConfig.position === 'bottom' ? 'align-items: flex-end !important;' : 'align-items: flex-end !important;'}
      }
    `;
  };
  
  // Función para convertir texto a HTML preservando saltos de línea
  function textToHTML(text: string): string {
    if (!text) return '';
    
    return text
      // Escape HTML characters
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      // Convert line breaks to HTML
      .replace(/\n\n+/g, '</p><p>')  // Multiple line breaks become paragraph breaks
      .replace(/\n/g, '<br>')        // Single line breaks become <br>
      // Wrap in paragraph tags if not empty
      .replace(/^(.+)$/, '<p>$1</p>')
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '');
  }

  // Usar imagen de fondo personalizada si existe (templates no tienen backgrounds custom)
  const pageBackgroundImage = styleConfig?.pageBackgroundUrl || '';
  const coverBackgroundImage = coverPage?.image_url || styleConfig?.coverBackgroundUrl || '';
  
  console.log(`[story-export] 🏞️ Background página:`, pageBackgroundImage || 'NINGUNO');
  console.log(`[story-export] 🌄 Background portada:`, coverBackgroundImage || 'NINGUNO');
  
  const pagesContent = storyPages
    .map(page => `
      <div class="story-page" style="background-image: url('${page.image_url || pageBackgroundImage || ''}')">
        <div class="page-overlay">
          <div class="story-text">
            ${textToHTML(page.text)}
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
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      ${fontImports}
      <style>
        /* Reset y configuración base */
        * {
          box-sizing: border-box;
        }
        
        body { 
          margin: 0; 
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* CSS dinámico de tamaño de página */
        ${dynamicCSS}
        
        /* ESTRUCTURA BASE - Sin estilos hardcodeados */
        .cover-page {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          page-break-after: always;
          position: relative;
          display: flex;
          justify-content: center;
          ${coverBackgroundImage ? `background-image: url('${coverBackgroundImage}');` : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'}
        }
        
        .story-page {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          page-break-after: always;
          position: relative;
          display: flex;
          padding: 0;
          margin: 0;
        }
        
        /* Z-index para asegurar que el texto esté encima del gradiente */
        .story-text {
          position: relative;
          z-index: 1;
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
        
        /* Evitar saltos de página dentro de elementos */
        .cover-page, .story-page {
          page-break-inside: avoid;
        }
        
        .story-text {
          orphans: 3;
          widows: 3;
        }
        
        /* ESTILOS DINÁMICOS DEL TEMPLATE - Aplicados al final para máxima prioridad */
        ${generateDynamicStyles()}
      </style>
    </head>
    <body>
      <!-- PORTADA -->
      <div class="cover-page">
        <div class="cover-overlay">
          <h1 class="cover-title">${story.title}</h1>
        </div>
      </div>

      <!-- PÁGINAS DEL CUENTO -->
      ${pagesContent}
      
    </body>
    </html>
  `;
}

async function generatePDFFromHTML(htmlContent: string, aspectRatio: string = 'portrait'): Promise<Uint8Array> {
  console.log('[story-export] Iniciando generación de PDF con Browserless.io API...');
  console.log(`[story-export] 📐 Formato de PDF solicitado: ${aspectRatio}`);
  
  try {
    // Obtener token de Browserless.io
    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');
    if (!browserlessToken) {
      throw new Error('BROWSERLESS_TOKEN no configurado en variables de entorno');
    }

    // Configurar opciones de PDF según aspect ratio
    let pdfOptions: any = {
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    };

    switch (aspectRatio) {
      case 'square':
        console.log('[story-export] ⬛ Configurando PDF cuadrado...');
        pdfOptions.width = '21cm';
        pdfOptions.height = '21cm';
        break;
      case 'landscape':
        console.log('[story-export] ⬜ Configurando PDF landscape...');
        pdfOptions.format = 'A4';
        pdfOptions.landscape = true;
        break;
      case 'portrait':
      default:
        console.log('[story-export] 📱 Configurando PDF portrait...');
        pdfOptions.format = 'A4';
        pdfOptions.landscape = false;
        break;
    }

    console.log('[story-export] Enviando HTML a Browserless.io API...');
    console.log('[story-export] 🔧 Opciones PDF:', JSON.stringify(pdfOptions));
    
    // Usar API REST de Browserless.io (endpoint moderno)
    const response = await fetch(`https://production-sfo.browserless.io/pdf?token=${browserlessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        options: pdfOptions
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

async function uploadPDFToStorage(storyId: string, pdfBuffer: Uint8Array, userId: string, storyTitle: string): Promise<string> {
  console.log('[story-export] Subiendo PDF a storage...');
  
  // Limpiar título para usar como nombre de archivo
  const cleanTitle = storyTitle
    .toLowerCase()
    // Reemplazar caracteres especiales del español
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/ç/g, 'c')
    // Remover caracteres especiales restantes
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    // Reemplazar múltiples espacios con uno solo
    .replace(/\s+/g, ' ')
    // Reemplazar espacios con guiones
    .replace(/\s/g, '-')
    // Limitar longitud
    .substring(0, 50)
    // Asegurar que no termine en guión
    .replace(/-+$/, '');
  
  const timestamp = Date.now();
  // Fallback si el título queda vacío después de limpieza
  const finalTitle = cleanTitle || 'cuento';
  const fileName = `${finalTitle}-${timestamp}.pdf`;
  const filePath = `exports/${userId}/${fileName}`;
  
  console.log(`[story-export] 📚 Nombre del archivo: "${fileName}"`);
  console.log(`[story-export] 📝 Título original: "${storyTitle}"`);
  console.log(`[story-export] 🧹 Título limpio: "${cleanTitle}"`);
  console.log(`[story-export] 📁 Título final: "${finalTitle}"`);
  
  
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
  console.log('[story-export] 🔄 Marcando cuento como completado...');
  console.log(`[story-export] 📋 Story ID: ${storyId}`);
  console.log(`[story-export] 🔗 Download URL: ${downloadUrl}`);
  console.log(`[story-export] 📚 Save to Library: ${saveToLibrary}`);
  
  const updateData: any = {
    status: 'completed',
    completed_at: new Date().toISOString()
  };

  // Si se debe guardar en biblioteca, agregar metadata adicional
  if (saveToLibrary) {
    updateData.export_url = downloadUrl;
    updateData.exported_at = new Date().toISOString();
  }

  console.log(`[story-export] 📝 Update data:`, JSON.stringify(updateData, null, 2));

  const { data, error } = await supabaseAdmin
    .from('stories')
    .update(updateData)
    .eq('id', storyId)
    .select(); // Agregar select para ver qué se actualizó

  if (error) {
    console.error('[story-export] ❌ Error updating story:', error);
    throw new Error('Error al actualizar el estado del cuento');
  }

  console.log(`[story-export] ✅ Story actualizado exitosamente:`, data);
  console.log(`[story-export] 🎯 Filas afectadas: ${data?.length || 0}`);
  
  if (!data || data.length === 0) {
    console.warn(`[story-export] ⚠️ ADVERTENCIA: No se encontró story con ID ${storyId} para actualizar`);
  }
}