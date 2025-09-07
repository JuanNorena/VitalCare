/**
 * Servicio de autenticación para el backend Java
 */

import { apiClient } from './api';
import type { 
  LoginRequest, 
  RegistrationRequest, 
  JwtResponse, 
  User 
} from '@/types/api';

export const authService = {
  // Login de usuario (POST /api/auth/login)
  login: async (data: LoginRequest): Promise<JwtResponse> => {
    return apiClient.post<JwtResponse>('/auth/login', {
      email: data.email,
      password: data.password
    });
  },

  // Registro genérico de usuario (POST /api/auth/register) 
  register: async (data: RegistrationRequest): Promise<User> => {
    return apiClient.post<User>('/auth/register', {
      email: data.email,
      password: data.password
    });
  },

  // Registro específico de paciente (POST /api/register/patient)
  registerPatient: async (data: RegistrationRequest): Promise<User> => {
    // Transformar datos para compatibilidad con backend Java
    const transformedData = {
      ...data,
      // Convertir cityId de string a UUID si existe
      cityId: data.cityId ? data.cityId : null,
      // Asegurar formato correcto de fecha
      birthDate: data.birthDate || null,
      // Asegurar que gender sea el enum correcto
      gender: data.gender || null
    };
    
    console.log('Enviando datos de registro paciente:', transformedData);
    return apiClient.post<User>('/register/patient', transformedData);
  },

  // Registro específico de doctor (POST /api/register/doctor)
  registerDoctor: async (data: RegistrationRequest): Promise<User> => {
    const transformedData = {
      ...data,
      cityId: data.cityId ? data.cityId : null,
      birthDate: data.birthDate || null,
      gender: data.gender || null
    };
    
    console.log('Enviando datos de registro doctor:', transformedData);
    return apiClient.post<User>('/register/doctor', transformedData);
  },

  // Registro específico de staff (POST /api/register/staff)
  registerStaff: async (data: RegistrationRequest): Promise<User> => {
    const transformedData = {
      ...data,
      cityId: data.cityId ? data.cityId : null,
      birthDate: data.birthDate || null,
      gender: data.gender || null
    };
    
    console.log('Enviando datos de registro staff:', transformedData);
    return apiClient.post<User>('/register/staff', transformedData);
  },

  // Refrescar token (POST /api/auth/refresh)
  refreshToken: async (refreshToken: string): Promise<JwtResponse> => {
    return apiClient.post<JwtResponse>('/auth/refresh?refreshToken=' + refreshToken);
  },

  // Obtener usuario actual (necesario implementar endpoint en backend)
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me');
  },

  // Logout (limpiar tokens localmente)
  logout: async (): Promise<void> => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
