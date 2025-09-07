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
  // Función auxiliar para validar UUID
  isValidUUID: (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  },

  // Función auxiliar para validar fecha
  isValidDate: (dateStr: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  },

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
    // Validar campos básicos requeridos
    if (!data.email) {
      throw new Error('Email es requerido');
    }
    if (!data.password) {
      throw new Error('Contraseña es requerida');
    }

    // Validar UUID de ciudad si se proporciona
    if (data.cityId && !authService.isValidUUID(data.cityId)) {
      throw new Error('Debe seleccionar una ciudad válida');
    }

    // Validar fecha de nacimiento si se proporciona
    if (data.birthDate && !authService.isValidDate(data.birthDate)) {
      throw new Error('Fecha de nacimiento debe tener formato YYYY-MM-DD');
    }

    // Validar y transformar datos específicos para paciente
    const transformedData = {
      email: data.email.trim(),
      password: data.password,
      // Campos específicos de paciente
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.address && { address: data.address.trim() }),
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
    // Validar campos básicos requeridos
    if (!data.email) {
      throw new Error('Email es requerido');
    }
    if (!data.password) {
      throw new Error('Contraseña es requerida');
    }
    
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

    // Validar UUID de ciudad si se proporciona
    if (data.cityId && !authService.isValidUUID(data.cityId)) {
      throw new Error('Debe seleccionar una ciudad válida');
    }

    // Validar fecha de nacimiento si se proporciona
    if (data.birthDate && !authService.isValidDate(data.birthDate)) {
      throw new Error('Fecha de nacimiento debe tener formato YYYY-MM-DD');
    }

    const transformedData = {
      email: data.email.trim(),
      password: data.password,
      // Campos básicos opcionales
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.address && { address: data.address.trim() }),
      ...(data.birthDate && { birthDate: data.birthDate }),
      ...(data.gender && { gender: data.gender }),
      ...(data.cityId && { cityId: data.cityId }),
      // Campos específicos de doctor (requeridos)
      lastName: data.lastName.trim(),
      licenseNumber: data.licenseNumber.trim(),
      specialty: data.specialty.trim(),
    };
    
    console.log('Enviando datos de registro doctor:', transformedData);
    return apiClient.post<User>('/register/doctor', transformedData);
  },

  // Registro específico de staff (POST /api/register/staff)
  registerStaff: async (data: RegistrationRequest): Promise<User> => {
    // Validar campos básicos requeridos
    if (!data.email) {
      throw new Error('Email es requerido');
    }
    if (!data.password) {
      throw new Error('Contraseña es requerida');
    }

    // Validar UUID de ciudad si se proporciona
    if (data.cityId && !authService.isValidUUID(data.cityId)) {
      throw new Error('Debe seleccionar una ciudad válida');
    }

    // Validar fecha de nacimiento si se proporciona
    if (data.birthDate && !authService.isValidDate(data.birthDate)) {
      throw new Error('Fecha de nacimiento debe tener formato YYYY-MM-DD');
    }

    const transformedData = {
      email: data.email.trim(),
      password: data.password,
      // Campos básicos opcionales
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.address && { address: data.address.trim() }),
      ...(data.birthDate && { birthDate: data.birthDate }),
      ...(data.gender && { gender: data.gender }),
      ...(data.cityId && { cityId: data.cityId }),
      // Campos específicos de staff (opcionales)
      ...(data.department && { department: data.department.trim() }),
      ...(data.position && { position: data.position.trim() }),
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
