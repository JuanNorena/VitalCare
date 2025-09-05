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
    return apiClient.post<User>('/register/patient', data);
  },

  // Registro específico de doctor (POST /api/register/doctor)
  registerDoctor: async (data: RegistrationRequest): Promise<User> => {
    return apiClient.post<User>('/register/doctor', data);
  },

  // Registro específico de staff (POST /api/register/staff)
  registerStaff: async (data: RegistrationRequest): Promise<User> => {
    return apiClient.post<User>('/register/staff', data);
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
