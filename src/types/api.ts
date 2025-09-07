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

// Cita médica (según AppointmentDTO del backend)
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  siteId: string; // El backend usa siteId
  scheduledDate: string; // LocalDateTime as ISO string
  status: string;
}

// Petición para crear cita (según AppointmentDTO del backend)
export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  siteId: string;
  scheduledDate: string; // LocalDateTime as ISO string
  status?: string; // Opcional, se puede setear por defecto en backend
}

// Datos para crear nueva cita (más completo)
export interface AppointmentCreate {
  patientId: string;
  doctorId: string;
  siteId?: string; // Opcional con valor por defecto
  scheduledDate: string;
  reason: string;
  notes?: string;
  status: string;
}

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
