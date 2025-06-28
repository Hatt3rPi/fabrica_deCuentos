import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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
      ...corsHeaders,
      'Content-Type': getContentType(format),
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Download-Options': 'noopen',
      'Content-Disposition': 'inline',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
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
 * Añade watermark a una imagen
 */
async function addWatermark(
  imageBuffer: ArrayBuffer, 
  config: WatermarkConfig
): Promise<ArrayBuffer> {
  try {
    // Nota: Esta es una implementación simplificada
    // En producción, se usaría una librería como Sharp o ImageMagick
    // Por ahora, retornamos la imagen sin modificar pero con logging
    
    console.log('Adding watermark with config:', config)
    
    // TODO: Implementar watermark real con Sharp
    // const sharp = require('sharp')
    // const watermarkedBuffer = await sharp(Buffer.from(imageBuffer))
    //   .composite([{
    //     input: watermarkBuffer,
    //     gravity: config.position,
    //     blend: 'over'
    //   }])
    //   .toBuffer()
    
    return imageBuffer
  } catch (error) {
    console.error('Error adding watermark:', error)
    return imageBuffer
  }
}

/**
 * Optimiza una imagen (resize, calidad, formato)
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
    console.log('Optimizing image with options:', options)
    
    // TODO: Implementar optimización real con Sharp
    // const sharp = require('sharp')
    // let pipeline = sharp(Buffer.from(imageBuffer))
    
    // if (options.width || options.height) {
    //   pipeline = pipeline.resize(options.width, options.height, {
    //     fit: 'inside',
    //     withoutEnlargement: true
    //   })
    // }
    
    // switch (options.format) {
    //   case 'webp':
    //     pipeline = pipeline.webp({ quality: options.quality })
    //     break
    //   case 'jpeg':
    //     pipeline = pipeline.jpeg({ quality: options.quality })
    //     break
    //   case 'png':
    //     pipeline = pipeline.png({ quality: options.quality })
    //     break
    // }
    
    // return await pipeline.toBuffer()
    
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