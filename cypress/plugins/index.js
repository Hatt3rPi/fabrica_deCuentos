// ***********************************************************
// Configuración de plugins de Cypress
// ***********************************************************

// Importar las funciones de base de datos
import { deleteTestStories, deleteAllTestData, executeQuery } from '../support/db.js';

/**
 * @type {Cypress.PluginConfig}
 */
export default (on, config) => {
  return (async () => {
    // Configuración de tareas
    on('task', {
      // Tarea para eliminar historias de prueba
      async deleteTestStories({ userId }) {
        try {
          console.log(`[Cypress] Eliminando historias para el usuario: ${userId}`);
          const result = await deleteTestStories(userId);
          return { success: true, ...result };
        } catch (error) {
          console.error('[Cypress] Error en deleteTestStories:', error);
          return { 
            success: false, 
            error: error.message,
            stack: error.stack 
          };
        }
      },

      // Tarea para eliminar todos los datos de prueba de un usuario
      async deleteAllTestData({ email }) {
        try {
          if (!email) {
            throw new Error('Se requiere el email del usuario');
          }
          console.log(`[Cypress] Eliminando todos los datos de prueba para: ${email}`);
          const result = await deleteAllTestData(email);
          return { 
            success: true, 
            ...result 
          };
        } catch (error) {
          console.error('[Cypress] Error en deleteAllTestData:', error);
          return { 
            success: false, 
            error: error.message,
            stack: error.stack
          };
        }
      },

      // Tarea para ejecutar consultas SQL directas
      async 'db:query'({ query, params = [] }) {
        try {
          console.log(`[Cypress] Ejecutando query: ${query}`);
          const result = await executeQuery(query, params);
          return { 
            success: true, 
            rows: result.data || [],
            error: result.error || null
          };
        } catch (error) {
          console.error('[Cypress] Error en db:query:', error);
          return { 
            success: false, 
            rows: [],
            error: error.message,
            stack: error.stack
          };
        }
      },
    });

    return config;
  })();
};
