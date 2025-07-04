import { defineConfig } from "cypress";
import dotenv from "dotenv";

// Cargar variables de entorno desde .env
dotenv.config({ path: ".env" });

export default defineConfig({
  projectId: "8qacth",

  e2e: {
    baseUrl: process.env.CI ? "http://localhost:4173" : "http://localhost:5173",
    experimentalStudio: true,
    browser: 'chrome',
    async setupNodeEvents(on, config) {
      // Cargar las variables de entorno en la configuración de Cypress
      config.env = {
        ...config.env,
        VITE_SUPABASE_URL:
          process.env.VITE_SUPABASE_URL ||
          "https://ogegdctdniijmublbmgy.supabase.co",
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
        VITE_SUPABASE_SERVICE_ROLE_KEY:
          process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
        CLEANUP_API_KEY: process.env.CLEANUP_API_KEY, // Clave para autenticar las llamadas a la Edge Function
        TEST_USER_EMAIL: process.env.TEST_USER_EMAIL || "test@example.com",
      };
      
      // Advertencia si no se proporciona la clave de servicio
      if (!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
        console.warn(
          "⚠️  Advertencia: Falta la variable de entorno VITE_SUPABASE_SERVICE_ROLE_KEY"
        );
        console.warn(
          "   Algunas funciones de limpieza pueden no funcionar correctamente"
        );
      }

      // Advertencia si no se proporciona la clave de la API de limpieza
      if (!process.env.CLEANUP_API_KEY) {
        console.warn(
          "⚠️  Advertencia: Falta la variable de entorno CLEANUP_API_KEY"
        );
        console.warn(
          "   La función de limpieza de historias no funcionará correctamente"
        );
      }

      // Asegurarse de que las variables de entorno requeridas estén presentes
      if (!config.env.VITE_SUPABASE_ANON_KEY) {
        console.warn(
          "⚠️  Advertencia: Falta la variable de entorno VITE_SUPABASE_ANON_KEY"
        );
      }

      // Cargar el plugin de tareas
      (await import("./cypress/plugins/index.js")).default(on, config);
      
      return config;
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 20000,
    requestTimeout: 30000,
    responseTimeout: 60000,
    pageLoadTimeout: 90000,
    video: true,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: true,
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
