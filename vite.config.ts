import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin de Sentry para source maps (solo en build)
    sentryVitePlugin({
      org: "customware",
      project: "lacuenteria",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: "./dist/**",
        ignore: ["node_modules/**"],
      },
      // Solo subir source maps en builds de producción
      disable: process.env.NODE_ENV !== 'production',
    }),
  ],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Generar source maps para Sentry
    sourcemap: true,
  },
});
