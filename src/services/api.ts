/**
 * Cliente HTTP para comunicación con el backend Java
 * 
 * Backend en Render.com con IPs estáticas de salida:
 * - 44.226.145.213
 * - 54.187.200.255
 * - 34.213.214.55
 * - 35.164.95.156
 * - 44.230.95.183
 * - 44.229.200.200
 */

// Configuración de la URL base según el entorno
const getBaseURL = (): string => {
  // En desarrollo, usar variables de entorno o proxy
  const envBaseURL = import.meta.env.VITE_API_BASE_URL;
  
  if (envBaseURL) {
    return `${envBaseURL}/api`;
  }
  
  // En desarrollo, usar proxy de Vite
  if (import.meta.env.DEV) {
    return '/api'; // El proxy de Vite redirigirá a https://vitalcare-back.onrender.com
  }
  
  // En producción, usar la URL del backend desplegado
  return 'https://vitalcare-back.onrender.com/api';
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
  let errorDetails = {};
  
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || errorMessage;
    errorDetails = errorData;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }
  
  // Log detallado para debugging
  console.error('API Error:', {
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    errorDetails,
    headers: Object.fromEntries(response.headers.entries())
  });
  
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
    console.log('API POST Request:', {
      endpoint: `${API_BASE_URL}${endpoint}`,
      data,
      headers: getAuthHeaders()
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    }) as Response;


    console.log('API POST Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
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
