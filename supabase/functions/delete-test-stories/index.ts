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
  userId: string;
}

interface ErrorResponse {
  success: boolean;
  error: string;
}

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
    console.log(`[${new Date().toISOString()}] Eliminando historias...`)

    // 2. Eliminar historias del usuario
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from('stories')
      .delete()
      .eq('user_id', targetUser.id)
      .select()

    if (storiesError) {
      console.error('Error al eliminar historias:', storiesError)
      throw new Error('Error al eliminar las historias')
    }

    const deletedCount = stories?.length || 0
    console.log(`[${new Date().toISOString()}] Se eliminaron ${deletedCount} historias`)

    // 3. Aquí podrías agregar la eliminación de otros datos relacionados

    // Respuesta exitosa
    return createSuccessResponse({
      success: true,
      deletedStories: deletedCount,
      userId: targetUser.id
    })

  } catch (error) {
    console.error('Error en la función:', error)
    return createErrorResponse(error.message, 400)
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
