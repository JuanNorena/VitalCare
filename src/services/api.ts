/**
 * Cliente HTTP centralizado para comunicación con el backend Java de VitalCare.
 *
 * Este módulo proporciona un cliente HTTP genérico y configurado para todas las
 * comunicaciones con el backend Spring Boot desplegado en Render.com. Incluye
 * configuración automática de headers de autenticación, manejo de errores,
 * logging detallado y soporte para diferentes entornos.
 *
 * @description
 * Características principales:
 * - Configuración automática de URL base según entorno
 * - Headers de autenticación JWT automáticos
 * - Manejo robusto de errores con logging detallado
 * - Soporte para proxy en desarrollo
 * - Métodos HTTP completos (GET, POST, PUT, DELETE)
 * - Información de entorno para debugging
 *
 * Configuración de backend:
 * - Producción: https://vitalcare-back.onrender.com/api
 * - Desarrollo: Proxy Vite (/api) o variable de entorno personalizada
 * - IPs estáticas de salida de Render incluidas para referencia
 *
 * @example
 * ```typescript
 * // Uso básico del cliente
 * import { apiClient } from '@/services/api';
 *
 * // GET request
 * const users = await apiClient.get<User[]>('/users');
 *
 * // POST request con datos
 * const newUser = await apiClient.post<User>('/users', userData);
 *
 * // Con manejo de errores
 * try {
 *   const result = await apiClient.post('/appointments', appointmentData);
 * } catch (error) {
 *   console.error('Error en API:', error.message);
 * }
 * ```
 *
 * @see {@link getEnvironmentInfo} para información del entorno actual.
 * @see {@link getAuthHeaders} para configuración de autenticación.
 */

// Configuración de la URL base según el entorno
/**
 * Determina la URL base de la API según el entorno de ejecución.
 *
 * @returns {string} URL base completa para las peticiones API.
 *
 * @description
 * Lógica de selección de URL:
 * 1. Variable de entorno VITE_API_BASE_URL (si existe)
 * 2. Proxy de Vite en desarrollo (/api)
 * 3. URL de producción (https://vitalcare-back.onrender.com/api)
 *
 * @example
 * ```typescript
 * // En desarrollo: '/api' (proxy)
 * // En producción: 'https://vitalcare-back.onrender.com/api'
 * // Con variable: 'https://custom-api.com/api'
 * ```
 */
const getBaseURL = (): string => {
  // En desarrollo, usar variables de entorno o proxy
  const envBaseURL = import.meta.env.VITE_API_BASE_URL;
  
  if (envBaseURL) {
    console.log('🔧 [API] Usando URL de variable de entorno:', `${envBaseURL}/api`);
    return `${envBaseURL}/api`;
  }
  
  // En desarrollo, usar proxy de Vite
  if (import.meta.env.DEV) {
    console.log('🔧 [API] Modo desarrollo - usando proxy Vite:', '/api');
    return '/api'; // El proxy de Vite redirigirá a https://vitalcare-back.onrender.com
  }
  
  // En producción, usar la URL del backend desplegado
  console.log('🔧 [API] Modo producción - usando URL directa:', 'https://vitalcare-back.onrender.com/api');
  return 'https://vitalcare-back.onrender.com/api';
};

const API_BASE_URL = getBaseURL();

// Configuración de headers con autenticación
/**
 * Genera los headers de autenticación para las peticiones HTTP.
 *
 * @returns {Record<string, string>} Headers con Content-Type y Authorization si hay token.
 *
 * @description
 * Headers incluidos:
 * - Content-Type: application/json (siempre)
 * - Authorization: Bearer {token} (si hay token en localStorage)
 *
 * El token se obtiene automáticamente de localStorage con la clave 'accessToken'.
 *
 * @example
 * ```typescript
 * const headers = getAuthHeaders();
 * // Resultado: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ey...' }
 * ```
 */
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken');
  console.log('Access Token:', token); // Verifica el token
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};



// Función para manejar errores de la API
/**
 * Maneja errores de las respuestas HTTP de la API.
 *
 * @param {Response} response - Respuesta HTTP que contiene el error.
 * @returns {never} Lanza un Error con mensaje detallado.
 *
 * @description
 * Proceso de manejo de errores:
 * 1. Intenta parsear el cuerpo de la respuesta como JSON
 * 2. Extrae mensaje de error del backend o usa mensaje genérico
 * 3. Registra información detallada en consola para debugging
 * 4. Lanza Error con el mensaje apropiado
 *
 * Información registrada:
 * - Código de estado HTTP
 * - Texto del estado
 * - URL de la petición
 * - Detalles del error del backend
 * - Headers de la respuesta
 *
 * @example
 * ```typescript
 * try {
 *   const result = await fetch('/api/users');
 *   if (!result.ok) {
 *     await handleApiError(result); // Lanza Error
 *   }
 * } catch (error) {
 *   console.error('Error manejado:', error.message);
 * }
 * ```
 */
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
/**
 * Cliente HTTP genérico para todas las comunicaciones con el backend.
 * Proporciona métodos para realizar peticiones HTTP con configuración automática.
 */
export const apiClient = {
  /**
   * Realiza una petición HTTP GET.
   *
   * @template T - Tipo de dato esperado en la respuesta.
   * @param {string} endpoint - Endpoint relativo (sin /api).
   * @returns {Promise<T>} Datos de la respuesta parseados como JSON.
   *
   * @example
   * ```typescript
   * const users = await apiClient.get<User[]>('/users');
   * const user = await apiClient.get<User>('/users/123');
   * ```
   */
  get: async <T>(endpoint: string): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = getAuthHeaders();
    
    console.log('🌐 [API GET] Realizando petición:', {
      url,
      headers,
      endpoint
    });

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('📡 [API GET] Respuesta recibida:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      ok: response.ok
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    console.log('📋 [API GET] Datos parseados:', data);
    return data;
  },

  /**
   * Realiza una petición HTTP POST.
   *
   * @template T - Tipo de dato esperado en la respuesta.
   * @param {string} endpoint - Endpoint relativo (sin /api).
   * @param {any} [data] - Datos a enviar en el cuerpo de la petición.
   * @returns {Promise<T>} Datos de la respuesta parseados como JSON.
   *
   * @description
   * Registra información detallada de la petición en consola para debugging.
   * Convierte automáticamente los datos a JSON si se proporcionan.
   *
   * @example
   * ```typescript
   * const newUser = await apiClient.post<User>('/users', {
   *   name: 'Juan',
   *   email: 'juan@example.com'
   * });
   * ```
   */
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

    // Si el backend retorna 204 No Content, no hay JSON para parsear
    if (response.status === 204) {
      return {} as T;
    }

    // Verificar si la respuesta tiene contenido JSON antes de parsear
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    // Si la respuesta es texto plano, retornarlo como string
    const textResponse = await response.text();
    console.log('API POST Text Response:', textResponse);
    
    // Si T es string, retornar el texto directamente
    // Si no, intentar wrapearlo en un objeto (útil para respuestas simples del backend)
    return textResponse as T;
  },

  /**
   * Realiza una petición HTTP PUT.
   *
   * @template T - Tipo de dato esperado en la respuesta.
   * @param {string} endpoint - Endpoint relativo (sin /api).
   * @param {any} [data] - Datos a enviar en el cuerpo de la petición.
   * @returns {Promise<T>} Datos de la respuesta parseados como JSON.
   *
   * @example
   * ```typescript
   * const updatedUser = await apiClient.put<User>('/users/123', {
   *   name: 'Juan Pérez'
   * });
   * ```
   */
  put: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    // Si el backend retorna 204 No Content, no hay JSON para parsear
    if (response.status === 204) {
      return {} as T;
    }

    // Verificar si la respuesta tiene contenido antes de parsear
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    // Si no hay contenido JSON, retornar objeto vacío
    return {} as T;
  },

  /**
   * Realiza una petición HTTP DELETE.
   *
   * @template T - Tipo de dato esperado en la respuesta.
   * @param {string} endpoint - Endpoint relativo (sin /api).
   * @returns {Promise<T>} Datos de la respuesta parseados como JSON.
   *
   * @example
   * ```typescript
   * const result = await apiClient.delete<{ success: boolean }>('/users/123');
   * ```
   */
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
/**
 * Obtiene información detallada sobre el entorno actual de ejecución.
 *
 * @returns {Object} Información del entorno incluyendo URLs y flags.
 *
 * @property {string} baseURL - URL base actual de la API.
 * @property {string} environment - Entorno configurado (o 'development' por defecto).
 * @property {boolean} isDevelopment - True si está en modo desarrollo.
 * @property {boolean} isProduction - True si está en modo producción.
 *
 * @example
 * ```typescript
 * const env = getEnvironmentInfo();
 * console.log('API URL:', env.baseURL);
 * console.log('Es desarrollo:', env.isDevelopment);
 * ```
 */
export const getEnvironmentInfo = () => {
  return {
    baseURL: getBaseURL(),
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };
};
