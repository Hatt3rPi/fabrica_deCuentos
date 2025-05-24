import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '../../.env' });

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ogegdctdniijmublbmgy.supabase.co';
// Usar la clave de servicio para operaciones de administración
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Validar configuración
if (!supabaseUrl || !supabaseKey) {
  const error = new Error('Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('❌ Error de configuración:', error.message);
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Faltante');
  console.log('Clave de servicio:', supabaseKey ? '✅ Configurada' : '❌ Faltante (usando anónima)');
  
  if (!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  Se recomienda usar VITE_SUPABASE_SERVICE_ROLE_KEY para operaciones de administración');
  }
  
  if (!supabaseUrl || !supabaseKey) {
    throw error;
  }
}

// Inicializar cliente de Supabase con configuración de administración
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    // Usar la API de administración
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false
  },
  // Configuración global
  global: {
    // Deshabilitar el encabezado de autorización para la API de administración
    headers: {}
  }
});

// Función para manejar errores de Supabase
const handleSupabaseError = (operation, error) => {
  console.error(`❌ Error en ${operation}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    status: error.status
  });
  throw error;
};

/**
 * Elimina todas las historias de prueba para un usuario específico
 * @param {string} userId - ID del usuario cuyas historias se eliminarán
 * @returns {Promise<{rowCount: number}>} Número de filas eliminadas
 */
const deleteTestStories = async (userId) => {
  if (!userId) {
    console.warn('⚠️  No se proporcionó un ID de usuario para eliminar historias');
    return { rowCount: 0 };
  }

  try {
    console.log(`🗑️  Eliminando historias para el usuario: ${userId}`);
    
    // Primero, obtener las historias para eliminar referencias en otras tablas
    const { data: stories, error: fetchError } = await supabase
      .from('stories')
      .select('id, user_id')
      .eq('user_id', userId);

    if (fetchError) {
      return handleSupabaseError('fetchStories', fetchError);
    }

    if (!stories || stories.length === 0) {
      console.log('ℹ️  No se encontraron historias para eliminar');
      return { rowCount: 0 };
    }

    // Aquí podrías agregar lógica para eliminar registros relacionados
    // en otras tablas (ej: personajes, ilustraciones, etc.)
    
    // Eliminar las historias
    const { data, error, count } = await supabase
      .from('stories')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: false });

    if (error) {
      return handleSupabaseError('deleteStories', error);
    }

    const rowCount = count || (data ? data.length : 0);
    console.log(`✅ Se eliminaron ${rowCount} historias de prueba para el usuario ${userId}`);
    
    return { 
      rowCount,
      userId,
      deletedStories: data || []
    };
  } catch (error) {
    console.error('❌ Error en deleteTestStories:', error);
    return { 
      rowCount: 0, 
      error: error.message,
      stack: error.stack 
    };
  }
};

/**
 * Obtiene el ID de usuario por email
 * @param {string} email - Email del usuario
 * @returns {Promise<string|null>} ID del usuario o null si no se encuentra
 */
const getUserIdByEmail = async (email) => {
  if (!email) {
    console.warn('⚠️  No se proporcionó un email para buscar el usuario');
    return null;
  }

  try {
    console.log(`🔍 Buscando ID para el usuario: ${email}`);
    
    // Primero intentar con la tabla auth.users
    try {
      const { data: authUser, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at')
        .eq('email', email)
        .maybeSingle();

      if (!authError && authUser) {
        console.log(`✅ Usuario encontrado en auth.users: ${authUser.id}`);
        return authUser.id;
      }
    } catch (authError) {
      console.log('ℹ️  No se pudo acceder a auth.users, intentando con users...');
    }
    
    // Si falla, intentar con la tabla users
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, created_at')
        .eq('email', email)
        .maybeSingle();

      if (!userError && user) {
        console.log(`✅ Usuario encontrado en users: ${user.id}`);
        return user.id;
      }
    } catch (userError) {
      console.log('ℹ️  No se pudo acceder a users, intentando con la API de administración...');
    }
    
    // Si todo lo demás falla, intentar con la API de administración
    try {
      console.log('⚠️  Intentando con la API de administración...');
      const { data: authData, error: adminError } = await supabase.auth.admin.listUsers();
      
      if (!adminError && authData && authData.users) {
        const user = authData.users.find(u => u.email === email);
        if (user) {
          console.log(`✅ Usuario encontrado vía API de administración: ${user.id}`);
          return user.id;
        }
      }
    } catch (apiError) {
      console.error('❌ Error al usar la API de administración:', apiError.message);
    }
    
    console.log(`ℹ️  No se encontró el usuario con email: ${email}`);
    return null;
    
  } catch (error) {
    console.error('❌ Error en getUserIdByEmail:', error.message || error);
    return null;
  }
};

/**
 * Elimina un usuario y todos sus datos asociados
 * @param {string} userId - ID del usuario a eliminar
 * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
 */
const deleteUser = async (userId) => {
  if (!userId) {
    return { success: false, message: 'Se requiere el ID del usuario' };
  }

  try {
    console.log(`🗑️  Eliminando usuario y sus datos: ${userId}`);
    
    // 1. Primero, eliminar las historias y sus relaciones
    await deleteTestStories(userId);
    
    // 2. Aquí podrías agregar más eliminaciones de datos relacionados
    // Por ejemplo: personajes, ilustraciones, etc.
    
    // 3. Finalmente, eliminar el usuario
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      return handleSupabaseError('deleteUser', error);
    }

    console.log(`✅ Usuario eliminado correctamente: ${userId}`);
    return { 
      success: true, 
      message: `Usuario ${userId} eliminado correctamente` 
    };
  } catch (error) {
    console.error('❌ Error en deleteUser:', error);
    return { 
      success: false, 
      message: `Error al eliminar usuario: ${error.message}` 
    };
  }
};

/**
 * Elimina todos los datos de prueba para un usuario por su email
 * @param {string} email - Email del usuario
 * @returns {Promise<{rowCount: number, userId: string | null, error?: string}>} Resultado de la operación
 */
const deleteAllTestData = async (email) => {
  const startTime = Date.now();
  const result = { rowCount: 0, userId: null };
  
  if (!email) {
    const message = '⚠️  No se proporcionó un email para limpiar los datos de prueba';
    console.warn(message);
    return { ...result, error: message };
  }

  console.log(`🧹 [${new Date().toISOString()}] Iniciando limpieza de datos para: ${email}`);
  
  try {
    // 1. Obtener el ID del usuario por su email
    console.log(`🔍 [${new Date().toISOString()}] Buscando ID para el usuario: ${email}`);
    const userId = await getUserIdByEmail(email);
    
    if (!userId) {
      const message = `ℹ️  No se encontró un usuario con el email: ${email}`;
      console.log(message);
      return { ...result, error: message };
    }
    
    result.userId = userId;
    console.log(`✅ [${new Date().toISOString()}] Usuario encontrado: ${userId}`);
    
    // 2. Eliminar las historias y datos relacionados
    console.log(`🗑️  [${new Date().toISOString()}] Eliminando historias y datos relacionados...`);
    const storiesResult = await deleteTestStories(userId);
    
    if (storiesResult?.rowCount > 0) {
      console.log(`✅ [${new Date().toISOString()}] Se eliminaron ${storiesResult.rowCount} historias`);
      result.rowCount += storiesResult.rowCount;
    }
    
    // 3. Aquí podrías agregar más eliminaciones de datos relacionados
    // Por ejemplo: personajes, ilustraciones, etc.
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [${new Date().toISOString()}] Limpieza completada en ${duration}s. Total eliminado: ${result.rowCount} registros`);
    
    return result;
    
  } catch (error) {
    const errorMsg = `❌ [${new Date().toISOString()}] Error en deleteAllTestData: ${error.message || error}`;
    console.error(errorMsg);
    return { ...result, error: errorMsg };
  }
};

/**
 * Verifica la conexión con Supabase
 * @returns {Promise<{success: boolean, version?: string, error?: string}>}
 */
const checkSupabaseConnection = async () => {
  try {
    console.log('🔌 Verificando conexión con Supabase...');
    
    const { data, error } = await supabase
      .rpc('get_system_version')
      .single();
    
    if (error) {
      // Si falla el RPC, intentamos usar la API de administración para verificar usuarios
      try {
        // Usar la API de administración de Supabase Auth
        const { data: users, error: usersError } = await supabase.auth.admin
          .listUsers({ page: 1, perPage: 1 });
          
        if (usersError) throw usersError;
        
        return { 
          success: true, 
          message: 'Conexión exitosa (usando API de administración)' 
        };
      } catch (authError) {
        console.warn('⚠️  Intentando con la API de administración...');
        // Si la API de administración falla, intentamos con una tabla que sabemos que existe
        const { data: stories, error: storiesError } = await supabase
          .from('stories')  // Tabla en el esquema public
          .select('count')
          .limit(1);
          
        if (storiesError) throw storiesError;
        
        return { 
          success: true, 
          message: 'Conexión exitosa (usando tabla stories)' 
        };
      }
    }
    
    return { 
      success: true, 
      version: data,
      message: 'Conexión exitosa con Supabase' 
    };
  } catch (error) {
    console.error('❌ Error de conexión con Supabase:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Error al conectar con Supabase' 
    };
  }
};

// Verificar la conexión al cargar el módulo
console.log('🔄 Inicializando módulo de base de datos...');
checkSupabaseConnection()
  .then(({ success, message, version, error }) => {
    if (success) {
      console.log(`✅ ${message}${version ? ` (${version})` : ''}`);
    } else {
      console.error(`❌ ${message}: ${error}`);
    }
  })
  .catch(error => {
    console.error('❌ Error al verificar la conexión con Supabase:', error);
  });

// Exportar las funciones principales
export {
  deleteTestStories,
  deleteAllTestData,
  getUserIdByEmail,
  deleteUser,
  checkSupabaseConnection,
  supabase
};

// Exportar configuración para pruebas
export const _test = {
  supabaseUrl,
  supabaseKey: supabaseKey ? '***' + supabaseKey.slice(-4) : 'no-key',
  env: process.env.NODE_ENV
};
