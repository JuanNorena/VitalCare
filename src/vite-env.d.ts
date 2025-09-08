/**
 * Definiciones de tipos para el entorno de desarrollo con Vite.
 *
 * Este archivo proporciona tipado TypeScript para las variables de entorno
 * específicas de VitalCare y las APIs de Vite. Asegura que las variables
 * de entorno sean accesibles de manera type-safe en toda la aplicación.
 *
 * @example
 * ```typescript
 * // Acceder a variables de entorno de manera type-safe
 * const apiUrl = import.meta.env.VITE_API_BASE_URL;
 * const environment = import.meta.env.VITE_ENVIRONMENT;
 *
 * // TypeScript sabrá que estas son strings y no undefined
 * ```
 *
 * @description
 * Define las interfaces para:
 * - Variables de entorno específicas de VitalCare (VITE_API_BASE_URL, VITE_ENVIRONMENT)
 * - Extensión del objeto import.meta con tipos seguros
 * - Referencias a tipos de Vite para desarrollo
 *
 * Las variables de entorno deben estar prefijadas con VITE_ para ser
 * incluidas en el bundle de producción por Vite.
 *
 * @see {@link https://vitejs.dev/guide/env-and-mode.html} para documentación de variables de entorno en Vite.
 */

/// <reference types="vite/client" />

/**
 * Variables de entorno específicas de VitalCare.
 * Define las variables de entorno que la aplicación espera encontrar.
 * @interface ImportMetaEnv
 */
interface ImportMetaEnv {
  /** URL base de la API del backend */
  readonly VITE_API_BASE_URL: string
  /** Entorno de ejecución (development, production, staging, etc.) */
  readonly VITE_ENVIRONMENT: string
}

/**
 * Extensión del objeto import.meta de Vite.
 * Proporciona acceso type-safe a las variables de entorno.
 * @interface ImportMeta
 */
interface ImportMeta {
  /** Variables de entorno con tipado seguro */
  readonly env: ImportMetaEnv
}
