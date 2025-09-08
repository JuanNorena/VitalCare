/**
 * Tipos para la integración con el backend Java VitalCare
 */

// Usuario del sistema (según UserDTO del backend)
export interface User {
  id: string;
  username?: string;
  email: string;
  enabled: boolean;
  role: string; // Nombre del rol
}

// Petición de login (según UserDTO del backend para login)
export interface LoginRequest {
  email: string;
  password: string;
}

// Petición de registro (según RegistrationRequest del backend)
export interface RegistrationRequest {
  // Campos básicos de usuario (User) - REQUERIDOS
  email: string;
  password: string;
  
  // Campos específicos para pacientes (PatientProfile)
  gender?: 'MALE' | 'FEMALE' | 'OTHER'; // Debe coincidir con enum Gender del backend
  birthDate?: string; // LocalDate as ISO string (YYYY-MM-DD) - DEBE SER FORMATO VÁLIDO
  bloodType?: string; // Tipos: A+, A-, B+, B-, AB+, AB-, O+, O-
  phone?: string;
  address?: string;
  cityId?: string; // UUID as string - DEBE SER UUID VÁLIDO del backend
  
  // Campos específicos para doctores (DoctorProfile)
  licenseNumber?: string; // REQUERIDO para doctores
  specialty?: string; // REQUERIDO para doctores
  lastName?: string; // REQUERIDO para doctores
  
  // Campos específicos para staff (StaffProfile)
  department?: string; // Opcional para staff
  position?: string; // Opcional para staff
}

// Respuesta JWT del backend
export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
}

// ========================================
// TIPOS DE CITAS MÉDICAS - CONFORME AL BACKEND
// ========================================

/**
 * AppointmentDTO exacto del backend
 * Basado en: co.edu.uniquindio.vitalcareback.Dto.scheduling.AppointmentDTO
 * CAMPOS DISPONIBLES EN EL BACKEND:
 * - id: UUID 
 * - patientId: UUID
 * - doctorId: UUID  
 * - siteId: UUID (opcional)
 * - scheduledDate: LocalDateTime
 * - status: String
 */
export interface Appointment {
  id?: string;              // UUID (opcional al crear, requerido en respuestas)
  patientId: string;        // UUID (requerido)
  doctorId: string;         // UUID (requerido) 
  siteId?: string;          // UUID (opcional)
  scheduledDate: string;    // LocalDateTime como ISO string (requerido)
  status?: 'SCHEDULED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'; // String en backend
}

/**
 * Estados de cita según AppointmentStatus enum del backend
 */
export type AppointmentStatus = 
  | 'SCHEDULED'    // Estado inicial
  | 'RESCHEDULED'  // Reprogramada
  | 'CANCELLED'    // Cancelada
  | 'COMPLETED'    // Completada (confirmada asistencia)
  | 'NO_SHOW';     // No se presentó

/**
 * Alias para compatibilidad con el backend
 * Usa la misma interfaz que Appointment
 */
export type CreateAppointmentRequest = Appointment;

/**
 * Alias para compatibilidad con componentes existentes
 */
export type AppointmentCreate = Appointment;

// Respuesta general de la API
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
}

// Error de la API
export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
  path: string;
}
