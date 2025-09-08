/**
 * Servicio de citas médicas para el backend Java
 * CONFORME 100% AL BACKEND ANALIZADO - AppointmentController
 */

import { apiClient } from './api';

// ========================================
// TIPOS EXACTOS SEGÚN EL BACKEND
// ========================================

/**
 * AppointmentDTO exacto del backend
 * Basado en: co.edu.uniquindio.vitalcareback.Dto.scheduling.AppointmentDTO
 */
export interface AppointmentDTO {
  id?: string;              // UUID (opcional al crear, requerido en respuestas)
  patientId: string;        // UUID (requerido)
  doctorId: string;         // UUID (requerido) 
  siteId?: string;          // UUID (opcional)
  scheduledDate: string;    // LocalDateTime como ISO string (requerido)
  status?: AppointmentStatus; // Enum (opcional, por defecto SCHEDULED)
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
 * Request para reprogramar cita
 * Usado en PUT /api/appointments/{id}/reschedule
 */
export interface RescheduleAppointmentRequest {
  scheduledDate: string;    // Nueva fecha en formato ISO
  siteId?: string;         // Opcional: cambiar sitio también
}

// ========================================
// SERVICIO CONFORME AL BACKEND
// ========================================

export const appointmentService = {
  /**
   * CREAR NUEVA CITA
   * Endpoint: POST /api/appointments/create
   * Requiere: Autenticación
   * Body: AppointmentDTO
   * Response: AppointmentDTO
   */
  createAppointment: async (appointmentData: AppointmentDTO): Promise<AppointmentDTO> => {
    console.log('=== CREAR CITA ===');
    console.log('Datos enviados:', appointmentData);
    
    // Validación de campos requeridos
    if (!appointmentData.patientId) {
      throw new Error('patientId es requerido');
    }
    if (!appointmentData.doctorId) {
      throw new Error('doctorId es requerido');
    }
    if (!appointmentData.scheduledDate) {
      throw new Error('scheduledDate es requerido');
    }

    const result = await apiClient.post<AppointmentDTO>('/appointments/create', appointmentData);
    console.log('Cita creada:', result);
    return result;
  },

  /**
   * OBTENER CITAS POR PACIENTE
   * Endpoint: GET /api/appointments/patient/{patientId}
   * Requiere: Autenticación
   * Response: List<AppointmentDTO>
   */
  getAppointmentsByPatient: async (patientId: string): Promise<AppointmentDTO[]> => {
    console.log(`=== OBTENER CITAS DEL PACIENTE ${patientId} ===`);
    
    if (!patientId) {
      throw new Error('patientId es requerido');
    }

    const result = await apiClient.get<AppointmentDTO[]>(`/appointments/patient/${patientId}`);
    console.log(`Citas del paciente obtenidas: ${result.length}`);
    return result;
  },

  /**
   * OBTENER CITAS POR DOCTOR
   * Endpoint: GET /api/appointments/doctor/{doctorId}
   * Requiere: Autenticación
   * Response: List<AppointmentDTO>
   */
  getAppointmentsByDoctor: async (doctorId: string): Promise<AppointmentDTO[]> => {
    console.log(`=== OBTENER CITAS DEL DOCTOR ${doctorId} ===`);
    
    if (!doctorId) {
      throw new Error('doctorId es requerido');
    }

    const result = await apiClient.get<AppointmentDTO[]>(`/appointments/doctor/${doctorId}`);
    console.log(`Citas del doctor obtenidas: ${result.length}`);
    return result;
  },

  /**
   * REPROGRAMAR CITA
   * Endpoint: PUT /api/appointments/{id}/reschedule
   * Requiere: Autenticación
   * Body: AppointmentDTO (con nueva scheduledDate)
   * Response: AppointmentDTO
   */
  rescheduleAppointment: async (id: string, newData: RescheduleAppointmentRequest): Promise<AppointmentDTO> => {
    console.log(`=== REPROGRAMAR CITA ${id} ===`);
    console.log('Nuevos datos:', newData);
    
    if (!id) {
      throw new Error('id de cita es requerido');
    }
    if (!newData.scheduledDate) {
      throw new Error('scheduledDate es requerido');
    }

    // El backend espera un AppointmentDTO, no solo la nueva fecha
    const appointmentUpdateData: Partial<AppointmentDTO> = {
      scheduledDate: newData.scheduledDate,
      ...(newData.siteId && { siteId: newData.siteId })
    };

    const result = await apiClient.put<AppointmentDTO>(`/appointments/${id}/reschedule`, appointmentUpdateData);
    console.log('Cita reprogramada:', result);
    return result;
  },

  /**
   * CANCELAR CITA
   * Endpoint: PUT /api/appointments/{id}/cancel
   * Requiere: Autenticación
   * Response: Void (204 No Content)
   */
  cancelAppointment: async (id: string): Promise<void> => {
    console.log(`=== CANCELAR CITA ${id} ===`);
    
    if (!id) {
      throw new Error('id de cita es requerido');
    }

    await apiClient.put<void>(`/appointments/${id}/cancel`);
    console.log('Cita cancelada exitosamente');
  },

  /**
   * CONFIRMAR ASISTENCIA
   * Endpoint: PUT /api/appointments/{id}/confirm-attendance
   * Requiere: Autenticación (típicamente Doctor/Staff)
   * Response: Void (204 No Content)
   */
  confirmAttendance: async (id: string): Promise<void> => {
    console.log(`=== CONFIRMAR ASISTENCIA CITA ${id} ===`);
    
    if (!id) {
      throw new Error('id de cita es requerido');
    }

    await apiClient.put<void>(`/appointments/${id}/confirm-attendance`);
    console.log('Asistencia confirmada exitosamente');
  },

  /**
   * UTILIDADES
   */

  // Formatear fecha para el backend (LocalDateTime)
  formatDateForBackend: (date: Date): string => {
    return date.toISOString();
  },

  // Parsear fecha del backend
  parseDateFromBackend: (dateString: string): Date => {
    return new Date(dateString);
  },

  // Obtener texto legible para estado
  getStatusText: (status: AppointmentStatus): string => {
    const statusMap: Record<AppointmentStatus, string> = {
      SCHEDULED: 'Programada',
      RESCHEDULED: 'Reprogramada',
      CANCELLED: 'Cancelada',
      COMPLETED: 'Completada',
      NO_SHOW: 'No se presentó'
    };
    return statusMap[status] || status;
  },

  // Validar UUID
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
};
