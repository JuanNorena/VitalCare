/**
 * Servicio de citas médicas para VitalCare.
 *
 * Este módulo proporciona todas las funciones necesarias para gestionar citas médicas,
 * incluyendo creación, consulta, reprogramación, cancelación y confirmación de asistencia.
 * Está diseñado para ser 100% conforme con el AppointmentController del backend Java.
 *
 * @example
 * ```typescript
 * import { appointmentService } from '@/services/appointments';
 *
 * // Crear una nueva cita
 * const appointment = await appointmentService.createAppointment({
 *   patientId: 'uuid-paciente',
 *   doctorId: 'uuid-doctor',
 *   scheduledDate: '2024-01-15T10:00:00'
 * });
 *
 * // Obtener citas de un paciente
 * const patientAppointments = await appointmentService.getAppointmentsByPatient('uuid-paciente');
 * ```
 *
 * @description
 * El servicio maneja todas las operaciones CRUD para citas médicas:
 * - Creación de nuevas citas
 * - Consulta de citas por paciente o doctor
 * - Reprogramación de citas existentes
 * - Cancelación de citas
 * - Confirmación de asistencia
 *
 * Todas las funciones incluyen validaciones, logging detallado y manejo de errores.
 * Los datos se envían y reciben en formato exacto al esperado por el backend.
 *
 * @see {@link AppointmentDTO} para la estructura de datos de citas.
 * @see {@link AppointmentStatus} para los estados posibles de citas.
 * @see {@link apiClient} para el cliente HTTP subyacente.
 */

import { apiClient } from './api';

// ========================================
// TIPOS EXACTOS SEGÚN EL BACKEND
// ========================================

/**
 * Representa una cita médica según el AppointmentDTO del backend.
 * Esta interfaz debe mantenerse sincronizada con el backend Java.
 * @interface AppointmentDTO
 */
export interface AppointmentDTO {
  /** ID único de la cita (UUID, opcional al crear) */
  id?: string;
  /** ID del paciente (UUID, requerido) */
  patientId: string;
  /** ID del doctor (UUID, requerido) */
  doctorId: string;
  /** ID del sitio/hospital (UUID, opcional) */
  siteId?: string;
  /** Fecha y hora programada en formato ISO string */
  scheduledDate: string;
  /** Estado actual de la cita */
  status?: AppointmentStatus;
}

/**
 * Estados posibles de una cita médica.
 * Corresponde exactamente al enum AppointmentStatus del backend.
 * @typedef {'SCHEDULED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'} AppointmentStatus
 */
export type AppointmentStatus =
  | 'SCHEDULED'    // Cita programada inicialmente
  | 'RESCHEDULED'  // Cita reprogramada
  | 'CANCELLED'    // Cita cancelada
  | 'COMPLETED'    // Cita completada (asistencia confirmada)
  | 'NO_SHOW';     // Paciente no se presentó

/**
 * Datos requeridos para reprogramar una cita existente.
 * @interface RescheduleAppointmentRequest
 */
export interface RescheduleAppointmentRequest {
  /** Nueva fecha y hora programada en formato ISO */
  scheduledDate: string;
  /** Nuevo sitio (opcional, para cambiar ubicación también) */
  siteId?: string;
}

// ========================================
// SERVICIO CONFORME AL BACKEND
// ========================================

/**
 * Objeto que contiene todas las funciones del servicio de citas.
 * @type {Object}
 */
export const appointmentService = {
  /**
   * Crea una nueva cita médica.
   * @param {AppointmentDTO} appointmentData - Datos de la cita a crear.
   * @returns {Promise<AppointmentDTO>} La cita creada con su ID asignado.
   * @throws {Error} Si faltan campos requeridos o hay error en la creación.
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
   * Obtiene todas las citas de un paciente específico.
   * @param {string} patientId - ID del paciente (UUID).
   * @returns {Promise<AppointmentDTO[]>} Lista de citas del paciente.
   * @throws {Error} Si patientId no es válido.
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
   * Obtiene todas las citas asignadas a un doctor específico.
   * @param {string} doctorId - ID del doctor (UUID).
   * @returns {Promise<AppointmentDTO[]>} Lista de citas del doctor.
   * @throws {Error} Si doctorId no es válido.
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
   * Reprograma una cita existente con nueva fecha y/o sitio.
   * @param {string} id - ID de la cita a reprogramar (UUID).
   * @param {RescheduleAppointmentRequest} newData - Nuevos datos para la cita.
   * @returns {Promise<AppointmentDTO>} La cita actualizada.
   * @throws {Error} Si faltan campos requeridos o hay error en la reprogramación.
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
   * Cancela una cita existente.
   * @param {string} id - ID de la cita a cancelar (UUID).
   * @returns {Promise<void>} No retorna datos, solo confirma la cancelación.
   * @throws {Error} Si el ID no es válido o hay error en la cancelación.
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
   * Confirma la asistencia de un paciente a una cita.
   * @param {string} id - ID de la cita donde confirmar asistencia (UUID).
   * @returns {Promise<void>} No retorna datos, solo confirma la asistencia.
   * @throws {Error} Si el ID no es válido o hay error en la confirmación.
   */
  confirmAttendance: async (id: string): Promise<void> => {
    console.log(`=== CONFIRMAR ASISTENCIA CITA ${id} ===`);

    if (!id) {
      throw new Error('id de cita es requerido');
    }

    await apiClient.put<void>(`/appointments/${id}/confirm-attendance`);
    console.log('Asistencia confirmada exitosamente');
  },

  // ========================================
  // UTILIDADES
  // ========================================

  /**
   * Formatea una fecha Date para enviarla al backend como LocalDateTime.
   * @param {Date} date - Fecha a formatear.
   * @returns {string} Fecha en formato ISO string.
   */
  formatDateForBackend: (date: Date): string => {
    return date.toISOString();
  },

  /**
   * Parsea una fecha string del backend a objeto Date.
   * @param {string} dateString - Fecha en formato ISO string.
   * @returns {Date} Objeto Date correspondiente.
   */
  parseDateFromBackend: (dateString: string): Date => {
    return new Date(dateString);
  },

  /**
   * Convierte un estado de cita a texto legible en español.
   * @param {AppointmentStatus} status - Estado de la cita.
   * @returns {string} Texto descriptivo del estado.
   */
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

  /**
   * Valida si una cadena es un UUID válido.
   * @param {string} uuid - Cadena a validar.
   * @returns {boolean} True si es un UUID válido, false en caso contrario.
   */
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
};
