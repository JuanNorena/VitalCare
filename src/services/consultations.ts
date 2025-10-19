/**
 * Consultations Service
 * Maneja todas las peticiones relacionadas con consultas médicas y atención clínica
 */

import { apiClient } from './api';
import type {
  Consultation,
  CreateConsultationRequest,
  RegisterVitalSignsRequest,
  RegisterSymptomsRequest,
  CreateDiagnosisRequest,
  CreateTreatmentRequest,
  CreatePrescriptionRequest,
  MedicalRecord,
  MedicalHistory,
  Medication,
} from '../types/clinical';

/**
 * CONSULTAS
 */

/**
 * Crear una nueva consulta médica a partir de una cita
 */
export const createConsultation = async (
  data: CreateConsultationRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>('/consultations', data);
};

/**
 * Obtener una consulta por ID
 */
export const getConsultationById = async (id: string): Promise<Consultation> => {
  return apiClient.get<Consultation>(`/consultations/${id}`);
};

/**
 * Obtener consulta por ID de cita
 */
export const getConsultationByAppointmentId = async (
  appointmentId: string
): Promise<Consultation> => {
  return apiClient.get<Consultation>(`/consultations/appointment/${appointmentId}`);
};

/**
 * Actualizar notas generales de la consulta
 */
export const updateConsultationNotes = async (
  consultationId: string,
  notes: string
): Promise<Consultation> => {
  return apiClient.put<Consultation>(`/consultations/${consultationId}/notes`, { notes });
};

/**
 * Completar una consulta (marcar como finalizada)
 */
export const completeConsultation = async (consultationId: string): Promise<Consultation> => {
  return apiClient.put<Consultation>(`/consultations/${consultationId}/complete`, {});
};

/**
 * SIGNOS VITALES
 */

/**
 * Registrar signos vitales en una consulta
 */
export const registerVitalSigns = async (
  data: RegisterVitalSignsRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>(`/consultations/${data.consultationId}/vital-signs`, {
    vitalSigns: data.vitalSigns,
  });
};

/**
 * SÍNTOMAS
 */

/**
 * Registrar síntomas del paciente
 */
export const registerSymptoms = async (
  data: RegisterSymptomsRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>(`/consultations/${data.consultationId}/symptoms`, {
    symptoms: data.symptoms,
  });
};

/**
 * DIAGNÓSTICOS
 */

/**
 * Crear diagnóstico(s) en una consulta
 */
export const createDiagnosis = async (
  data: CreateDiagnosisRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>(`/consultations/${data.consultationId}/diagnoses`, {
    diagnoses: data.diagnoses,
  });
};

/**
 * TRATAMIENTOS
 */

/**
 * Crear tratamiento(s) en una consulta
 */
export const createTreatment = async (
  data: CreateTreatmentRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>(`/consultations/${data.consultationId}/treatments`, {
    treatments: data.treatments,
  });
};

/**
 * PRESCRIPCIONES (RECETAS MÉDICAS)
 */

/**
 * Crear prescripción con medicamentos
 */
export const createPrescription = async (
  data: CreatePrescriptionRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>(`/consultations/${data.consultationId}/prescriptions`, {
    details: data.details,
    generalInstructions: data.generalInstructions,
  });
};

/**
 * Obtener catálogo de medicamentos disponibles
 */
export const getMedications = async (): Promise<Medication[]> => {
  return apiClient.get<Medication[]>('/medications');
};

/**
 * Buscar medicamentos por nombre
 */
export const searchMedications = async (query: string): Promise<Medication[]> => {
  return apiClient.get<Medication[]>(`/medications/search?q=${encodeURIComponent(query)}`);
};

/**
 * HISTORIA CLÍNICA / EXPEDIENTE MÉDICO
 */

/**
 * Obtener el expediente médico completo de un paciente
 */
export const getMedicalRecord = async (patientId: string): Promise<MedicalRecord> => {
  return apiClient.get<MedicalRecord>(`/patients/${patientId}/medical-record`);
};

/**
 * Obtener historia clínica (antecedentes) de un paciente
 */
export const getMedicalHistory = async (patientId: string): Promise<MedicalHistory[]> => {
  return apiClient.get<MedicalHistory[]>(`/patients/${patientId}/medical-history`);
};

/**
 * Agregar un antecedente a la historia clínica
 */
export const addMedicalHistory = async (
  patientId: string,
  data: Omit<MedicalHistory, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>
): Promise<MedicalHistory> => {
  return apiClient.post<MedicalHistory>(`/patients/${patientId}/medical-history`, data);
};

/**
 * Obtener todas las consultas de un paciente
 */
export const getPatientConsultations = async (patientId: string): Promise<Consultation[]> => {
  return apiClient.get<Consultation[]>(`/patients/${patientId}/consultations`);
};
