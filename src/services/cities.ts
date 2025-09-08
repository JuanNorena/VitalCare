/**
 * Servicio para el manejo de ciudades desde el backend de VitalCare.
 *
 * Este servicio proporciona funcionalidades para obtener la lista de ciudades
 * disponibles en el sistema médico. Se conecta con el endpoint del backend
 * que retorna información de ciudades para formularios de registro y citas.
 *
 * @description
 * Funcionalidades principales:
 * - Obtención de todas las ciudades desde el backend
 * - Manejo de errores con fallback a datos locales
 * - Integración con el cliente HTTP centralizado
 * - Logging detallado para debugging
 *
 * El servicio incluye un mecanismo de fallback que proporciona ciudades
 * de ejemplo cuando el backend no está disponible, asegurando que
 * los formularios sigan funcionando durante desarrollo o problemas de conectividad.
 *
 * @example
 * ```typescript
 * // Obtener todas las ciudades disponibles
 * const cities = await citiesService.getAllCities();
 *
 * // Usar en un componente
 * const [cities, setCities] = useState<City[]>([]);
 * useEffect(() => {
 *   citiesService.getAllCities().then(setCities);
 * }, []);
 * ```
 *
 * @see {@link apiClient} para el cliente HTTP subyacente.
 * @see {@link City} para la estructura de datos de ciudad.
 */

import { apiClient } from './api';

/**
 * Interfaz que representa una ciudad en el sistema VitalCare.
 * Coincide exactamente con la estructura CityDTO del backend Java.
 *
 * @interface
 */
export interface City {
  /** Identificador único de la ciudad (UUID como string) */
  id: string;
  /** Nombre de la ciudad */
  name: string;
  /** ID del departamento al que pertenece (opcional, no siempre incluido) */
  departmentId?: string;
}

/**
 * Servicio para el manejo de ciudades desde el backend.
 * Proporciona métodos para obtener información de ciudades del sistema médico.
 */
export const citiesService = {
  /**
   * Obtiene todas las ciudades disponibles desde el backend.
   *
   * Realiza una petición GET al endpoint /api/cities y retorna la lista
   * completa de ciudades configuradas en el sistema.
   *
   * @returns {Promise<City[]>} Lista de ciudades con su información completa.
   *
   * @description
   * Proceso de obtención:
   * 1. Realiza petición GET a /api/cities
   * 2. Registra la operación en consola para debugging
   * 3. Retorna los datos obtenidos del backend
   *
   * Manejo de errores:
   * - Si hay error de conexión, usa datos de fallback
   * - Registra el error en consola
   * - Retorna ciudades de ejemplo para Colombia
   *
   * @example
   * ```typescript
   * try {
   *   const cities = await citiesService.getAllCities();
   *   console.log('Ciudades obtenidas:', cities.length);
   * } catch (error) {
   *   console.error('Error al cargar ciudades:', error);
   * }
   * ```
   */
  getAllCities: async (): Promise<City[]> => {
    try {
      console.log('Obteniendo ciudades desde: /api/cities');
      const cities = await apiClient.get<City[]>('/cities');
      console.log('Ciudades obtenidas del backend:', cities);
      return cities;
    } catch (error) {
      console.error('Error al obtener ciudades del backend:', error);
      console.log('Usando ciudades de fallback...');

      // Fallback con ciudades de ejemplo (UUIDs válidos para testing)
      return [
        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Bogotá' },
        { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Medellín' },
        { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Cali' },
        { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Barranquilla' },
        { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Cartagena' },
        { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Bucaramanga' },
        { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Pereira' },
        { id: '550e8400-e29b-41d4-a716-446655440007', name: 'Manizales' },
        { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Santa Marta' },
        { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Ibagué' },
      ];
    }
  },
};
