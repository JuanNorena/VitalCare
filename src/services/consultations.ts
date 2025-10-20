/**
 * Consultations Service
 * Maneja todas las peticiones relacionadas con consultas médicas y atención clínica
 * 
 * IMPORTANTE: Todos los endpoints de consultas médicas usan el prefijo /api/clinical en el backend
 * Controller: ConsultationController (@RequestMapping("/api/clinical"))
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
 * Endpoint: POST /api/clinical/consultations
 */
export const createConsultation = async (
  data: CreateConsultationRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>('/clinical/consultations', data);
};

/**
 * Obtener una consulta por ID
 * Endpoint: GET /api/clinical/consultations/{id}
 */
export const getConsultationById = async (id: string): Promise<Consultation> => {
  return apiClient.get<Consultation>(`/clinical/consultations/${id}`);
};

/**
 * Obtener consulta por ID de cita
 * Endpoint: GET /api/clinical/consultations/appointment/{appointmentId}
 */
export const getConsultationByAppointmentId = async (
  appointmentId: string
): Promise<Consultation> => {
  return apiClient.get<Consultation>(`/clinical/consultations/appointment/${appointmentId}`);
};

/**
 * Actualizar notas generales de la consulta
 * Endpoint: PUT /api/clinical/consultations/{consultationId}/notes
 */
export const updateConsultationNotes = async (
  consultationId: string,
  notes: string
): Promise<Consultation> => {
  return apiClient.put<Consultation>(`/clinical/consultations/${consultationId}/notes`, { notes });
};

/**
 * Completar una consulta (marcar como finalizada)
 * Endpoint: PUT /api/clinical/consultations/{consultationId}/complete
 */
export const completeConsultation = async (consultationId: string): Promise<Consultation> => {
  return apiClient.put<Consultation>(`/clinical/consultations/${consultationId}/complete`, {});
};

/**
 * SIGNOS VITALES
 */

/**
 * Registrar signos vitales en una consulta
 * Endpoint: POST /api/clinical/consultations/{consultationId}/vital-signs
 */
export const registerVitalSigns = async (
  data: RegisterVitalSignsRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>(`/clinical/consultations/${data.consultationId}/vital-signs`, {
    vitalSigns: data.vitalSigns,
  });
};

/**
 * SÍNTOMAS
 */

/**
 * Registrar síntomas del paciente
 * Endpoint: POST /api/clinical/consultations/{consultationId}/symptoms
 */
export const registerSymptoms = async (
  data: RegisterSymptomsRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>(`/clinical/consultations/${data.consultationId}/symptoms`, {
    symptoms: data.symptoms,
  });
};

/**
 * DIAGNÓSTICOS
 */

/**
 * Crear diagnóstico(s) en una consulta
 * Endpoint: POST /api/clinical/consultations/{consultationId}/diagnoses
 */
export const createDiagnosis = async (
  data: CreateDiagnosisRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>(`/clinical/consultations/${data.consultationId}/diagnoses`, {
    diagnoses: data.diagnoses,
  });
};

/**
 * TRATAMIENTOS
 */

/**
 * Crear tratamiento(s) en una consulta
 * Endpoint: POST /api/clinical/consultations/{consultationId}/treatments
 */
export const createTreatment = async (
  data: CreateTreatmentRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>(`/clinical/consultations/${data.consultationId}/treatments`, {
    treatments: data.treatments,
  });
};

/**
 * PRESCRIPCIONES (RECETAS MÉDICAS)
 */

/**
 * Crear prescripción con medicamentos
 * Endpoint: POST /api/clinical/consultations/{consultationId}/prescriptions
 */
export const createPrescription = async (
  data: CreatePrescriptionRequest
): Promise<Consultation> => {
  return apiClient.post<Consultation>(`/clinical/consultations/${data.consultationId}/prescriptions`, {
    details: data.details,
    generalInstructions: data.generalInstructions,
  });
};

/**
 * Obtener catálogo de medicamentos disponibles
 * Endpoint: GET /api/clinical/medications
 */
export const getMedications = async (): Promise<Medication[]> => {
  return apiClient.get<Medication[]>('/clinical/medications');
};

/**
 * Buscar medicamentos por nombre
 * NOTA: Este endpoint puede no existir en el backend actual
 */
export const searchMedications = async (query: string): Promise<Medication[]> => {
  return apiClient.get<Medication[]>(`/clinical/medications/search?q=${encodeURIComponent(query)}`);
};

/**
 * HISTORIA CLÍNICA / EXPEDIENTE MÉDICO
 */

/**
 * Obtener el expediente médico completo de un paciente
 * Endpoint: GET /api/clinical/patients/{patientId}/medical-record
 */
export const getMedicalRecord = async (patientId: string): Promise<MedicalRecord> => {
  return apiClient.get<MedicalRecord>(`/clinical/patients/${patientId}/medical-record`);
};

/**
 * Obtener historia clínica (antecedentes) de un paciente
 * Endpoint: GET /api/clinical/patients/{patientId}/medical-history
 */
export const getMedicalHistory = async (patientId: string): Promise<MedicalHistory[]> => {
  return apiClient.get<MedicalHistory[]>(`/clinical/patients/${patientId}/medical-history`);
};

/**
 * Agregar un antecedente a la historia clínica
 * Endpoint: POST /api/clinical/patients/{patientId}/medical-history
 */
export const addMedicalHistory = async (
  patientId: string,
  data: Omit<MedicalHistory, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>
): Promise<MedicalHistory> => {
  return apiClient.post<MedicalHistory>(`/clinical/patients/${patientId}/medical-history`, data);
};

/**
 * Obtener todas las consultas de un paciente
 * Endpoint: GET /api/clinical/patients/{patientId}/consultations
 */
export const getPatientConsultations = async (patientId: string): Promise<Consultation[]> => {
  return apiClient.get<Consultation[]>(`/clinical/patients/${patientId}/consultations`);
};
