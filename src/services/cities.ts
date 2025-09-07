/**
 * Servicio para manejar ciudades desde el backend
 * Basado en el análisis del endpoint: GET /api/cities
 */

import { apiClient } from './api';

// Interfaz que coincide exactamente con CityDTO del backend
export interface City {
  id: string; // UUID como string
  name: string; // Nombre de la ciudad
  departmentId?: string; // Opcional - no siempre se incluye en la respuesta
}

export const citiesService = {
  // Obtener todas las ciudades desde el backend
  // Endpoint: GET /api/cities
  // Retorna: List<CityDTO> con { id: UUID, name: String }
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
