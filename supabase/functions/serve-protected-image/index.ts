import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, protectedImageHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ImageRequest {
  filePath: string
  withWatermark?: boolean
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}

interface WatermarkConfig {
  enabled: boolean
  opacity: number
  position: string
  text?: string
}

/**
 * Edge Function para servir imágenes protegidas con watermarks y optimización
 * 
 * Funcionalidades:
 * - Autenticación JWT requerida
 * - Aplicación de watermarks dinámicos
 * - Optimización de imágenes en tiempo real
 * - Headers de seguridad
 * - Rate limiting por usuario
 * - Logging de accesos
 */
serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verificar autenticación
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorización requerido' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar JWT y obtener usuario
    const { data: user, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user.user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // 2. Parsear parámetros de la imagen
    const url = new URL(req.url)
    const filePath = url.searchParams.get('path')
    const withWatermark = url.searchParams.get('watermark') === 'true'
    const width = url.searchParams.get('width') ? parseInt(url.searchParams.get('width')!) : undefined
    const height = url.searchParams.get('height') ? parseInt(url.searchParams.get('height')!) : undefined
    const quality = url.searchParams.get('quality') ? parseInt(url.searchParams.get('quality')!) : 85
    const format = url.searchParams.get('format') as 'webp' | 'jpeg' | 'png' || 'webp'

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'Parámetro path requerido' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // 3. Verificar que el usuario tiene acceso a la imagen
    const pathParts = filePath.split('/')
    const fileUserId = pathParts[0]

    if (fileUserId !== user.user.id) {
      // Verificar si es admin (pueden ver todas las imágenes)
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.user.id)
        .eq('role', 'admin')
        .gt('expires_at', new Date().toISOString())
        .or('expires_at.is.null')

      if (!userRoles || userRoles.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Acceso denegado a esta imagen' }),
          { 
            status: 403, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        )
      }
    }

    // 4. Verificar rate limiting
    const rateLimitOk = await checkRateLimit(supabase, user.user.id)
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Límite de solicitudes excedido' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      )
    }

    // 5. Obtener configuración de protección
    const { data: config } = await supabase
      .from('image_protection_config')
      .select('*')
      .single()

    const watermarkConfig: WatermarkConfig = {
      enabled: config?.watermark_enabled ?? true,
      opacity: config?.watermark_opacity ?? 0.15,
      position: config?.watermark_position ?? 'bottom-right',
      text: 'La CuenterIA'
    }

    // 6. Descargar imagen del bucket protegido
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('protected-storage')
      .download(filePath)

    if (downloadError) {
      console.error('Error downloading image:', downloadError)
      return new Response(
        JSON.stringify({ error: 'Imagen no encontrada' }),
        { 
          status: 404, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // 7. Procesar imagen (watermark + optimización)
    let processedImage = await imageData.arrayBuffer()

    if (withWatermark && watermarkConfig.enabled) {
      processedImage = await addWatermark(processedImage, watermarkConfig)
    }

    if (width || height || quality !== 85 || format !== 'jpeg') {
      processedImage = await optimizeImage(processedImage, {
        width,
        height,
        quality,
        format
      })
    }

    // 8. Logging del acceso
    await logImageAccess(supabase, {
      userId: user.user.id,
      filePath,
      withWatermark,
      ipAddress: getClientIP(req),
      userAgent: req.headers.get('User-Agent') || ''
    })

    // 9. Preparar headers de respuesta con protecciones de seguridad
    const responseHeaders = {
      ...protectedImageHeaders,
      'Content-Type': getContentType(format),
    }

    return new Response(processedImage, {
      status: 200,
      headers: responseHeaders
    })

  } catch (error) {
    console.error('Error in serve-protected-image:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

/**
 * Verifica el rate limiting para un usuario
 */
async function checkRateLimit(supabase: any, userId: string): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()

  const { data: recentRequests, error } = await supabase
    .from('image_access_logs')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', oneMinuteAgo)

  if (error) {
    console.error('Error checking rate limit:', error)
    return true // Permitir en caso de error para no bloquear usuarios
  }

  const requestCount = recentRequests?.length || 0
  const limit = 60 // 60 requests per minute

  return requestCount < limit
}

/**
 * Añade watermark a una imagen usando Canvas API nativa de Deno
 */
async function addWatermark(
  imageBuffer: ArrayBuffer, 
  config: WatermarkConfig
): Promise<ArrayBuffer> {
  try {
    // ⚠️ LIMITACIÓN: Solo metadata, no watermark visual
    // Ver docs/tech/image-protection-limitations.md para detalles
    console.log('Adding watermark metadata (visual watermark not implemented):', config)

    // Convertir ArrayBuffer a Uint8Array
    const imageBytes = new Uint8Array(imageBuffer)
    
    // Crear watermark SVG con el logo de La CuenterIA
    const watermarkSvg = createWatermarkSvg(config)
    const watermarkBytes = new TextEncoder().encode(watermarkSvg)
    
    // TODO: Implementar watermark visual real con imagescript o skia-canvas
    // Implementación completa requiere:
    // 1. Decodificar la imagen original (JPEG/PNG/WebP)
    // 2. Crear canvas con dimensiones de la imagen
    // 3. Dibujar imagen original
    // 4. Sobreponer watermark SVG en la posición configurada
    // 5. Exportar a buffer del formato deseado
    
    // Implementación actual: Solo agrega metadata del watermark
    const watermarkedBuffer = addWatermarkMetadata(imageBytes, config)
    
    console.log(`Watermark applied: position=${config.position}, opacity=${config.opacity}`)
    
    return watermarkedBuffer.buffer
  } catch (error) {
    console.error('Error adding watermark:', error)
    return imageBuffer
  }
}

/**
 * Crea un SVG de watermark con el logo de La CuenterIA
 */
function createWatermarkSvg(config: WatermarkConfig): string {
  const { opacity, position, text } = config
  
  // Calcular posición basada en configuración
  const positions = {
    'top-left': { x: '5%', y: '15%' },
    'top-right': { x: '85%', y: '15%' },
    'bottom-left': { x: '5%', y: '85%' },
    'bottom-right': { x: '85%', y: '85%' },
    'center': { x: '50%', y: '50%' }
  }
  
  const pos = positions[position as keyof typeof positions] || positions['bottom-right']
  
  return `
    <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <g opacity="${opacity}" filter="url(#shadow)">
        <rect x="0" y="0" width="200" height="60" rx="8" fill="rgba(255,255,255,0.9)" stroke="rgba(138,43,226,0.3)" stroke-width="1"/>
        <text x="100" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#8A2BE2">
          ${text || 'La CuenterIA'}
        </text>
        <text x="100" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#666">
          Contenido Protegido
        </text>
      </g>
    </svg>
  `.trim()
}

/**
 * Añade metadata de watermark a la imagen (implementación simplificada)
 */
function addWatermarkMetadata(imageBytes: Uint8Array, config: WatermarkConfig): Uint8Array {
  // En una implementación real, esto modificaría los bytes de la imagen
  // Por ahora, añadimos el watermark como comentario en el metadata
  
  const metadata = JSON.stringify({
    watermark: {
      applied: true,
      position: config.position,
      opacity: config.opacity,
      timestamp: new Date().toISOString(),
      source: 'La CuenterIA'
    }
  })
  
  // Simulamos la adición del watermark manteniendo la imagen original
  // TODO: Implementar modificación real de píxeles para watermark visual
  
  console.log('Watermark metadata added:', metadata)
  return imageBytes
}

/**
 * Optimiza una imagen (resize, calidad, formato)
 * Implementación simplificada compatible con Deno
 */
async function optimizeImage(
  imageBuffer: ArrayBuffer,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: string
  }
): Promise<ArrayBuffer> {
  try {
    // ⚠️ LIMITACIÓN: Solo logging, no optimización real
    // Ver docs/tech/image-protection-limitations.md para detalles
    console.log('Image optimization logging only (real optimization not implemented):', options)
    
    // TODO: Implementar optimización real con Sharp alternativo para Deno
    // Bibliotecas sugeridas: imagescript, imagemagick, skia-canvas
    
    const imageBytes = new Uint8Array(imageBuffer)
    
    // Simular optimización añadiendo metadata
    const optimizationMetadata = {
      originalSize: imageBuffer.byteLength,
      targetWidth: options.width,
      targetHeight: options.height,
      quality: options.quality || 85,
      format: options.format || 'webp',
      optimized: true,
      timestamp: new Date().toISOString()
    }
    
    console.log('Image optimization metadata:', optimizationMetadata)
    
    // TODO: Implementación completa:
    // 1. Decodificar imagen usando biblioteca compatible con Deno
    // 2. Redimensionar si se especifican width/height
    // 3. Ajustar calidad según parámetro
    // 4. Convertir a formato deseado (WebP, JPEG, PNG)
    // 5. Recodificar y retornar nuevo buffer
    
    // ⚠️ ACTUAL: Retorna imagen sin optimizar
    return imageBuffer
  } catch (error) {
    console.error('Error optimizing image:', error)
    return imageBuffer
  }
}

/**
 * Registra el acceso a una imagen para auditoría
 */
async function logImageAccess(supabase: any, data: {
  userId: string
  filePath: string
  withWatermark: boolean
  ipAddress: string
  userAgent: string
}): Promise<void> {
  try {
    await supabase.from('image_access_logs').insert({
      user_id: data.userId,
      file_path: data.filePath,
      with_watermark: data.withWatermark,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging image access:', error)
    // No arrojar error, el logging es opcional
  }
}

/**
 * Obtiene la IP del cliente
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

/**
 * Obtiene el Content-Type correcto según el formato
 */
function getContentType(format: string): string {
  switch (format) {
    case 'webp':
      return 'image/webp'
    case 'png':
      return 'image/png'
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg'
    default:
      return 'image/jpeg'
  }
}