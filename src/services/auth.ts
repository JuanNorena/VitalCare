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
    // Validar y transformar datos específicos para paciente
    const transformedData = {
      email: data.email,
      password: data.password,
      // Campos específicos de paciente
      ...(data.phone && { phone: data.phone }),
      ...(data.address && { address: data.address }),
      ...(data.birthDate && { birthDate: data.birthDate }),
      ...(data.gender && { gender: data.gender }),
      ...(data.cityId && { cityId: data.cityId }),
      ...(data.bloodType && { bloodType: data.bloodType }),
    };
    
    console.log('Enviando datos de registro paciente:', transformedData);
    return apiClient.post<User>('/register/patient', transformedData);
  },

  // Registro específico de doctor (POST /api/register/doctor)
  registerDoctor: async (data: RegistrationRequest): Promise<User> => {
    // Validar campos requeridos para doctor
    if (!data.lastName) {
      throw new Error('Apellidos son requeridos para doctores');
    }
    if (!data.licenseNumber) {
      throw new Error('Número de licencia médica es requerido para doctores');
    }
    if (!data.specialty) {
      throw new Error('Especialidad es requerida para doctores');
    }

    const transformedData = {
      email: data.email,
      password: data.password,
      // Campos básicos opcionales
      ...(data.phone && { phone: data.phone }),
      ...(data.address && { address: data.address }),
      ...(data.birthDate && { birthDate: data.birthDate }),
      ...(data.gender && { gender: data.gender }),
      ...(data.cityId && { cityId: data.cityId }),
      // Campos específicos de doctor (requeridos)
      lastName: data.lastName,
      licenseNumber: data.licenseNumber,
      specialty: data.specialty,
    };
    
    console.log('Enviando datos de registro doctor:', transformedData);
    return apiClient.post<User>('/register/doctor', transformedData);
  },

  // Registro específico de staff (POST /api/register/staff)
  registerStaff: async (data: RegistrationRequest): Promise<User> => {
    const transformedData = {
      email: data.email,
      password: data.password,
      // Campos básicos opcionales
      ...(data.phone && { phone: data.phone }),
      ...(data.address && { address: data.address }),
      ...(data.birthDate && { birthDate: data.birthDate }),
      ...(data.gender && { gender: data.gender }),
      ...(data.cityId && { cityId: data.cityId }),
      // Campos específicos de staff (opcionales)
      ...(data.department && { department: data.department }),
      ...(data.position && { position: data.position }),
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
