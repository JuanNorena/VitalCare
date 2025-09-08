/**
 * Componente React para mostrar información del entorno de desarrollo en VitalCare.
 *
 * Este componente proporciona una interfaz visual simple para mostrar información
 * básica sobre el entorno de ejecución actual de la aplicación. Es útil durante
 * el desarrollo para verificar rápidamente la configuración del entorno.
 *
 * Funcionalidades principales:
 * - Muestra información básica del entorno (desarrollo, producción)
 * - Visualización de la URL base de la API
 * - Componente condicional que solo se muestra en desarrollo
 * - Interfaz minimalista con fondo semi-transparente
 *
 * El componente utiliza la función getEnvironmentInfo del servicio API para
 * obtener los datos del entorno y los presenta en una superposición fija.
 *
 * @example
 * ```typescript
 * import { EnvironmentInfo } from '@/components/EnvironmentInfo';
 *
 * function App() {
 *   return (
 *     <div>
 *       <EnvironmentInfo />
 *       {/* Resto de la aplicación *\/}
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@link getEnvironmentInfo} para la función que obtiene la información del entorno.
 */

import { getEnvironmentInfo } from '@/services/api';

/**
 * Componente EnvironmentInfo que muestra información básica del entorno de desarrollo.
 *
 * @component
 * @returns {JSX.Element | null} Componente que muestra información del entorno o null si no está en desarrollo.
 *
 * @description
 * Este componente renderiza una superposición fija con información básica sobre
 * el entorno actual de la aplicación. Solo se muestra cuando la aplicación está
 * ejecutándose en modo desarrollo (isDevelopment = true).
 *
 * La información mostrada incluye:
 * - Tipo de entorno (development, production, etc.)
 * - URL base de la API
 *
 * @example
 * ```typescript
 * <EnvironmentInfo />
 * ```
 *
 * @example
 * ```typescript
 * // El componente se muestra automáticamente solo en desarrollo
 * {getEnvironmentInfo().isDevelopment && <EnvironmentInfo />}
 * ```
 */
export function EnvironmentInfo() {
  /**
   * Obtiene la información del entorno usando el servicio API.
   * @type {Object}
   */
  const envInfo = getEnvironmentInfo();

  /**
   * Condición para mostrar el componente solo en desarrollo.
   * En producción, el componente retorna null para no mostrar información sensible.
   */
  if (!envInfo.isDevelopment) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
      <div><strong>Entorno:</strong> {envInfo.environment}</div>
      <div><strong>API:</strong> {envInfo.baseURL}</div>
    </div>
  );
}
