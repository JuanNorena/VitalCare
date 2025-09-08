/**
 * Definiciones de tipos TypeScript para la integración con el backend Java de VitalCare.
 *
 * Este módulo contiene todas las interfaces y tipos que representan las estructuras
 * de datos intercambiadas entre el frontend React y el backend Spring Boot.
 * Todas las interfaces están diseñadas para coincidir exactamente con los DTOs
 * del backend para asegurar compatibilidad y evitar errores de serialización.
 *
 * @example
 * ```typescript
 * import type { User, LoginRequest, Appointment } from '@/types/api';
 *
 * // Uso en componentes
 * interface Props {
 *   user: User;
 *   onLogin: (credentials: LoginRequest) => void;
 * }
 *
 * // Creación de cita
 * const appointment: Appointment = {
 *   patientId: 'uuid-paciente',
 *   doctorId: 'uuid-doctor',
 *   scheduledDate: '2024-01-15T10:00:00'
 * };
 * ```
 *
 * @description
 * Los tipos están organizados por funcionalidad:
 * - Autenticación: User, LoginRequest, RegistrationRequest, JwtResponse
 * - Citas médicas: Appointment, AppointmentStatus, CreateAppointmentRequest
 * - Respuestas API: ApiResponse, ApiError
 *
 * Todas las fechas se manejan como strings ISO para compatibilidad con LocalDate/LocalDateTime de Java.
 * Los UUIDs se representan como strings para facilitar el manejo en JavaScript.
 *
 * @see {@link authService} para servicios de autenticación.
 * @see {@link appointmentService} para servicios de citas.
 */

// ========================================
// TIPOS DE AUTENTICACIÓN
// ========================================

/**
 * Representa un usuario del sistema VitalCare.
 * Corresponde al UserDTO del backend Java.
 * @interface User
 */
export interface User {
  /** Identificador único del usuario (UUID) */
  id: string;
  /** Nombre de usuario (opcional, puede ser null) */
  username?: string;
  /** Correo electrónico del usuario */
  email: string;
  /** Indica si la cuenta del usuario está habilitada */
  enabled: boolean;
  /** Rol del usuario en el sistema (ej: 'PATIENT', 'DOCTOR', 'STAFF') */
  role: string;
}

/**
 * Datos requeridos para el proceso de login.
 * Corresponde a la estructura esperada por el endpoint de autenticación.
 * @interface LoginRequest
 */
export interface LoginRequest {
  /** Correo electrónico del usuario */
  email: string;
  /** Contraseña del usuario */
  password: string;
}

/**
 * Datos para el registro de nuevos usuarios.
 * Incluye campos comunes y específicos por tipo de usuario.
 * Corresponde al RegistrationRequest del backend.
 * @interface RegistrationRequest
 */
export interface RegistrationRequest {
  // Campos básicos de usuario (requeridos para todos)
  /** Correo electrónico del usuario */
  email: string;
  /** Contraseña del usuario (mínimo 6 caracteres) */
  password: string;

  // Campos específicos para pacientes (todos opcionales)
  /** Género del paciente */
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  /** Fecha de nacimiento en formato YYYY-MM-DD */
  birthDate?: string;
  /** Tipo de sangre (A+, A-, B+, B-, AB+, AB-, O+, O-) */
  bloodType?: string;
  /** Número de teléfono */
  phone?: string;
  /** Dirección de residencia */
  address?: string;
  /** ID de la ciudad (UUID válido) */
  cityId?: string;

  // Campos específicos para doctores (requeridos para registro de doctores)
  /** Número de licencia médica */
  licenseNumber?: string;
  /** Especialidad médica */
  specialty?: string;
  /** Apellidos del doctor */
  lastName?: string;

  // Campos específicos para personal administrativo (opcionales)
  /** Departamento al que pertenece */
  department?: string;
  /** Posición o cargo */
  position?: string;
}

/**
 * Respuesta del servidor después de una autenticación exitosa.
 * Contiene los tokens JWT para mantener la sesión.
 * @interface JwtResponse
 */
export interface JwtResponse {
  /** Token de acceso JWT para autenticar requests */
  accessToken: string;
  /** Token de refresco para obtener nuevos access tokens */
  refreshToken: string;
}

// ========================================
// TIPOS DE CITAS MÉDICAS
// ========================================

/**
 * Representa una cita médica en el sistema.
 * Corresponde exactamente al AppointmentDTO del backend Java.
 * Esta interfaz debe mantenerse sincronizada con el backend.
 * @interface Appointment
 */
export interface Appointment {
  /** ID único de la cita (UUID, opcional al crear) */
  id?: string;
  /** ID del paciente (UUID, requerido cuando no se usa patientEmail) */
  patientId?: string;
  /** ID del doctor (UUID, requerido) */
  doctorId: string;
  /** ID del sitio/hospital (UUID, opcional) */
  siteId?: string;
  /** Fecha y hora programada en formato ISO string */
  scheduledDate: string;
  /** Estado actual de la cita */
  status?: AppointmentStatus;
  /** Email del paciente (requerido cuando no se usa patientId) */
  patientEmail?: string;
}

/**
 * Estados posibles de una cita médica.
 * Corresponde al enum AppointmentStatus del backend.
 * @typedef {'SCHEDULED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'} AppointmentStatus
 */
export type AppointmentStatus =
  | 'SCHEDULED'    // Cita programada inicialmente
  | 'RESCHEDULED'  // Cita reprogramada
  | 'CANCELLED'    // Cita cancelada
  | 'COMPLETED'    // Cita completada (paciente asistió)
  | 'NO_SHOW';     // Paciente no se presentó

/**
 * Alias para compatibilidad con el backend.
 * Representa una solicitud para crear una nueva cita.
 * @typedef {Appointment} CreateAppointmentRequest
 */
export type CreateAppointmentRequest = Appointment;

/**
 * Alias para compatibilidad con componentes existentes.
 * Representa los datos necesarios para crear una cita.
 * @typedef {Appointment} AppointmentCreate
 */
export type AppointmentCreate = Appointment;

// ========================================
// TIPOS DE RESPUESTAS API
// ========================================

/**
 * Respuesta genérica de la API.
 * Estructura estándar para respuestas del backend.
 * @interface ApiResponse
 * @template T - Tipo de los datos en la respuesta
 */
export interface ApiResponse<T = any> {
  /** Datos de la respuesta (opcional) */
  data?: T;
  /** Mensaje descriptivo de la respuesta */
  message?: string;
  /** Mensaje de error si ocurrió un problema */
  error?: string;
  /** Indica si la operación fue exitosa */
  success?: boolean;
}

/**
 * Representa un error ocurrido en la API.
 * Proporciona información detallada sobre el error.
 * @interface ApiError
 */
export interface ApiError {
  /** Mensaje descriptivo del error */
  message: string;
  /** Código de estado HTTP */
  status: number;
  /** Timestamp cuando ocurrió el error */
  timestamp: string;
  /** Ruta del endpoint donde ocurrió el error */
  path: string;
}
