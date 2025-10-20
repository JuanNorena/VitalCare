/**
 * Datos mock para pruebas unitarias.
 * 
 * Este módulo proporciona datos de prueba consistentes y reutilizables
 * que simulan las respuestas del backend para diferentes entidades.
 * 
 * Los datos están estructurados para cubrir casos comunes de prueba:
 * - Usuarios de diferentes roles (PATIENT, DOCTOR, ADMIN)
 * - Citas médicas en diferentes estados
 * - Consultas médicas con historial
 * - Perfiles completos con relaciones
 * 
 * @module mockData
 */

import type { 
  User, 
  JwtResponse,
} from '@/types/api';

/**
 * Usuario mock tipo PACIENTE con todos los campos completos.
 */
export const mockPatientUser: User = {
  id: 'patient-123',
  email: 'patient@test.com',
  username: 'juanperez',
  enabled: true,
  role: 'PATIENT',
  profileId: 'patient-profile-123',
};

/**
 * Usuario mock tipo DOCTOR con todos los campos completos.
 */
export const mockDoctorUser: User = {
  id: 'doctor-123',
  email: 'doctor@test.com',
  username: 'mariagarcia',
  enabled: true,
  role: 'DOCTOR',
  profileId: 'doctor-profile-123',
};

/**
 * Usuario mock tipo ADMIN sin profileId (los admins no tienen perfil).
 */
export const mockAdminUser: User = {
  id: 'admin-123',
  email: 'admin@test.com',
  username: 'admin',
  enabled: true,
  role: 'ADMIN',
  profileId: undefined,
};

/**
 * Respuesta mock de login exitoso con tokens.
 */
export const mockLoginResponse: JwtResponse = {
  accessToken: 'mock-access-token-123',
  refreshToken: 'mock-refresh-token-456',
};

/**
 * Perfil de doctor mock con especialidad y licencia.
 */
export const mockDoctorProfile = {
  id: 'doctor-profile-123',
  name: 'María',
  lastName: 'García',
  idNumber: '9876543210',
  email: 'doctor@test.com',
  specialty: 'Cardiología',
  licenseNumber: 'LIC-12345',
};

/**
 * Perfil de paciente mock con información de contacto.
 */
export const mockPatientProfile = {
  id: 'patient-profile-123',
  name: 'Juan',
  lastName: 'Pérez',
  idNumber: '1234567890',
  email: 'patient@test.com',
  phoneNumber: '3001234567',
  address: 'Calle 123 #45-67',
  dateOfBirth: '1990-05-15',
};

/**
 * Cita médica mock en estado SCHEDULED.
 */
export const mockAppointment = {
  id: 'appointment-123',
  patientId: 'patient-profile-123',
  patientName: 'Juan Pérez',
  doctorId: 'doctor-profile-123',
  doctorName: 'Dra. María García',
  specialty: 'Cardiología',
  appointmentDate: '2024-12-25',
  startTime: '10:00',
  endTime: '11:00',
  status: 'SCHEDULED',
  reason: 'Control de presión arterial',
  createdAt: new Date('2024-12-01').toISOString(),
};

/**
 * Cita médica mock en estado COMPLETED.
 */
export const mockCompletedAppointment = {
  ...mockAppointment,
  id: 'appointment-completed-123',
  status: 'COMPLETED',
  appointmentDate: '2024-12-20',
};

/**
 * Cita médica mock en estado CANCELLED.
 */
export const mockCancelledAppointment = {
  ...mockAppointment,
  id: 'appointment-cancelled-123',
  status: 'CANCELLED',
  appointmentDate: '2024-12-22',
};

/**
 * Lista de citas médicas mock para pruebas de listado.
 */
export const mockAppointmentsList = [
  mockAppointment,
  mockCompletedAppointment,
  mockCancelledAppointment,
];

/**
 * Consulta médica mock con signos vitales y diagnóstico.
 */
export const mockConsultation = {
  id: 'consultation-123',
  appointmentId: 'appointment-123',
  patientId: 'patient-profile-123',
  doctorId: 'doctor-profile-123',
  consultationDate: '2024-12-25',
  reason: 'Control de presión arterial',
  symptoms: 'Dolor de cabeza, mareos',
  diagnosis: 'Hipertensión arterial leve',
  treatment: 'Enalapril 10mg cada 12 horas',
  notes: 'Paciente debe controlar presión diariamente',
  vitalSigns: {
    bloodPressure: '140/90',
    heartRate: 85,
    temperature: 36.5,
    weight: 75.5,
    height: 170,
  },
  createdAt: new Date('2024-12-25T10:00:00').toISOString(),
};

/**
 * Medicamento mock.
 */
export const mockMedication = {
  id: 'medication-123',
  name: 'Enalapril',
  dosage: '10mg',
  frequency: 'Cada 12 horas',
  duration: '30 días',
  instructions: 'Tomar con alimentos',
};

/**
 * Registro médico (historial) mock.
 */
export const mockMedicalRecord = {
  patientId: 'patient-profile-123',
  allergies: ['Penicilina', 'Polen'],
  chronicConditions: ['Hipertensión'],
  bloodType: 'O+',
  consultations: [mockConsultation],
  medications: [mockMedication],
};

/**
 * Factory function para crear usuarios mock personalizados.
 * 
 * @param {Partial<User>} overrides - Campos a sobrescribir
 * @returns {User} Usuario mock personalizado
 * 
 * @example
 * ```tsx
 * const customUser = createMockUser({ 
 *   email: 'custom@test.com',
 *   role: 'DOCTOR' 
 * });
 * ```
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    ...mockPatientUser,
    ...overrides,
  };
}

/**
 * Factory function para crear citas mock personalizadas.
 * 
 * @param {Partial<typeof mockAppointment>} overrides - Campos a sobrescribir
 * @returns {typeof mockAppointment} Cita mock personalizada
 * 
 * @example
 * ```tsx
 * const customAppointment = createMockAppointment({ 
 *   status: 'CANCELLED',
 *   reason: 'Emergencia' 
 * });
 * ```
 */
export function createMockAppointment(overrides: Partial<typeof mockAppointment> = {}) {
  return {
    ...mockAppointment,
    ...overrides,
  };
}

/**
 * Factory function para crear consultas mock personalizadas.
 * 
 * @param {Partial<typeof mockConsultation>} overrides - Campos a sobrescribir
 * @returns {typeof mockConsultation} Consulta mock personalizada
 */
export function createMockConsultation(overrides: Partial<typeof mockConsultation> = {}) {
  return {
    ...mockConsultation,
    ...overrides,
  };
}
