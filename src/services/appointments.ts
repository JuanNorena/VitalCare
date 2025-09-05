/**
 * Servicio de citas médicas para el backend Java
 */

import { apiClient } from './api';
import type { 
  Appointment, 
  CreateAppointmentRequest,
  AppointmentCreate
} from '@/types/api';

export const appointmentService = {
  // Crear nueva cita (POST /api/appointments/create)
  createAppointment: async (data: CreateAppointmentRequest): Promise<Appointment> => {
    return apiClient.post<Appointment>('/appointments/create', data);
  },

  // Obtener citas por paciente (GET /api/appointments/patient/{patientId})
  getAppointmentsByPatient: async (patientId: string): Promise<Appointment[]> => {
    return apiClient.get<Appointment[]>(`/appointments/patient/${patientId}`);
  },

  // Obtener citas por doctor (GET /api/appointments/doctor/{doctorId})
  getAppointmentsByDoctor: async (doctorId: string): Promise<Appointment[]> => {
    return apiClient.get<Appointment[]>(`/appointments/doctor/${doctorId}`);
  },

  // Reprogramar cita (PUT /api/appointments/{id}/reschedule)
  rescheduleAppointment: async (id: string, appointmentData: Partial<Appointment>): Promise<Appointment> => {
    return apiClient.put<Appointment>(`/appointments/${id}/reschedule`, appointmentData);
  },

  // Cancelar cita (PUT /api/appointments/{id}/cancel)
  cancelAppointment: async (id: string): Promise<void> => {
    return apiClient.put<void>(`/appointments/${id}/cancel`);
  },

  // Confirmar asistencia (PUT /api/appointments/{id}/confirm-attendance)
  confirmAttendance: async (id: string): Promise<void> => {
    return apiClient.put<void>(`/appointments/${id}/confirm-attendance`);
  },
};

// Función auxiliar para usar AppointmentCreate
export const createAppointment = async (data: AppointmentCreate): Promise<Appointment> => {
  // Transformar AppointmentCreate a CreateAppointmentRequest
  const requestData: CreateAppointmentRequest = {
    patientId: data.patientId,
    doctorId: data.doctorId,
    siteId: data.siteId || 'default-site-id', // Valor por defecto
    scheduledDate: data.scheduledDate
  };
  
  return appointmentService.createAppointment(requestData);
};
