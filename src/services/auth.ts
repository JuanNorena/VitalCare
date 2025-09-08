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

  // Función auxiliar para validar fecha ISO (YYYY-MM-DD)
  isValidDate: (dateStr: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  },

  // Función auxiliar para convertir string UUID a formato aceptado por backend
  formatUUID: (uuidStr: string): string => {
    return uuidStr.trim();
  },

  // Función auxiliar para validar email
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Login de usuario (POST /api/auth/login)
  login: async (data: LoginRequest): Promise<JwtResponse> => {
    const response = await apiClient.post<JwtResponse>('/auth/login', {
      email: data.email,
      password: data.password,
    });

    // guardar tokens
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    return response;
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
    console.log('=== VALIDACIÓN REGISTRO PACIENTE ===');
    console.log('Datos recibidos:', data);

    // 1. VALIDAR CAMPOS BÁSICOS REQUERIDOS
    if (!data.email || !authService.isValidEmail(data.email)) {
      throw new Error('Email válido es requerido');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('Contraseña debe tener al menos 6 caracteres');
    }

    // 2. VALIDAR CAMPOS ESPECÍFICOS DE PACIENTE
    
    // Validar UUID de ciudad si se proporciona
    if (data.cityId) {
      if (!authService.isValidUUID(data.cityId)) {
        throw new Error('Debe seleccionar una ciudad válida');
      }
    }

    // Validar fecha de nacimiento si se proporciona
    if (data.birthDate) {
      if (!authService.isValidDate(data.birthDate)) {
        throw new Error('Fecha de nacimiento debe tener formato YYYY-MM-DD');
      }
    }

    // Validar género si se proporciona
    if (data.gender && !['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
      throw new Error('Género debe ser MALE, FEMALE o OTHER');
    }

    // Validar tipo de sangre si se proporciona
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (data.bloodType && !validBloodTypes.includes(data.bloodType)) {
      throw new Error('Tipo de sangre debe ser uno de: ' + validBloodTypes.join(', '));
    }

    // 3. TRANSFORMAR DATOS SEGÚN BACKEND RegistrationRequest
    const transformedData: any = {
      // Campos básicos (requeridos)
      email: data.email.trim(),
      password: data.password,
      
      // Campos específicos de paciente (opcionales pero validados)
      ...(data.gender && { gender: data.gender }),
      ...(data.birthDate && { birthDate: data.birthDate }), // Backend espera LocalDate
      ...(data.bloodType && { bloodType: data.bloodType }),
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.address && { address: data.address.trim() }),
      ...(data.cityId && { cityId: authService.formatUUID(data.cityId) }), // Backend espera UUID
    };
    
    console.log('Datos transformados para backend:', transformedData);
    console.log('=== ENVIANDO A /register/patient ===');
    
    return apiClient.post<User>('/register/patient', transformedData);
  },

  // Registro específico de doctor (POST /api/register/doctor)
  registerDoctor: async (data: RegistrationRequest): Promise<User> => {
    console.log('=== VALIDACIÓN REGISTRO DOCTOR ===');
    console.log('Datos recibidos:', data);

    // 1. VALIDAR CAMPOS BÁSICOS REQUERIDOS
    if (!data.email || !authService.isValidEmail(data.email)) {
      throw new Error('Email válido es requerido');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('Contraseña debe tener al menos 6 caracteres');
    }
    
    // 2. VALIDAR CAMPOS ESPECÍFICOS DE DOCTOR (REQUERIDOS)
    if (!data.lastName || data.lastName.trim().length === 0) {
      throw new Error('Apellidos son requeridos para doctores');
    }
    if (!data.licenseNumber || data.licenseNumber.trim().length === 0) {
      throw new Error('Número de licencia médica es requerido para doctores');
    }
    if (!data.specialty || data.specialty.trim().length === 0) {
      throw new Error('Especialidad es requerida para doctores');
    }

    // 3. VALIDAR CAMPOS OPCIONALES
    if (data.cityId && !authService.isValidUUID(data.cityId)) {
      throw new Error('Debe seleccionar una ciudad válida');
    }
    if (data.birthDate && !authService.isValidDate(data.birthDate)) {
      throw new Error('Fecha de nacimiento debe tener formato YYYY-MM-DD');
    }
    if (data.gender && !['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
      throw new Error('Género debe ser MALE, FEMALE o OTHER');
    }

    // 4. TRANSFORMAR DATOS SEGÚN BACKEND RegistrationRequest
    const transformedData: any = {
      // Campos básicos (requeridos)
      email: data.email.trim(),
      password: data.password,
      
      // Campos específicos de doctor (requeridos)
      lastName: data.lastName.trim(),
      licenseNumber: data.licenseNumber.trim(),
      specialty: data.specialty.trim(),
      
      // Campos opcionales
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.address && { address: data.address.trim() }),
      ...(data.birthDate && { birthDate: data.birthDate }),
      ...(data.gender && { gender: data.gender }),
      ...(data.cityId && { cityId: authService.formatUUID(data.cityId) }),
    };
    
    console.log('Datos transformados para backend:', transformedData);
    console.log('=== ENVIANDO A /register/doctor ===');
    
    return apiClient.post<User>('/register/doctor', transformedData);
  },

  // Registro específico de staff (POST /api/register/staff)
  registerStaff: async (data: RegistrationRequest): Promise<User> => {
    console.log('=== VALIDACIÓN REGISTRO STAFF ===');
    console.log('Datos recibidos:', data);

    // 1. VALIDAR CAMPOS BÁSICOS REQUERIDOS
    if (!data.email || !authService.isValidEmail(data.email)) {
      throw new Error('Email válido es requerido');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('Contraseña debe tener al menos 6 caracteres');
    }

    // 2. VALIDAR CAMPOS OPCIONALES
    if (data.cityId && !authService.isValidUUID(data.cityId)) {
      throw new Error('Debe seleccionar una ciudad válida');
    }
    if (data.birthDate && !authService.isValidDate(data.birthDate)) {
      throw new Error('Fecha de nacimiento debe tener formato YYYY-MM-DD');
    }
    if (data.gender && !['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
      throw new Error('Género debe ser MALE, FEMALE o OTHER');
    }

    // 3. TRANSFORMAR DATOS SEGÚN BACKEND RegistrationRequest
    const transformedData: any = {
      // Campos básicos (requeridos)
      email: data.email.trim(),
      password: data.password,
      
      // Campos opcionales
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.address && { address: data.address.trim() }),
      ...(data.birthDate && { birthDate: data.birthDate }),
      ...(data.gender && { gender: data.gender }),
      ...(data.cityId && { cityId: authService.formatUUID(data.cityId) }),
      
      // Campos específicos de staff (opcionales)
      ...(data.department && { department: data.department.trim() }),
      ...(data.position && { position: data.position.trim() }),
    };
    
    console.log('Datos transformados para backend:', transformedData);
    console.log('=== ENVIANDO A /register/staff ===');
    
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
