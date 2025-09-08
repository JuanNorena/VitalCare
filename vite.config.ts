/**
 * Configuración de Vite para VitalCare Frontend.
 *
 * Este archivo define la configuración completa del bundler Vite para el proyecto VitalCare.
 * Incluye configuración de plugins, aliases de rutas, servidor de desarrollo y proxy para API.
 *
 * @description
 * Configuración principal incluye:
 * - Plugin de React para soporte JSX/TSX
 * - Plugin de Tailwind CSS para estilos utilitarios
 * - Alias de rutas para imports limpios (@/src/*)
 * - Servidor de desarrollo en puerto 3000
 * - Proxy configurado para API backend en producción
 *
 * El proxy está configurado para redirigir todas las peticiones /api/* al backend
 * desplegado en Render (https://vitalcare-back.onrender.com).
 *
 * Características del proxy:
 * - Reescritura transparente de URLs
 * - Logging detallado de requests/responses
 * - Manejo de errores de conexión
 * - Configuración CORS automática
 *
 * @example
 * ```typescript
 * // Para desarrollo local, las peticiones a /api/* se redirigen automáticamente
 * fetch('/api/appointments')
 *   // Se convierte en: https://vitalcare-back.onrender.com/api/appointments
 * ```
 *
 * @see {@link https://vitejs.dev/config/} Documentación oficial de Vite
 * @see {@link https://tailwindcss.com/docs/configuration} Configuración de Tailwind
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://vitalcare-back.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path, // No reescribir el path
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})
