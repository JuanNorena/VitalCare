/**
 * Página de Atención Médica / Consulta
 * 
 * Permite al doctor realizar una consulta médica completa:
 * 1. Ver información del paciente y la cita
 * 2. Registrar signos vitales
 * 3. Registrar síntomas
 * 4. Crear diagnóstico
 * 5. Definir tratamiento
 * 6. Finalizar consulta
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VitalSignsForm } from '@/components/clinical/VitalSignsForm';
import { SymptomsForm } from '@/components/clinical/SymptomsForm';
import { DiagnosisForm } from '@/components/clinical/DiagnosisForm';
import { TreatmentForm } from '@/components/clinical/TreatmentForm';
import { useToast } from '@/contexts/ToastContext';
import type { AppointmentDTO } from '@/services/appointments';
import type { VitalSign, Symptom, Diagnosis, Treatment } from '@/types/clinical';

type ConsultationStep = 'vital-signs' | 'symptoms' | 'diagnosis' | 'treatment' | 'summary';

export function ConsultationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  // Datos de la cita pasados desde DoctorAppointmentsPage
  const appointment = location.state?.appointment as AppointmentDTO | undefined;

  // Estado de la consulta
  const [currentStep, setCurrentStep] = useState<ConsultationStep>('vital-signs');
  const [consultationData, setConsultationData] = useState({
    vitalSigns: [] as Omit<VitalSign, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[],
    symptoms: [] as Omit<Symptom, 'id' | 'consultationId' | 'createdAt'>[],
    diagnoses: [] as Omit<Diagnosis, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[],
    treatments: [] as Omit<Treatment, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[],
    notes: ''
  });

  // Handlers para cada formulario
  const handleVitalSignsSubmit = async (vitalSigns: Omit<VitalSign, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      setConsultationData({ ...consultationData, vitalSigns });
      showSuccess('Signos vitales registrados', 'Los signos vitales han sido registrados correctamente');
      setCurrentStep('symptoms');
    } catch (error) {
      showError('Error', 'No se pudieron registrar los signos vitales');
    }
  };

  const handleSymptomsSubmit = async (symptoms: Omit<Symptom, 'id' | 'consultationId' | 'createdAt'>[]) => {
    try {
      setConsultationData({ ...consultationData, symptoms });
      showSuccess('Síntomas registrados', 'Los síntomas han sido registrados correctamente');
      setCurrentStep('diagnosis');
    } catch (error) {
      showError('Error', 'No se pudieron registrar los síntomas');
    }
  };

  const handleDiagnosisSubmit = async (diagnoses: Omit<Diagnosis, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      setConsultationData({ ...consultationData, diagnoses });
      showSuccess('Diagnóstico registrado', 'El diagnóstico ha sido registrado correctamente');
      setCurrentStep('treatment');
    } catch (error) {
      showError('Error', 'No se pudo registrar el diagnóstico');
    }
  };

  const handleTreatmentSubmit = async (treatments: Omit<Treatment, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      setConsultationData({ ...consultationData, treatments });
      showSuccess('Tratamiento registrado', 'El tratamiento ha sido registrado correctamente');
      setCurrentStep('summary');
    } catch (error) {
      showError('Error', 'No se pudo registrar el tratamiento');
    }
  };

  const handleCompleteConsultation = () => {
    showInfo(
      'Funcionalidad en desarrollo',
      'Los endpoints del backend para consultas médicas están en desarrollo. Los datos se han guardado localmente.'
    );
    console.log('📋 Datos completos de la consulta:', consultationData);
    navigate('/doctor/appointments');
  };

  const handleSkipStep = () => {
    const steps: ConsultationStep[] = ['vital-signs', 'symptoms', 'diagnosis', 'treatment', 'summary'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleGoBack = () => {
    const steps: ConsultationStep[] = ['vital-signs', 'symptoms', 'diagnosis', 'treatment', 'summary'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const getStepNumber = () => {
    const steps: ConsultationStep[] = ['vital-signs', 'symptoms', 'diagnosis', 'treatment', 'summary'];
    return steps.indexOf(currentStep) + 1;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--vc-bg)] px-4">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--vc-text)] mb-2">Error al cargar la cita</h2>
          <p className="text-[var(--vc-text)]/70 mb-6">
            No se pudo cargar la información de la cita médica.
          </p>
          <Button onClick={() => navigate('/doctor/appointments')}>
            Volver a Citas
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--vc-bg)] transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/doctor/appointments')}
            className="mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Volver a Citas
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--vc-text)]">
                Atención Médica
              </h1>
              <p className="text-[var(--vc-text)]/70">
                Consulta médica del {formatDate(appointment.scheduledDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Información del Paciente */}
        <Card className="p-6 mb-6 bg-[var(--vc-card-bg)] border-0 shadow-lg">
          <h2 className="text-lg font-semibold text-[var(--vc-text)] mb-4">Información del Paciente</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-[var(--vc-text)]/60 mb-1">Nombre</p>
              <p className="font-medium text-[var(--vc-text)]">
                {appointment.patient?.username || appointment.patientEmail || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--vc-text)]/60 mb-1">Email</p>
              <p className="font-medium text-[var(--vc-text)]">
                {appointment.patient?.email || appointment.patientEmail || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--vc-text)]/60 mb-1">ID Cita</p>
              <p className="font-medium text-[var(--vc-text)] font-mono text-sm">
                {appointment.id?.substring(0, 13)}...
              </p>
            </div>
          </div>
        </Card>

        {/* Progress Indicator */}
        <Card className="p-6 mb-6 bg-[var(--vc-card-bg)] border-0 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-[var(--vc-text)]">Progreso de la Consulta</h3>
            <span className="text-sm text-[var(--vc-text)]/60">Paso {getStepNumber()} de 5</span>
          </div>
          <div className="flex items-center gap-2">
            {['vital-signs', 'symptoms', 'diagnosis', 'treatment', 'summary'].map((step, index) => {
              const steps: ConsultationStep[] = ['vital-signs', 'symptoms', 'diagnosis', 'treatment', 'summary'];
              const isCompleted = steps.indexOf(currentStep) > index;
              const isCurrent = step === currentStep;
              
              return (
                <div
                  key={step}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    isCompleted || isCurrent
                      ? 'bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              );
            })}
          </div>
        </Card>

        {/* Formularios según el paso actual */}
        <div className="space-y-6">
          {currentStep === 'vital-signs' && (
            <>
              <VitalSignsForm 
                onSubmit={handleVitalSignsSubmit}
                initialData={consultationData.vitalSigns}
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleSkipStep}>
                  Omitir
                </Button>
              </div>
            </>
          )}

          {currentStep === 'symptoms' && (
            <>
              <SymptomsForm onSubmit={handleSymptomsSubmit} />
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleGoBack}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={handleSkipStep}>
                  Omitir
                </Button>
              </div>
            </>
          )}

          {currentStep === 'diagnosis' && (
            <>
              <DiagnosisForm onSubmit={handleDiagnosisSubmit} />
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleGoBack}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={handleSkipStep}>
                  Omitir
                </Button>
              </div>
            </>
          )}

          {currentStep === 'treatment' && (
            <>
              <TreatmentForm onSubmit={handleTreatmentSubmit} />
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleGoBack}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={handleSkipStep}>
                  Omitir
                </Button>
              </div>
            </>
          )}

          {currentStep === 'summary' && (
            <Card className="p-6 bg-[var(--vc-card-bg)] border-0 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--vc-text)]">Resumen de la Consulta</h2>
                  <p className="text-sm text-[var(--vc-text)]/70">Revisa los datos antes de finalizar</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Signos Vitales */}
                <div>
                  <h3 className="font-semibold text-[var(--vc-text)] mb-2">Signos Vitales</h3>
                  {consultationData.vitalSigns.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {consultationData.vitalSigns.map((vs, i) => (
                        <div key={i} className="p-3 bg-[var(--vc-bg)] rounded-lg">
                          <p className="text-xs text-[var(--vc-text)]/60">{vs.type.replace('_', ' ')}</p>
                          <p className="font-semibold text-[var(--vc-text)]">{vs.value} {vs.unit}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--vc-text)]/50">No registrado</p>
                  )}
                </div>

                {/* Síntomas */}
                <div>
                  <h3 className="font-semibold text-[var(--vc-text)] mb-2">Síntomas</h3>
                  {consultationData.symptoms.length > 0 ? (
                    <ul className="space-y-2">
                      {consultationData.symptoms.map((s, i) => (
                        <li key={i} className="p-3 bg-[var(--vc-bg)] rounded-lg">
                          <p className="text-[var(--vc-text)]">{s.description}</p>
                          <p className="text-xs text-[var(--vc-text)]/60 mt-1">
                            Severidad: {s.severity} {s.duration && `• Duración: ${s.duration}`}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--vc-text)]/50">No registrado</p>
                  )}
                </div>

                {/* Diagnóstico */}
                <div>
                  <h3 className="font-semibold text-[var(--vc-text)] mb-2">Diagnóstico</h3>
                  {consultationData.diagnoses.length > 0 ? (
                    <ul className="space-y-2">
                      {consultationData.diagnoses.map((d, i) => (
                        <li key={i} className="p-3 bg-[var(--vc-bg)] rounded-lg">
                          <p className="font-medium text-[var(--vc-text)]">
                            {d.code && `[${d.code}] `}{d.description}
                          </p>
                          {d.notes && <p className="text-sm text-[var(--vc-text)]/70 mt-1">{d.notes}</p>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--vc-text)]/50">No registrado</p>
                  )}
                </div>

                {/* Tratamiento */}
                <div>
                  <h3 className="font-semibold text-[var(--vc-text)] mb-2">Tratamiento</h3>
                  {consultationData.treatments.length > 0 ? (
                    <ul className="space-y-2">
                      {consultationData.treatments.map((t, i) => (
                        <li key={i} className="p-3 bg-[var(--vc-bg)] rounded-lg">
                          <p className="text-xs text-[var(--vc-text)]/60 mb-1">{t.type}</p>
                          <p className="font-medium text-[var(--vc-text)]">{t.description}</p>
                          {(t.duration || t.instructions) && (
                            <p className="text-sm text-[var(--vc-text)]/70 mt-1">
                              {t.duration && `Duración: ${t.duration}`}
                              {t.duration && t.instructions && ' • '}
                              {t.instructions}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--vc-text)]/50">No registrado</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-[var(--vc-border)] mt-6">
                <Button variant="outline" onClick={handleGoBack}>
                  Anterior
                </Button>
                <Button onClick={handleCompleteConsultation}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Finalizar Consulta
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
