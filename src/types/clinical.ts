/**
 * Clinical Module Types
 * Tipos relacionados con el módulo de atención médica
 */

/**
 * Signos Vitales
 */
export interface VitalSign {
  id?: string;
  consultationId?: string;
  type: 'blood_pressure' | 'temperature' | 'heart_rate' | 'respiratory_rate' | 'oxygen_saturation' | 'weight' | 'height';
  value: string;
  unit?: string;
  recordedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Síntomas reportados por el paciente
 */
export interface Symptom {
  id?: string;
  consultationId?: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration?: string; // Ej: "3 días", "1 semana"
  createdAt?: string;
}

/**
 * Diagnóstico médico
 */
export interface Diagnosis {
  id?: string;
  consultationId?: string;
  code?: string; // Código CIE-10
  description: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Tratamiento (puede incluir terapias no farmacológicas)
 */
export interface Treatment {
  id?: string;
  consultationId?: string;
  type: 'pharmacological' | 'therapy' | 'surgery' | 'other';
  description: string;
  duration?: string;
  instructions?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Medicamento del catálogo
 */
export interface Medication {
  id: string;
  name: string;
  unit: string; // mg, ml, tabletas, etc.
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Detalle de prescripción (medicamento + dosis)
 */
export interface PrescriptionDetail {
  id?: string;
  medicationId: string;
  medication?: Medication;
  dosage: string; // Ej: "500mg"
  frequency: string; // Ej: "cada 8 horas"
  duration: string; // Ej: "7 días"
  instructions?: string;
}

/**
 * Prescripción completa (receta médica)
 */
export interface Prescription {
  id?: string;
  consultationId?: string;
  details: PrescriptionDetail[];
  generalInstructions?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Historia clínica (antecedentes)
 */
export interface MedicalHistory {
  id?: string;
  patientId: string;
  condition: string;
  category: 'allergy' | 'chronic_disease' | 'surgery' | 'family_history' | 'other';
  notes?: string;
  diagnosedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Consulta médica completa
 */
export interface Consultation {
  id?: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  reason: string; // Motivo de consulta
  notes?: string; // Notas generales del doctor
  
  // Datos clínicos
  vitalSigns?: VitalSign[];
  symptoms?: Symptom[];
  diagnoses?: Diagnosis[];
  treatments?: Treatment[];
  prescriptions?: Prescription[];
  
  // Metadata
  status: 'in_progress' | 'completed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request para crear una consulta
 */
export interface CreateConsultationRequest {
  appointmentId: string;
  reason: string;
  notes?: string;
}

/**
 * Request para registrar signos vitales
 */
export interface RegisterVitalSignsRequest {
  consultationId: string;
  vitalSigns: Omit<VitalSign, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[];
}

/**
 * Request para registrar síntomas
 */
export interface RegisterSymptomsRequest {
  consultationId: string;
  symptoms: Omit<Symptom, 'id' | 'consultationId' | 'createdAt'>[];
}

/**
 * Request para crear diagnóstico
 */
export interface CreateDiagnosisRequest {
  consultationId: string;
  diagnoses: Omit<Diagnosis, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[];
}

/**
 * Request para crear tratamiento
 */
export interface CreateTreatmentRequest {
  consultationId: string;
  treatments: Omit<Treatment, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[];
}

/**
 * Request para crear prescripción
 */
export interface CreatePrescriptionRequest {
  consultationId: string;
  details: Omit<PrescriptionDetail, 'id'>[];
  generalInstructions?: string;
}

/**
 * Expediente médico del paciente (resumen)
 */
export interface MedicalRecord {
  id: string;
  patientId: string;
  patient?: {
    id: string;
    fullName: string;
    email: string;
    dateOfBirth?: string;
    bloodType?: string;
    phoneNumber?: string;
  };
  medicalHistory: MedicalHistory[];
  consultations: Consultation[];
  createdAt: string;
  updatedAt: string;
}
