/**
 * Configuración de Tailwind CSS para VitalCare Frontend.
 *
 * Archivo de configuración que define:
 * - Rutas de contenido para optimización CSS
 * - Modo oscuro activado por clase 'dark'
 * - Tema base sin extensiones personalizadas
 * - Plugins vacíos (preparado para futuras adiciones)
 *
 * El modo oscuro se controla dinámicamente desde AccessibilityContext.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Activar soporte para dark mode mediante la clase `dark`.
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
