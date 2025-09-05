/**
 * Cliente HTTP para comunicación con el backend Java
 */

// Configuración de la URL base según el entorno
const getBaseURL = (): string => {
  // En desarrollo, usar variables de entorno o fallback a localhost
  const envBaseURL = import.meta.env.VITE_API_BASE_URL;
  
  if (envBaseURL) {
    return `${envBaseURL}/api`;
  }
  
  // Fallbacks según el entorno
  if (import.meta.env.DEV) {
    return '/api'; // Proxy en desarrollo
  }
  
  // En producción, usar la URL del backend desplegado
  return 'https://vitalcare-back.onrender.com/api'; // URL de producción actualizada
};

const API_BASE_URL = getBaseURL();

// Configuración de headers con autenticación
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Función para manejar errores de la API
const handleApiError = async (response: Response): Promise<never> => {
  let errorMessage = 'Error desconocido';
  
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || errorMessage;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }
  
  throw new Error(errorMessage);
};

// Cliente HTTP genérico
export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  post: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  put: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },
};

// Función para obtener información del entorno
export const getEnvironmentInfo = () => {
  return {
    baseURL: getBaseURL(),
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };
};
