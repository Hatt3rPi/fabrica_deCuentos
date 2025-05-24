import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuración de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tipos de respuesta
interface SuccessResponse {
  success: boolean;
  deletedStories: number;
  deletedImages: number;
  userId: string;
}

interface ErrorResponse {
  success: boolean;
  error: string;
}

// Buckets de almacenamiento donde se pueden guardar imágenes
const STORAGE_BUCKETS = [
  'storage',
  'reference-images',
  'character-images',
  'fabricacuentos'
];

// Función principal
export const handler = async (req: Request): Promise<Response> => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      throw new Error('Método no permitido')
    }

    // Verificar autenticación
    const authHeader = req.headers.get('Authorization')
    const apiKey = Deno.env.get('CLEANUP_API_KEY')
    
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return createErrorResponse('No autorizado', 401)
    }

    // Obtener email del cuerpo de la petición
    const { email } = await req.json()
    if (!email) {
      throw new Error('Se requiere el email del usuario')
    }

    // Inicializar cliente de Supabase con rol de servicio
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: { persistSession: false },
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
      }
    )

    console.log(`[${new Date().toISOString()}] Buscando usuario: ${email}`)

    // 1. Obtener ID del usuario
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = user?.users.find(u => u.email === email)
    
    if (!targetUser) {
      throw new Error('Usuario no encontrado')
    }

    console.log(`[${new Date().toISOString()}] Usuario encontrado: ${targetUser.id}`)
    console.log(`[${new Date().toISOString()}] Buscando historias del usuario...`)

    // 2. Obtener las historias del usuario para eliminarlas
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from('stories')
      .select('id')
      .eq('user_id', targetUser.id)

    if (storiesError) {
      console.error('Error al buscar historias:', storiesError)
      throw new Error('Error al buscar las historias')
    }

    const storyCount = stories?.length || 0
    console.log(`[${new Date().toISOString()}] Encontradas ${storyCount} historias para eliminar`)

    let totalDeletedImages = 0;

    // 3. Eliminar cada historia usando la función RPC delete_full_story
    if (storyCount > 0) {
      console.log(`[${new Date().toISOString()}] Iniciando eliminación de historias y datos relacionados...`)
      
      // Usar Promise.all para procesar todas las eliminaciones en paralelo
      const deletePromises = stories.map(async (story) => {
        try {
          // La función ahora devuelve un array de URLs de imágenes y IDs de personajes
          const { data: imageUrlsAndIds, error } = await supabaseAdmin.rpc('delete_full_story', { story_id: story.id })
          
          if (error) {
            console.error(`Error al eliminar historia ${story.id}:`, error)
            throw error
          }
          
          console.log(`[${new Date().toISOString()}] Historia ${story.id} eliminada correctamente de la base de datos`)
          
          // Procesar las URLs de imágenes y IDs de personajes para eliminar archivos de Storage
          if (imageUrlsAndIds && imageUrlsAndIds.length > 0) {
            const deletedImages = await cleanupStorageFiles(supabaseAdmin, targetUser.id, imageUrlsAndIds);
            totalDeletedImages += deletedImages;
          }
          
          return true
        } catch (err) {
          console.error(`Error al eliminar historia ${story.id}:`, err)
          return false
        }
      })

      // Esperar a que todas las eliminaciones se completen
      await Promise.all(deletePromises)
    }

    // 4. Eliminar carpetas de usuario en todos los buckets de almacenamiento
    console.log(`[${new Date().toISOString()}] Limpiando carpetas de usuario en buckets de almacenamiento...`)
    const deletedFolderFiles = await cleanupUserFolders(supabaseAdmin, targetUser.id);
    totalDeletedImages += deletedFolderFiles;

    console.log(`[${new Date().toISOString()}] Se eliminaron ${storyCount} historias y ${totalDeletedImages} archivos de almacenamiento`)

    // Respuesta exitosa
    return createSuccessResponse({
      success: true,
      deletedStories: storyCount,
      deletedImages: totalDeletedImages,
      userId: targetUser.id
    })

  } catch (error) {
    console.error('Error en la función:', error)
    return createErrorResponse(error.message, 400)
  }
}

/**
 * Elimina archivos de Storage basados en URLs de imágenes y IDs de personajes
 */
async function cleanupStorageFiles(supabase, userId: string, imageUrlsAndIds: string[]): Promise<number> {
  let deletedCount = 0;
  
  for (const item of imageUrlsAndIds) {
    try {
      // Si es una URL de imagen
      if (item.startsWith('http')) {
        // Extraer bucket y path de la URL
        const url = new URL(item);
        const pathParts = url.pathname.split('/');
        
        // Formato típico: /storage/v1/object/public/bucket-name/path/to/file
        if (pathParts.length >= 6 && pathParts[1] === 'storage' && pathParts[2] === 'v1') {
          const bucketName = pathParts[5];
          const filePath = pathParts.slice(6).join('/');
          
          if (bucketName && filePath) {
            console.log(`[${new Date().toISOString()}] Eliminando archivo: ${bucketName}/${filePath}`);
            const { error } = await supabase.storage.from(bucketName).remove([filePath]);
            
            if (!error) {
              deletedCount++;
            } else {
              console.error(`Error al eliminar archivo ${filePath} del bucket ${bucketName}:`, error);
            }
          }
        }
      } 
      // Si es un ID de personaje, intentar eliminar carpetas relacionadas
      else if (item.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const characterId = item;
        
        // Intentar eliminar carpetas de personajes en diferentes buckets
        for (const bucket of STORAGE_BUCKETS) {
          // Patrones comunes de carpetas de personajes
          const possiblePaths = [
            `${characterId}`, // Directamente el ID
            `${userId}/${characterId}`, // userId/characterId
            `reference-images/${characterId}`, // bucket/characterId
            `reference-images/${userId}/${characterId}` // bucket/userId/characterId
          ];
          
          for (const path of possiblePaths) {
            try {
              // Listar archivos en la carpeta
              const { data: files, error: listError } = await supabase.storage.from(bucket).list(path);
              
              if (!listError && files && files.length > 0) {
                // Construir rutas completas para eliminar
                const filePaths = files.map(file => `${path}/${file.name}`);
                
                console.log(`[${new Date().toISOString()}] Eliminando ${filePaths.length} archivos de ${bucket}/${path}`);
                const { error: removeError } = await supabase.storage.from(bucket).remove(filePaths);
                
                if (!removeError) {
                  deletedCount += filePaths.length;
                } else {
                  console.error(`Error al eliminar archivos de ${bucket}/${path}:`, removeError);
                }
              }
            } catch (err) {
              // Ignorar errores de carpetas que no existen
              console.log(`Carpeta ${bucket}/${path} no encontrada o error al listar`);
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error al procesar item ${item}:`, err);
    }
  }
  
  return deletedCount;
}

/**
 * Elimina todas las carpetas de usuario en todos los buckets
 */
async function cleanupUserFolders(supabase, userId: string): Promise<number> {
  let deletedCount = 0;
  
  for (const bucket of STORAGE_BUCKETS) {
    try {
      // Intentar listar archivos en la carpeta del usuario
      const { data: files, error: listError } = await supabase.storage.from(bucket).list(userId);
      
      if (!listError && files && files.length > 0) {
        // Construir rutas completas para eliminar
        const filePaths = files.map(file => `${userId}/${file.name}`);
        
        console.log(`[${new Date().toISOString()}] Eliminando ${filePaths.length} archivos de ${bucket}/${userId}`);
        const { error: removeError } = await supabase.storage.from(bucket).remove(filePaths);
        
        if (!removeError) {
          deletedCount += filePaths.length;
        } else {
          console.error(`Error al eliminar archivos de ${bucket}/${userId}:`, removeError);
        }
      }
      
      // También intentar eliminar archivos en subcarpetas
      const folderDeletedCount = await cleanupFolderRecursive(supabase, bucket, userId, 0);
      deletedCount += folderDeletedCount;
      
    } catch (err) {
      // Ignorar errores de carpetas que no existen
      console.log(`Carpeta ${bucket}/${userId} no encontrada o error al listar`);
    }
  }
  
  return deletedCount;
}

/**
 * Elimina recursivamente todos los archivos en una carpeta y sus subcarpetas
 */
async function cleanupFolderRecursive(supabase, bucket: string, path: string, deletedCount: number): Promise<number> {
  try {
    const { data: items, error: listError } = await supabase.storage.from(bucket).list(path);
    
    if (listError || !items || items.length === 0) {
      return deletedCount;
    }
    
    // Separar archivos y carpetas
    const files = items.filter(item => !item.id);
    const folders = items.filter(item => item.id);
    
    // Eliminar archivos en esta carpeta
    if (files.length > 0) {
      const filePaths = files.map(file => `${path}/${file.name}`);
      console.log(`[${new Date().toISOString()}] Eliminando ${filePaths.length} archivos de ${bucket}/${path}`);
      
      const { error: removeError } = await supabase.storage.from(bucket).remove(filePaths);
      
      if (!removeError) {
        deletedCount += filePaths.length;
      }
    }
    
    // Procesar subcarpetas recursivamente
    for (const folder of folders) {
      const folderPath = `${path}/${folder.name}`;
      deletedCount = await cleanupFolderRecursive(supabase, bucket, folderPath, deletedCount);
    }
    
    return deletedCount;
  } catch (err) {
    console.error(`Error al limpiar carpeta ${bucket}/${path}:`, err);
    return deletedCount;
  }
}

// Helper para respuestas de éxito
function createSuccessResponse(data: SuccessResponse): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  )
}

// Helper para respuestas de error
function createErrorResponse(message: string, status = 400): Response {
  const errorResponse: ErrorResponse = {
    success: false,
    error: message
  }
  
  return new Response(
    JSON.stringify(errorResponse),
    { 
      status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  )
}

// Iniciar el servidor
serve(handler)
