/**
 * Servicio para manejar ciudades desde el backend
 */

import { apiClient } from './api';

export interface City {
  id: string; // UUID
  name: string;
  departmentId: string;
  departmentName: string;
}

export const citiesService = {
  // Obtener todas las ciudades disponibles
  getAllCities: async (): Promise<City[]> => {
    try {
      return await apiClient.get<City[]>('/cities');
    } catch (error) {
      console.error('Error al obtener ciudades:', error);
      // Fallback con ciudades predefinidas si la API no está disponible
      return [
        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Bogotá', departmentId: '550e8400-e29b-41d4-a716-446655440010', departmentName: 'Cundinamarca' },
        { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Medellín', departmentId: '550e8400-e29b-41d4-a716-446655440011', departmentName: 'Antioquia' },
        { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Cali', departmentId: '550e8400-e29b-41d4-a716-446655440012', departmentName: 'Valle del Cauca' },
        { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Barranquilla', departmentId: '550e8400-e29b-41d4-a716-446655440013', departmentName: 'Atlántico' },
        { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Cartagena', departmentId: '550e8400-e29b-41d4-a716-446655440014', departmentName: 'Bolívar' },
        { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Bucaramanga', departmentId: '550e8400-e29b-41d4-a716-446655440015', departmentName: 'Santander' },
        { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Pereira', departmentId: '550e8400-e29b-41d4-a716-446655440016', departmentName: 'Risaralda' },
        { id: '550e8400-e29b-41d4-a716-446655440007', name: 'Manizales', departmentId: '550e8400-e29b-41d4-a716-446655440017', departmentName: 'Caldas' },
        { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Santa Marta', departmentId: '550e8400-e29b-41d4-a716-446655440018', departmentName: 'Magdalena' },
        { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Ibagué', departmentId: '550e8400-e29b-41d4-a716-446655440019', departmentName: 'Tolima' },
      ];
    }
  },

  // Obtener ciudades por departamento
  getCitiesByDepartment: async (departmentId: string): Promise<City[]> => {
    try {
      return await apiClient.get<City[]>(`/cities/department/${departmentId}`);
    } catch (error) {
      console.error('Error al obtener ciudades por departamento:', error);
      return [];
    }
  },
};
