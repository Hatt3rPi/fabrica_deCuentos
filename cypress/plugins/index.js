// ***********************************************************
// Configuración de plugins de Cypress
// ***********************************************************

// Importar las funciones de base de datos
import { deleteTestStories, deleteAllTestData, createTestStyleConfig, deleteStyleConfig, activateStyleConfig, createTestStory, deleteStory } from '../support/db.js';

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

      // Tareas para sistema de estilos unificado
      async createTestStyleConfig(styleConfig) {
        try {
          console.log(`[Cypress] Creando configuración de estilo de prueba: ${styleConfig.name}`);
          const result = await createTestStyleConfig(styleConfig);
          return result;
        } catch (error) {
          console.error('[Cypress] Error en createTestStyleConfig:', error);
          return null;
        }
      },

      async deleteStyleConfig(configId) {
        try {
          console.log(`[Cypress] Eliminando configuración de estilo: ${configId}`);
          const result = await deleteStyleConfig(configId);
          return { success: true, ...result };
        } catch (error) {
          console.error('[Cypress] Error en deleteStyleConfig:', error);
          return { success: false, error: error.message };
        }
      },

      async activateStyleConfig(configId) {
        try {
          console.log(`[Cypress] Activando configuración de estilo: ${configId}`);
          const result = await activateStyleConfig(configId);
          return { success: true, ...result };
        } catch (error) {
          console.error('[Cypress] Error en activateStyleConfig:', error);
          return { success: false, error: error.message };
        }
      },

      async createTestStory(storyData) {
        try {
          console.log(`[Cypress] Creando historia de prueba: ${storyData.title}`);
          const result = await createTestStory(storyData);
          return result;
        } catch (error) {
          console.error('[Cypress] Error en createTestStory:', error);
          return null;
        }
      },

      async deleteStory(storyId) {
        try {
          console.log(`[Cypress] Eliminando historia: ${storyId}`);
          const result = await deleteStory(storyId);
          return { success: true, ...result };
        } catch (error) {
          console.error('[Cypress] Error en deleteStory:', error);
          return { success: false, error: error.message };
        }
      },
    });

    return config;
  })();
};
