/**
 * Punto de entrada principal de la aplicación VitalCare.
 *
 * Este archivo es el punto de entrada que React usa para inicializar y renderizar
 * la aplicación completa en el DOM. Configura todos los proveedores globales
 * y monta la aplicación en el elemento raíz del HTML.
 *
 * @example
 * ```html
 * <!-- En index.html -->
 * <div id="root"></div>
 * ```
 *
 * ```tsx
 * // Este archivo se ejecuta automáticamente por Vite
 * // No requiere importación manual
 * ```
 *
 * @description
 * El proceso de inicialización incluye:
 * 1. Importación de React y ReactDOM para renderizado
 * 2. Importación del componente App principal
 * 3. Importación de estilos globales (Tailwind CSS)
 * 4. Configuración del AccessibilityProvider para accesibilidad global
 * 5. Renderizado con StrictMode para desarrollo y debugging
 * 6. Montaje en el elemento DOM con id="root"
 *
 * La jerarquía de componentes renderizados es:
 * - React.StrictMode (desarrollo)
 *   - AccessibilityProvider (contexto global)
 *     - App (aplicación principal)
 *       - Todos los demás componentes y proveedores
 *
 * @see {@link App} para el componente principal de la aplicación.
 * @see {@link AccessibilityProvider} para el contexto de accesibilidad.
 * @see {@link index.css} para los estilos globales.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AccessibilityProvider } from '@/contexts/AccessibilityContext'

/**
 * Renderizado de la aplicación VitalCare.
 *
 * Crea la raíz de React y renderiza la aplicación completa dentro de
 * React.StrictMode para obtener mejores prácticas de desarrollo y
 * detección de problemas potenciales.
 *
 * El proceso incluye:
 * - Búsqueda del elemento DOM con id="root"
 * - Creación de la raíz de React
 * - Renderizado de la jerarquía completa de componentes
 *
 * @description
 * React.StrictMode activa verificaciones adicionales en desarrollo:
 * - Detección de efectos secundarios no deseados
 * - Verificación de métodos de ciclo de vida obsoletos
 * - Advertencias sobre uso de APIs legacy
 * - Detección de problemas de concurrencia
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <App />
    </AccessibilityProvider>
  </React.StrictMode>,
)
