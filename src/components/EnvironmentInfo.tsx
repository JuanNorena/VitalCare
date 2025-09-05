/**
 * Componente para mostrar información del entorno (solo en desarrollo)
 */

import { getEnvironmentInfo } from '@/services/api';

export function EnvironmentInfo() {
  const envInfo = getEnvironmentInfo();

  // Solo mostrar en desarrollo
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
